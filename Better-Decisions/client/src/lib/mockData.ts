import { LucideIcon } from "lucide-react";

export interface AppNodeData {
  id: string;
  projectId: string;
  type: "meeting" | "note" | "code";
  isDecision: boolean;
  label: string;
  description: string;
  timestamp: string;
  status: string | null;
  impact: string | null;
  summary: string | null;
  participants: string[] | null;
  transcript: string | null;
  codeSnippet: string | null;
  actionItems: { text: string; assignee?: string; status?: string }[] | null;
  openQuestions: string[] | null;
  relatedLinks: { label: string; url: string }[] | null;
  tags: string[] | null;
  sortOrder: number;
  icon?: LucideIcon;
}
