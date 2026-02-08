import type { Meeting, Decision, DecisionParticipant, GithubLink } from "@shared/schema";

export type { Meeting, Decision, DecisionParticipant, GithubLink };

export interface MeetingWithDecisions extends Meeting {
  decisions: DecisionWithParticipants[];
}

export interface DecisionWithParticipants extends Decision {
  participants: DecisionParticipant[];
}

export interface DecisionDetail extends Decision {
  participants: DecisionParticipant[];
  githubLinks: GithubLink[];
  meeting: Meeting | null;
}

export interface DecisionListResponse {
  data: Decision[];
  total: number;
  page: number;
  pageSize: number;
}

export type EventType = "meeting" | "note" | "code";
