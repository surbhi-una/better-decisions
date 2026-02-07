import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertEventSchema, insertActivitySchema } from "@shared/schema";

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

  return httpServer;
}
