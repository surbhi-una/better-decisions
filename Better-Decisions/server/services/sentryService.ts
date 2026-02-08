interface SentryIssue {
  id: string;
  title: string;
  culprit: string;
  count: string;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  level: 'error' | 'warning' | 'info' | 'fatal';
  permalink: string;
  status: string;
  metadata?: {
    title?: string;
    value?: string;
    type?: string;
  };
  stats?: {
    '24h'?: Array<[number, number]>;
  };
}

interface SentryError {
  id: string;
  title: string;
  culprit: string;
  count: number;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  level: 'error' | 'warning' | 'info' | 'fatal';
  permalink: string;
  status: string;
}

export class SentryService {
  private authToken: string;
  private organizationSlug: string;
  private baseUrl = 'https://sentry.io/api/0';

  constructor() {
    const token = process.env.SENTRY_AUTH_TOKEN;
    const orgSlug = process.env.SENTRY_ORGANIZATION_SLUG;

    if (!token || !orgSlug) {
      throw new Error('SENTRY_AUTH_TOKEN and SENTRY_ORGANIZATION_SLUG must be set in environment variables');
    }

    this.authToken = token;
    this.organizationSlug = orgSlug;
  }

  /**
   * Fetches top N errors from Sentry for the last N days
   */
  async fetchTopErrors(days: number = 7, limit: number = 5): Promise<SentryError[]> {
    const statsPeriod = `${days}d`;
    
    const url = new URL(`${this.baseUrl}/organizations/${this.organizationSlug}/issues/`);
    url.searchParams.set('query', 'is:unresolved');
    url.searchParams.set('statsPeriod', statsPeriod);
    url.searchParams.set('sort', 'freq'); // Sort by frequency (most common errors first)
    url.searchParams.set('limit', limit.toString());

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sentry API error (${response.status}): ${errorText}`);
      }

      const issues: SentryIssue[] = await response.json();

      // Transform to our interface
      return issues.map(issue => ({
        id: issue.id,
        title: issue.metadata?.title || issue.title,
        culprit: issue.culprit || 'Unknown',
        count: parseInt(issue.count, 10),
        userCount: issue.userCount || 0,
        firstSeen: issue.firstSeen,
        lastSeen: issue.lastSeen,
        level: issue.level,
        permalink: issue.permalink,
        status: issue.status,
      }));
    } catch (error) {
      console.error('Failed to fetch Sentry errors:', error);
      throw error;
    }
  }
}

export const sentryService = new SentryService();
