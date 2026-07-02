"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createModule(formData: FormData) {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Nombre requerido");

  const { error } = await supabase.from("modules").insert({ name });
  if (error) throw new Error(error.message);

  revalidatePath("/modules");
}
