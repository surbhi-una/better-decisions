import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertProjectSchema, insertEventSchema, insertActivitySchema,
  insertMeetingSchema, insertDecisionSchema, insertDecisionParticipantSchema, insertGithubLinkSchema,
  events, account
} from "@shared/schema";
import { fetchAndTransformPRs, getAuthenticatedUserRepos } from "./github";
import { sentryService } from "./services/sentryService";
import { enhanceSentryEventWithAI } from "./ai-enhancer";
import { auth } from "./auth";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // --- Projects ---
  app.get("/api/projects", async (_req, res) => {
    const projects = await storage.getProjects();
    res.json(projects);
  });

  app.get("/api/projects/:id", async (req, res) => {
    const project = await storage.getProject(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  });

  app.post("/api/projects", async (req, res) => {
    const id = req.body.id;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "id is required" });
    }
    const parsed = insertProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.message });
    }
    const project = await storage.createProject({ ...parsed.data, id });
    res.status(201).json(project);
  });

  app.patch("/api/projects/:id", async (req, res) => {
    const updated = await storage.updateProject(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Project not found" });
    res.json(updated);
  });

  app.delete("/api/projects/:id", async (req, res) => {
    await storage.deleteProject(req.params.id);
    res.status(204).send();
  });

  // --- Events ---
  app.get("/api/events", async (req, res) => {
    const projectId = req.query.projectId as string | undefined;
    const eventsList = projectId
      ? await storage.getEventsByProject(projectId)
      : await storage.getEvents();
    res.json(eventsList);
  });

  app.get("/api/events/:id", async (req, res) => {
    const event = await storage.getEvent(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  });

  app.post("/api/events", async (req, res) => {
    const parsed = insertEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.message });
    }
    const event = await storage.createEvent(parsed.data);
    res.status(201).json(event);
  });

  app.patch("/api/events/:id", async (req, res) => {
    const updated = await storage.updateEvent(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Event not found" });
    res.json(updated);
  });

  app.delete("/api/events/:id", async (req, res) => {
    await storage.deleteEvent(req.params.id);
    res.status(204).send();
  });

  // --- Activities ---
  app.get("/api/activities", async (_req, res) => {
    const activityList = await storage.getActivities();
    res.json(activityList);
  });

  app.post("/api/activities", async (req, res) => {
    const parsed = insertActivitySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.message });
    }
    const activity = await storage.createActivity(parsed.data);
    res.status(201).json(activity);
  });

  // --- Meetings ---
  app.get("/api/meetings", async (_req, res) => {
    const meetingsList = await storage.getMeetings();
    res.json(meetingsList);
  });

  app.get("/api/meetings/:id", async (req, res) => {
    const meeting = await storage.getMeeting(req.params.id);
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });

    // Include decisions extracted from this meeting
    const meetingDecisions = await storage.getDecisionsByMeeting(meeting.id);

    // For each decision, include participants
    const decisionsWithParticipants = await Promise.all(
      meetingDecisions.map(async (d) => {
        const participants = await storage.getParticipantsByDecision(d.id);
        return { ...d, participants };
      })
    );

    res.json({ ...meeting, decisions: decisionsWithParticipants });
  });

  app.post("/api/meetings", async (req, res) => {
    const parsed = insertMeetingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.message });
    }
    const meeting = await storage.createMeeting(parsed.data);
    res.status(201).json(meeting);
  });

  // --- Decisions ---
  app.get("/api/decisions", async (req, res) => {
    const { status, project, team, page, pageSize } = req.query;
    const result = await storage.getDecisions({
      status: status as string | undefined,
      project: project as string | undefined,
      team: team as string | undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    });
    res.json(result);
  });

  app.get("/api/decisions/:id", async (req, res) => {
    const decision = await storage.getDecision(req.params.id);
    if (!decision) return res.status(404).json({ message: "Decision not found" });

    const [participants, githubLinksList, meeting] = await Promise.all([
      storage.getParticipantsByDecision(decision.id),
      storage.getGithubLinksByDecision(decision.id),
      storage.getMeeting(decision.meetingId),
    ]);

    res.json({ ...decision, participants, githubLinks: githubLinksList, meeting });
  });

  app.post("/api/decisions", async (req, res) => {
    const parsed = insertDecisionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.message });
    }
    const decision = await storage.createDecision(parsed.data);
    res.status(201).json(decision);
  });

  app.patch("/api/decisions/:id", async (req, res) => {
    const updated = await storage.updateDecision(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Decision not found" });
    res.json(updated);
  });

  // --- Decision Participants ---
  app.post("/api/decisions/:id/participants", async (req, res) => {
    const body = { ...req.body, decisionId: req.params.id };
    const parsed = insertDecisionParticipantSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.message });
    }
    const participant = await storage.createParticipant(parsed.data);
    res.status(201).json(participant);
  });

  // --- GitHub Links ---
  app.post("/api/decisions/:id/github-links", async (req, res) => {
    const body = { ...req.body, decisionId: req.params.id };
    const parsed = insertGithubLinkSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.message });
    }
    const link = await storage.createGithubLink(parsed.data);
    res.status(201).json(link);
  });

  // --- Stats ---
  app.get("/api/stats", async (_req, res) => {
    const allProjects = await storage.getProjects();
    const allEvents = await storage.getEvents();
    const allMeetings = await storage.getMeetings();
    const decisionsResult = await storage.getDecisions({ pageSize: 1 });
    const activeProjects = allProjects.filter(p => p.status === "active").length;
    res.json({
      activeProjects,
      totalProjects: allProjects.length,
      totalDecisions: decisionsResult.total,
      totalMeetings: allMeetings.length,
      totalEvents: allEvents.length,
    });
  });

  // --- GitHub Integration ---

  // Middleware to check GitHub authentication
  async function requireGitHubAuth(req: any, res: any, next: any) {
    try {
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Get the GitHub account linked to this user
      const accounts = await db
        .select()
        .from(account)
        .where(
          and(
            eq(account.userId, session.user.id),
            eq(account.providerId, 'github')
          )
        );

      if (!accounts || accounts.length === 0) {
        return res.status(401).json({ error: 'GitHub not connected' });
      }

      req.githubToken = accounts[0].accessToken;
      req.userId = session.user.id;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Authentication failed' });
    }
  }

  // GET /api/github/repos - Get user's GitHub repositories
  app.get("/api/github/repos", requireGitHubAuth, async (req: any, res) => {
    try {
      const repos = await getAuthenticatedUserRepos(req.githubToken);
      res.json({ repositories: repos });
    } catch (error: any) {
      console.error('Error fetching GitHub repos:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch repositories' });
    }
  });

  // POST /api/github/sync - Sync PRs from GitHub to project
  app.post("/api/github/sync", requireGitHubAuth, async (req: any, res) => {
    try {
      const { projectId, repositories } = req.body;

      if (!projectId || !repositories || !Array.isArray(repositories)) {
        return res.status(400).json({
          error: 'projectId and repositories array are required'
        });
      }

      // Verify project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      let totalSynced = 0;

      for (const repoFullName of repositories) {
        const [owner, repo] = repoFullName.split('/');

        if (!owner || !repo) {
          console.warn(`Invalid repository name: ${repoFullName}`);
          continue;
        }

        try {
          const prs = await fetchAndTransformPRs(
            req.githubToken,
            owner,
            repo,
            projectId
          );

          // Insert PRs into database (skip duplicates)
          for (const pr of prs) {
            const prId = `gh-${owner}-${repo}-${pr.tags?.find(t => t.startsWith('pr-'))?.replace('pr-', '')}`;

            // Check if PR already exists
            const existing = await db
              .select()
              .from(events)
              .where(eq(events.id, prId))
              .limit(1);

            if (existing.length === 0) {
              await db.insert(events).values({
                ...pr,
                id: prId,
              });
              totalSynced++;
            }
          }
        } catch (repoError: any) {
          console.error(`Error syncing ${repoFullName}:`, repoError);
          // Continue with other repos even if one fails
        }
      }

      res.json({
        synced: totalSynced,
        message: `Successfully synced ${totalSynced} PRs`,
      });
    } catch (error: any) {
      console.error('Error syncing GitHub PRs:', error);
      res.status(500).json({ error: error.message || 'Failed to sync PRs' });
    }
  });

  // --- Sentry Integration ---

  // DELETE /api/sentry/events - Clean up all Sentry events from database
  app.delete("/api/sentry/events", async (req, res) => {
    try {
      const { sql } = await import('drizzle-orm');
      const result = await db
        .delete(events)
        .where(sql`${events.id} LIKE 'sentry-%'`)
        .returning();
      
      res.json({
        deleted: result.length,
        message: `Deleted ${result.length} Sentry event(s)`,
      });
    } catch (error: any) {
      console.error('Error deleting Sentry events:', error);
      res.status(500).json({ error: error.message || 'Failed to delete Sentry events' });
    }
  });

  // POST /api/sentry/sync - Sync top errors from Sentry to project
  app.post("/api/sentry/sync", async (req, res) => {
    try {
      const { projectId } = req.body;

      if (!projectId) {
        return res.status(400).json({
          error: 'projectId is required'
        });
      }

      // Verify project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Fetch top 5 errors from last 7 days
      const errors = await sentryService.fetchTopErrors(7, 5);

      // Enhance all errors in parallel for speed
      const enhancementPromises = errors.map(error =>
        enhanceSentryEventWithAI({
          title: error.title,
          culprit: error.culprit,
          count: error.count,
          userCount: error.userCount,
          level: error.level,
          firstSeen: error.firstSeen,
          lastSeen: error.lastSeen,
        }).catch(err => {
          console.error(`Failed to enhance error ${error.id}:`, err);
          // Return basic fallback
          return {
            description: error.title,
            summary: `${error.count} occurrences in ${error.culprit}`,
            impact: 'medium' as const,
            isDecision: false,
            actionItems: ['Investigate error logs'],
            keyTakeaways: [`${error.count} events`],
          };
        })
      );

      const enhancements = await Promise.all(enhancementPromises);

      let totalSynced = 0;

      // Create events with proper sortOrder based on firstSeen timestamp
      for (let i = 0; i < errors.length; i++) {
        const error = errors[i];
        const aiEnhancement = enhancements[i];

        try {
          // Format timestamp using firstSeen for chronological ordering
          const firstSeenDate = new Date(error.firstSeen);
          const timestamp = firstSeenDate.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });

          // Use sortOrder 0 to match existing events pattern
          const sortOrder = 0;

          // Create event ID
          const eventId = `sentry-${error.id}`;

          // Check if error already exists
          const existing = await db
            .select()
            .from(events)
            .where(eq(events.id, eventId))
            .limit(1);

          if (existing.length === 0) {
            await db.insert(events).values({
              id: eventId,
              projectId,
              type: 'note',
              isDecision: aiEnhancement.isDecision,
              label: error.title,
              description: aiEnhancement.description,
              timestamp,
              status: 'active',
              impact: aiEnhancement.impact,
              summary: aiEnhancement.summary,
              participants: [],
              actionItems: aiEnhancement.actionItems.map(item => ({
                text: item,
                completed: false,
              })),
              openQuestions: aiEnhancement.keyTakeaways,
              relatedLinks: [
                { label: 'View in Sentry', url: error.permalink },
              ],
              tags: ['logs', 'sentry', 'error', error.level, `${error.count}-events`],
              sortOrder,
            });
            totalSynced++;
          }
        } catch (insertError: any) {
          console.error(`Failed to insert error ${error.id}:`, insertError);
        }
      }

      res.json({
        synced: totalSynced,
        total: errors.length,
        message: `Successfully synced ${totalSynced} Sentry errors`,
      });
    } catch (error: any) {
      console.error('Error syncing Sentry errors:', error);
      res.status(500).json({ error: error.message || 'Failed to sync Sentry errors' });
    }
  });

  return httpServer;
}
