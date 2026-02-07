import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertEventSchema, insertActivitySchema, events, account } from "@shared/schema";
import { fetchAndTransformPRs, getAuthenticatedUserRepos } from "./github";
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

  // --- Stats ---
  app.get("/api/stats", async (_req, res) => {
    const allProjects = await storage.getProjects();
    const allEvents = await storage.getEvents();
    const activeProjects = allProjects.filter(p => p.status === "active").length;
    const totalDecisions = allEvents.filter(e => e.isDecision).length;
    const totalMeetings = allEvents.filter(e => e.type === "meeting").length;
    res.json({
      activeProjects,
      totalProjects: allProjects.length,
      totalDecisions,
      totalMeetings,
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

  return httpServer;
}
