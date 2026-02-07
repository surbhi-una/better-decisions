import { Octokit } from '@octokit/rest';
import type { InsertEvent } from '@shared/schema';
import { enhancePRWithAI } from './ai-enhancer';

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

  // Process PRs with AI enhancement
  const enhancedPRs = await Promise.all(
    mergedPRs.map(async (pr) => {
    const mergedDate = new Date(pr.merged_at!);
    const labelNames = pr.labels?.map(l => l.name) || [];

    // Fetch detailed PR info for AI enhancement
    let aiEnhancement;
    try {
      const prDetails = await octokit.pulls.get({
        owner,
        repo,
        pull_number: pr.number,
      });

      aiEnhancement = await enhancePRWithAI({
        title: pr.title,
        body: pr.body,
        filesChanged: prDetails.data.changed_files,
        additions: prDetails.data.additions,
        deletions: prDetails.data.deletions,
        labels: labelNames,
      });
    } catch (error) {
      console.error(`Failed to enhance PR #${pr.number}:`, error);
      // Fallback to basic data if AI enhancement fails
      aiEnhancement = {
        description: pr.title,
        summary: pr.body || 'No description provided',
        impact: 'medium' as const,
        isDecision: labelNames.some(l =>
          l.toLowerCase().includes('decision') ||
          l.toLowerCase().includes('architecture') ||
          l.toLowerCase().includes('breaking')
        ),
        actionItems: [],
        keyTakeaways: [],
      };
    }

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
      isDecision: aiEnhancement.isDecision,
      label: pr.title,
      description: aiEnhancement.description,
      timestamp,
      status: 'active' as const,
      impact: aiEnhancement.impact,
      summary: aiEnhancement.summary,
      participants,
      codeSnippet: `${pr.html_url}/files`,
      actionItems: aiEnhancement.actionItems.map(item => ({
        text: item,
        completed: false,
      })),
      openQuestions: aiEnhancement.keyTakeaways,
      relatedLinks,
      tags: ['github', `pr-${pr.number}`, ...labelNames],
      sortOrder: 0,
    };
    })
  );

  return enhancedPRs;
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
