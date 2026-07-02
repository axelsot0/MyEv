export type IssueType = "feature" | "bug" | "task";

export type JiraStatus =
  | "To Do"
  | "InProgress"
  | "Waiting For Dependency"
  | "Progress Done"
  | "Inspection"
  | "Done";

export type PrStatus = "open" | "merged" | "declined";

export interface Developer {
  id: string;
  name: string;
  email: string;
}

export interface Sprint {
  id: string;
  developer_id: string;
  name: string;
  start_date: string;
  end_date: string;
  planning_ended_at: string;
}

export interface Module {
  id: string;
  name: string;
}

export interface Issue {
  id: string;
  sprint_id: string;
  developer_id: string;
  module_id: string;
  jira_key: string;
  title: string;
  type: IssueType;
  points: number | null;
  jira_status: JiraStatus;
  committed: boolean;
}

export interface Branch {
  id: string;
  issue_id: string;
  name: string;
  created_on: string;
  deleted_on: string | null;
}

export interface PullRequest {
  id: string;
  issue_id: string;
  branch_id: string | null;
  url: string | null;
  source_branch: string;
  target_branch: string;
  status: PrStatus;
  opened_at: string;
  merged_at: string | null;
}

export interface IssueWithRelations extends Issue {
  modules: Module | null;
  branches: Branch[];
  pull_requests: PullRequest[];
}

export interface AlertSettings {
  developer_id: string;
  pr_open_days: number;
  branch_active_days: number;
  merged_not_deleted_days: number;
}
