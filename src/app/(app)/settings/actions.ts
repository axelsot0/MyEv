"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Nombre requerido");

  const { error } = await supabase
    .from("developers")
    .update({ name })
    .eq("id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/", "layout");
}

export async function updateAlertSettings(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const toInt = (key: string, fallback: number) => {
    const n = Number(formData.get(key));
    return Number.isInteger(n) && n >= 0 ? n : fallback;
  };

  const { error } = await supabase.from("alert_settings").upsert({
    developer_id: user.id,
    pr_open_days: toInt("pr_open_days", 2),
    branch_active_days: toInt("branch_active_days", 3),
    merged_not_deleted_days: toInt("merged_not_deleted_days", 1),
  });
  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/");
}
