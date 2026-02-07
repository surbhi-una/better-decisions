import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertProjectSchema, insertEventSchema, insertActivitySchema,
  insertMeetingSchema, insertDecisionSchema, insertDecisionParticipantSchema, insertGithubLinkSchema
} from "@shared/schema";

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

  return httpServer;
}
