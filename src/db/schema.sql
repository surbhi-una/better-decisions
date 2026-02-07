CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Meetings: raw meeting notes (source of truth)
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  raw_notes TEXT NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Decisions: extracted from meetings by Claude
CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  rationale TEXT,
  status TEXT NOT NULL DEFAULT 'decided' CHECK (status IN ('decided', 'proposed', 'revisiting', 'superseded')),
  confidence TEXT NOT NULL DEFAULT 'high' CHECK (confidence IN ('high', 'medium', 'low')),
  project TEXT,
  team TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Decision participants: who was involved
CREATE TABLE IF NOT EXISTS decision_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('decider', 'approver', 'contributor', 'informed', 'participant'))
);

-- GitHub links: connect decisions to PRs/commits/issues
CREATE TABLE IF NOT EXISTS github_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  link_type TEXT NOT NULL CHECK (link_type IN ('pr', 'issue', 'commit', 'other')),
  repo TEXT,
  ref TEXT,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_decisions_project ON decisions(project);
CREATE INDEX IF NOT EXISTS idx_decisions_team ON decisions(team);
CREATE INDEX IF NOT EXISTS idx_decisions_created_at ON decisions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_status ON decisions(status);
CREATE INDEX IF NOT EXISTS idx_decisions_meeting_id ON decisions(meeting_id);
CREATE INDEX IF NOT EXISTS idx_participants_decision_id ON decision_participants(decision_id);
CREATE INDEX IF NOT EXISTS idx_github_links_decision_id ON github_links(decision_id);
