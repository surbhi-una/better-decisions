import {
  type Project, type InsertProject,
  type Event, type InsertEvent,
  type Activity, type InsertActivity,
  type Meeting, type InsertMeeting,
  type Decision, type InsertDecision,
  type DecisionParticipant, type InsertDecisionParticipant,
  type GithubLink, type InsertGithubLink,
  projects, events, activities,
  meetings, decisions, decisionParticipants, githubLinks
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, sql, and, ilike } from "drizzle-orm";

export interface IStorage {
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject & { id: string }): Promise<Project>;
  updateProject(id: string, data: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<void>;

  getEvents(): Promise<Event[]>;
  getEventsByProject(projectId: string): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, data: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<void>;

  getActivities(): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Meetings
  getMeetings(): Promise<Meeting[]>;
  getMeeting(id: string): Promise<Meeting | undefined>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;

  // Decisions
  getDecisions(filters?: {
    status?: string;
    project?: string;
    team?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: Decision[]; total: number; page: number; pageSize: number }>;
  getDecision(id: string): Promise<Decision | undefined>;
  getDecisionsByMeeting(meetingId: string): Promise<Decision[]>;
  createDecision(decision: InsertDecision): Promise<Decision>;
  updateDecision(id: string, data: Partial<InsertDecision>): Promise<Decision | undefined>;

  // Decision Participants
  getParticipantsByDecision(decisionId: string): Promise<DecisionParticipant[]>;
  createParticipant(participant: InsertDecisionParticipant): Promise<DecisionParticipant>;

  // GitHub Links
  getGithubLinksByDecision(decisionId: string): Promise<GithubLink[]>;
  createGithubLink(link: InsertGithubLink): Promise<GithubLink>;
}

export class DatabaseStorage implements IStorage {
  // --- Projects ---
  async getProjects(): Promise<Project[]> {
    return db.select().from(projects);
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject & { id: string }): Promise<Project> {
    const [created] = await db.insert(projects).values(project).returning();
    return created;
  }

  async updateProject(id: string, data: Partial<InsertProject>): Promise<Project | undefined> {
    const [updated] = await db.update(projects).set(data).where(eq(projects.id, id)).returning();
    return updated;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(events).where(eq(events.projectId, id));
    await db.delete(projects).where(eq(projects.id, id));
  }

  // --- Events ---
  async getEvents(): Promise<Event[]> {
    return db.select().from(events).orderBy(asc(events.sortOrder));
  }

  async getEventsByProject(projectId: string): Promise<Event[]> {
    const results = await db.select().from(events).where(eq(events.projectId, projectId));
    
    // Sort by parsing timestamp strings chronologically
    return results.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateA.getTime() - dateB.getTime();
    });
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [created] = await db.insert(events).values(event).returning();
    return created;
  }

  async updateEvent(id: string, data: Partial<InsertEvent>): Promise<Event | undefined> {
    const [updated] = await db.update(events).set(data).where(eq(events.id, id)).returning();
    return updated;
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  // --- Activities ---
  async getActivities(): Promise<Activity[]> {
    return db.select().from(activities).orderBy(desc(activities.id)).limit(20);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [created] = await db.insert(activities).values(activity).returning();
    return created;
  }

  // --- Meetings ---
  async getMeetings(): Promise<Meeting[]> {
    return db.select().from(meetings).orderBy(desc(meetings.createdAt));
  }

  async getMeeting(id: string): Promise<Meeting | undefined> {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    return meeting;
  }

  async createMeeting(meeting: InsertMeeting): Promise<Meeting> {
    const [created] = await db.insert(meetings).values(meeting).returning();
    return created;
  }

  // --- Decisions ---
  async getDecisions(filters?: {
    status?: string;
    project?: string;
    team?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: Decision[]; total: number; page: number; pageSize: number }> {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(decisions.status, filters.status as typeof decisions.status.enumValues[number]));
    }
    if (filters?.project) {
      conditions.push(ilike(decisions.project, `%${filters.project}%`));
    }
    if (filters?.team) {
      conditions.push(ilike(decisions.team, `%${filters.team}%`));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(decisions)
      .where(where);

    const data = await db
      .select()
      .from(decisions)
      .where(where)
      .orderBy(desc(decisions.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      data,
      total: countResult?.count ?? 0,
      page,
      pageSize,
    };
  }

  async getDecision(id: string): Promise<Decision | undefined> {
    const [decision] = await db.select().from(decisions).where(eq(decisions.id, id));
    return decision;
  }

  async getDecisionsByMeeting(meetingId: string): Promise<Decision[]> {
    return db.select().from(decisions).where(eq(decisions.meetingId, meetingId)).orderBy(desc(decisions.createdAt));
  }

  async createDecision(decision: InsertDecision): Promise<Decision> {
    const [created] = await db.insert(decisions).values(decision).returning();
    return created;
  }

  async updateDecision(id: string, data: Partial<InsertDecision>): Promise<Decision | undefined> {
    const [updated] = await db
      .update(decisions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(decisions.id, id))
      .returning();
    return updated;
  }

  // --- Decision Participants ---
  async getParticipantsByDecision(decisionId: string): Promise<DecisionParticipant[]> {
    return db.select().from(decisionParticipants).where(eq(decisionParticipants.decisionId, decisionId));
  }

  async createParticipant(participant: InsertDecisionParticipant): Promise<DecisionParticipant> {
    const [created] = await db.insert(decisionParticipants).values(participant).returning();
    return created;
  }

  // --- GitHub Links ---
  async getGithubLinksByDecision(decisionId: string): Promise<GithubLink[]> {
    return db.select().from(githubLinks).where(eq(githubLinks.decisionId, decisionId));
  }

  async createGithubLink(link: InsertGithubLink): Promise<GithubLink> {
    const [created] = await db.insert(githubLinks).values(link).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
