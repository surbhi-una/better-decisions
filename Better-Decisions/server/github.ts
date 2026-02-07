import { Octokit } from '@octokit/rest';
import type { InsertEvent } from '@shared/schema';

export interface GitHubPR {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  merged_at: string | null;
  user: {
    login: string;
  } | null;
  labels?: Array<{
    name: string;
    color: string;
  }>;
  requested_reviewers?: Array<{
    login: string;
  }>;
}

/**
 * Fetches merged PRs from a GitHub repository and transforms them into Event objects
 */
export async function fetchAndTransformPRs(
  token: string,
  owner: string,
  repo: string,
  projectId: string
): Promise<Omit<InsertEvent, 'id'>[]> {
  const octokit = new Octokit({ auth: token });

  // Fetch closed PRs (we'll filter for merged ones)
  const { data } = await octokit.pulls.list({
    owner,
    repo,
    state: 'closed',
    per_page: 50,
    sort: 'updated',
    direction: 'desc',
  });

  // Filter only merged PRs
  const mergedPRs = data.filter(pr => pr.merged_at);

  return mergedPRs.map(pr => {
    const mergedDate = new Date(pr.merged_at!);

    // Determine impact based on labels
    let impact: 'high' | 'medium' | 'low' = 'medium';
    const labelNames = pr.labels?.map(l => l.name.toLowerCase()) || [];

    if (labelNames.some(l => l.includes('critical') || l.includes('breaking') || l.includes('major'))) {
      impact = 'high';
    } else if (labelNames.some(l => l.includes('minor') || l.includes('patch') || l.includes('docs'))) {
      impact = 'low';
    }

    // Check if this is marked as a decision
    const isDecision = labelNames.some(l =>
      l.includes('decision') || l.includes('architecture') || l.includes('breaking')
    );

    // Build participants list (author + reviewers)
    const participants = [pr.user?.login || 'unknown'];
    if (pr.requested_reviewers) {
      participants.push(...pr.requested_reviewers.map(r => r.login));
    }

    // Format timestamp
    const timestamp = mergedDate.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    // Build related links
    const relatedLinks = [
      { label: 'View PR', url: pr.html_url },
      { label: 'View Diff', url: `${pr.html_url}/files` },
    ];

    return {
      projectId,
      type: 'code' as const,
      isDecision,
      label: pr.title,
      description: pr.body?.substring(0, 150) || 'No description provided',
      timestamp,
      status: 'active' as const,
      impact,
      summary: pr.body || '',
      participants,
      codeSnippet: `${pr.html_url}/files`,
      actionItems: [],
      openQuestions: [],
      relatedLinks,
      tags: ['github', `pr-${pr.number}`, ...(pr.labels?.map(l => l.name) || [])],
      sortOrder: 0,
    };
  });
}

/**
 * Gets the authenticated user's repositories
 */
export async function getAuthenticatedUserRepos(token: string) {
  const octokit = new Octokit({ auth: token });

  const { data } = await octokit.repos.listForAuthenticatedUser({
    visibility: 'all',
    per_page: 100,
    sort: 'updated',
  });

  return data.map(repo => ({
    full_name: repo.full_name,
    name: repo.name,
    owner: repo.owner.login,
    private: repo.private,
    description: repo.description,
    updated_at: repo.updated_at,
  }));
}
