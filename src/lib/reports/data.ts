import { createClient } from "@/lib/supabase/server";
import type { IssueWithRelations, Sprint } from "@/lib/types";

export interface SprintReportData {
  sprint: Sprint;
  developerName: string;
  issues: IssueWithRelations[];
}

export async function getSprintReportData(
  sprintId: string,
): Promise<SprintReportData | null> {
  const supabase = await createClient();

  const { data: sprint } = await supabase
    .from("sprints")
    .select("*")
    .eq("id", sprintId)
    .maybeSingle();
  if (!sprint) return null;

  const { data: dev } = await supabase
    .from("developers")
    .select("name")
    .eq("id", sprint.developer_id)
    .maybeSingle();

  const { data: issuesRaw } = await supabase
    .from("issues")
    .select("*, modules(id, name), branches(*), pull_requests(*)")
    .eq("sprint_id", sprintId)
    .order("created_at");

  return {
    sprint: sprint as Sprint,
    developerName: dev?.name ?? "",
    issues: (issuesRaw ?? []) as unknown as IssueWithRelations[],
  };
}
