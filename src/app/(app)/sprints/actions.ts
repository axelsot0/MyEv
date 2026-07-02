"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TZ_OFFSET } from "@/lib/metrics";
import type { IssueType, JiraStatus } from "@/lib/types";

export async function createSprint(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const start = String(formData.get("start_date") ?? "");
  let end = String(formData.get("end_date") ?? "");
  const planningTime = String(formData.get("planning_time") ?? "13:00");
  if (!name || !start) throw new Error("Nombre y fecha de inicio requeridos");

  if (!end) {
    // Sprint de 2 semanas: cierra el martes antes del proximo planning
    const d = new Date(`${start}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 13);
    end = d.toISOString().slice(0, 10);
  }

  const { data, error } = await supabase
    .from("sprints")
    .insert({
      developer_id: user.id,
      name,
      start_date: start,
      end_date: end,
      planning_ended_at: `${start}T${planningTime}:00${TZ_OFFSET}`,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/sprints");
  redirect(`/sprints/${data.id}`);
}

export async function updateSprint(formData: FormData) {
  const supabase = await createClient();
  const sprintId = String(formData.get("sprint_id"));
  const name = String(formData.get("name") ?? "").trim();
  const start = String(formData.get("start_date") ?? "");
  const end = String(formData.get("end_date") ?? "");
  const planningEndedAt = String(formData.get("planning_ended_at") ?? "");
  if (!sprintId || !name || !start || !end || !planningEndedAt) {
    throw new Error("Faltan campos");
  }

  const { error } = await supabase
    .from("sprints")
    .update({
      name,
      start_date: start,
      end_date: end,
      planning_ended_at: `${planningEndedAt}:00${TZ_OFFSET}`,
    })
    .eq("id", sprintId);
  if (error) throw new Error(error.message);

  revalidatePath("/sprints");
  revalidatePath(`/sprints/${sprintId}`);
  revalidatePath("/");
  redirect(`/sprints/${sprintId}`);
}

export async function deleteSprint(formData: FormData) {
  const supabase = await createClient();
  const sprintId = String(formData.get("sprint_id"));

  const { error } = await supabase
    .from("sprints")
    .delete()
    .eq("id", sprintId);
  if (error) throw new Error(error.message);

  revalidatePath("/sprints");
  revalidatePath("/");
  redirect("/sprints");
}

export async function createIssue(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sprintId = String(formData.get("sprint_id") ?? "");
  const jiraKey = String(formData.get("jira_key") ?? "").trim().toUpperCase();
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "task") as IssueType;
  const moduleId = String(formData.get("module_id") ?? "");
  const jiraStatus = String(
    formData.get("jira_status") ?? "To Do",
  ) as JiraStatus;
  const pointsRaw = String(formData.get("points") ?? "");
  const points =
    type === "feature" && pointsRaw !== "" ? Number(pointsRaw) : null;
  const committed = formData.get("committed") === "on";

  if (!sprintId || !jiraKey || !title || !moduleId) {
    throw new Error("Faltan campos requeridos");
  }

  const { error } = await supabase.from("issues").insert({
    sprint_id: sprintId,
    developer_id: user.id,
    module_id: moduleId,
    jira_key: jiraKey,
    title,
    type,
    points,
    jira_status: jiraStatus,
    committed,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/sprints/${sprintId}`);
  revalidatePath("/");
}
