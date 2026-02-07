export interface Meeting {
  id: string;
  title: string;
  raw_notes: string;
  source?: string;
  created_at: string;
}

export interface Decision {
  id: string;
  meeting_id: string;
  title: string;
  description: string;
  rationale?: string;
  status: "decided" | "proposed" | "revisiting" | "superseded";
  confidence: "high" | "medium" | "low";
  project?: string;
  team?: string;
  created_at: string;
  updated_at: string;
}

export interface DecisionParticipant {
  id: string;
  decision_id: string;
  name: string;
  role: "decider" | "approver" | "contributor" | "informed" | "participant";
}

export interface GitHubLink {
  id: string;
  decision_id: string;
  url: string;
  link_type: "pr" | "issue" | "commit" | "other";
  repo?: string;
  ref?: string;
  title?: string;
  created_at: string;
}

export interface ExtractedDecision {
  title: string;
  description: string;
  rationale?: string;
  status: Decision["status"];
  confidence: Decision["confidence"];
  project?: string;
  team?: string;
  participants: { name: string; role: DecisionParticipant["role"] }[];
}

export interface DecisionDetail extends Decision {
  participants: DecisionParticipant[];
  meeting: Pick<Meeting, "id" | "title" | "created_at">;
  github_links: GitHubLink[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
