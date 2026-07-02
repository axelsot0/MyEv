"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TZ_OFFSET } from "@/lib/metrics";
import type { JiraStatus } from "@/lib/types";

function revalidateIssue(issueId: string, sprintId: string) {
  revalidatePath(`/issues/${issueId}`);
  revalidatePath(`/sprints/${sprintId}`);
  revalidatePath("/");
}

export async function updateJiraStatus(formData: FormData) {
  const supabase = await createClient();
  const issueId = String(formData.get("issue_id"));
  const sprintId = String(formData.get("sprint_id"));
  const status = String(formData.get("jira_status")) as JiraStatus;

  const { error } = await supabase
    .from("issues")
    .update({ jira_status: status })
    .eq("id", issueId);
  if (error) throw new Error(error.message);
  revalidateIssue(issueId, sprintId);
}

export async function createBranch(formData: FormData) {
  const supabase = await createClient();
  const issueId = String(formData.get("issue_id"));
  const sprintId = String(formData.get("sprint_id"));
  const name = String(formData.get("name") ?? "").trim();
  const createdOn = String(formData.get("created_on") ?? "");
  if (!name || !createdOn) throw new Error("Nombre y fecha requeridos");

  const { error } = await supabase.from("branches").insert({
    issue_id: issueId,
    name,
    created_on: createdOn,
  });
  if (error) throw new Error(error.message);
  revalidateIssue(issueId, sprintId);
}

export async function markBranchDeleted(formData: FormData) {
  const supabase = await createClient();
  const branchId = String(formData.get("branch_id"));
  const issueId = String(formData.get("issue_id"));
  const sprintId = String(formData.get("sprint_id"));
  const deletedOn = String(formData.get("deleted_on") ?? "");
  if (!deletedOn) throw new Error("Fecha requerida");

  const { error } = await supabase
    .from("branches")
    .update({ deleted_on: deletedOn })
    .eq("id", branchId);
  if (error) throw new Error(error.message);
  revalidateIssue(issueId, sprintId);
}

export async function createPr(formData: FormData) {
  const supabase = await createClient();
  const issueId = String(formData.get("issue_id"));
  const sprintId = String(formData.get("sprint_id"));
  const url = String(formData.get("url") ?? "").trim() || null;
  const sourceBranch = String(formData.get("source_branch") ?? "").trim();
  const targetBranch =
    String(formData.get("target_branch") ?? "").trim() || "develop";
  const openedAt = String(formData.get("opened_at") ?? "");
  const branchId = String(formData.get("branch_id") ?? "") || null;
  if (!sourceBranch || !openedAt) {
    throw new Error("Rama origen y fecha de apertura requeridas");
  }

  const { error } = await supabase.from("pull_requests").insert({
    issue_id: issueId,
    branch_id: branchId,
    url,
    source_branch: sourceBranch,
    target_branch: targetBranch,
    opened_at: `${openedAt}:00${TZ_OFFSET}`,
  });
  if (error) throw new Error(error.message);
  revalidateIssue(issueId, sprintId);
}

export async function markPrMerged(formData: FormData) {
  const supabase = await createClient();
  const prId = String(formData.get("pr_id"));
  const issueId = String(formData.get("issue_id"));
  const sprintId = String(formData.get("sprint_id"));
  const mergedAt = String(formData.get("merged_at") ?? "");
  if (!mergedAt) throw new Error("Fecha de merge requerida");

  const { error } = await supabase
    .from("pull_requests")
    .update({ status: "merged", merged_at: `${mergedAt}:00${TZ_OFFSET}` })
    .eq("id", prId);
  if (error) throw new Error(error.message);
  revalidateIssue(issueId, sprintId);
}

export async function updateIssue(formData: FormData) {
  const supabase = await createClient();
  const issueId = String(formData.get("issue_id"));
  const sprintId = String(formData.get("sprint_id"));
  const jiraKey = String(formData.get("jira_key") ?? "").trim().toUpperCase();
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "task");
  const moduleId = String(formData.get("module_id") ?? "");
  const pointsRaw = String(formData.get("points") ?? "");
  const points =
    type === "feature" && pointsRaw !== "" ? Number(pointsRaw) : null;
  const committed = formData.get("committed") === "on";
  if (!jiraKey || !title || !moduleId) throw new Error("Faltan campos");

  const { error } = await supabase
    .from("issues")
    .update({
      jira_key: jiraKey,
      title,
      type,
      module_id: moduleId,
      points,
      committed,
    })
    .eq("id", issueId);
  if (error) throw new Error(error.message);
  revalidateIssue(issueId, sprintId);
}

export async function deleteIssue(formData: FormData) {
  const supabase = await createClient();
  const issueId = String(formData.get("issue_id"));
  const sprintId = String(formData.get("sprint_id"));

  const { error } = await supabase.from("issues").delete().eq("id", issueId);
  if (error) throw new Error(error.message);

  revalidatePath(`/sprints/${sprintId}`);
  revalidatePath("/");
  redirect(`/sprints/${sprintId}`);
}

export async function deleteBranch(formData: FormData) {
  const supabase = await createClient();
  const branchId = String(formData.get("branch_id"));
  const issueId = String(formData.get("issue_id"));
  const sprintId = String(formData.get("sprint_id"));

  const { error } = await supabase
    .from("branches")
    .delete()
    .eq("id", branchId);
  if (error) throw new Error(error.message);
  revalidateIssue(issueId, sprintId);
}

export async function deletePr(formData: FormData) {
  const supabase = await createClient();
  const prId = String(formData.get("pr_id"));
  const issueId = String(formData.get("issue_id"));
  const sprintId = String(formData.get("sprint_id"));

  const { error } = await supabase
    .from("pull_requests")
    .delete()
    .eq("id", prId);
  if (error) throw new Error(error.message);
  revalidateIssue(issueId, sprintId);
}

export async function markPrDeclined(formData: FormData) {
  const supabase = await createClient();
  const prId = String(formData.get("pr_id"));
  const issueId = String(formData.get("issue_id"));
  const sprintId = String(formData.get("sprint_id"));

  const { error } = await supabase
    .from("pull_requests")
    .update({ status: "declined" })
    .eq("id", prId);
  if (error) throw new Error(error.message);
  revalidateIssue(issueId, sprintId);
}
