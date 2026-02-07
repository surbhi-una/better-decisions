import { sql } from "../db/client.js";
import type { Decision, DecisionDetail, PaginatedResponse } from "../types/index.js";

interface ListFilters {
  search?: string;
  project?: string;
  team?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  per_page?: number;
}

export async function listDecisions(
  filters: ListFilters
): Promise<PaginatedResponse<Decision>> {
  const page = filters.page ?? 1;
  const perPage = filters.per_page ?? 20;
  const offset = (page - 1) * perPage;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters.search) {
    const pattern = `%${filters.search}%`;
    conditions.push(
      `(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR project ILIKE $${paramIndex} OR team ILIKE $${paramIndex})`
    );
    params.push(pattern);
    paramIndex++;
  }
  if (filters.project) {
    conditions.push(`project ILIKE $${paramIndex++}`);
    params.push(`%${filters.project}%`);
  }
  if (filters.team) {
    conditions.push(`team ILIKE $${paramIndex++}`);
    params.push(`%${filters.team}%`);
  }
  if (filters.status) {
    conditions.push(`status = $${paramIndex++}`);
    params.push(filters.status);
  }
  if (filters.from) {
    conditions.push(`created_at >= $${paramIndex++}`);
    params.push(filters.from);
  }
  if (filters.to) {
    conditions.push(`created_at <= $${paramIndex++}`);
    params.push(filters.to);
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await sql(
    `SELECT COUNT(*) as total FROM decisions ${where}`,
    params
  );
  const total = parseInt(countResult[0].total as string, 10);

  const rows = await sql(
    `SELECT * FROM decisions ${where} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, perPage, offset]
  );

  return {
    data: rows as unknown as Decision[],
    total,
    page,
    per_page: perPage,
    total_pages: Math.ceil(total / perPage),
  };
}

export async function getDecisionDetail(
  id: string
): Promise<DecisionDetail | null> {
  const decisions = await sql(`SELECT * FROM decisions WHERE id = $1`, [id]);
  if (decisions.length === 0) return null;

  const decision = decisions[0] as unknown as Decision;

  const [participants, meeting, githubLinks] = await Promise.all([
    sql(`SELECT * FROM decision_participants WHERE decision_id = $1`, [id]),
    sql(`SELECT id, title, created_at FROM meetings WHERE id = $1`, [
      decision.meeting_id,
    ]),
    sql(
      `SELECT * FROM github_links WHERE decision_id = $1 ORDER BY created_at DESC`,
      [id]
    ),
  ]);

  return {
    ...decision,
    participants: participants as unknown as DecisionDetail["participants"],
    meeting: meeting[0] as unknown as DecisionDetail["meeting"],
    github_links: githubLinks as unknown as DecisionDetail["github_links"],
  };
}
