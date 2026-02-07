import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = pgTable("projects", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  status: text("status", { enum: ["active", "on-hold", "completed"] }).notNull().default("active"),
  progress: integer("progress").notNull().default(0),
  team: text("team").array().notNull().default(sql`'{}'::text[]`),
  color: text("color").notNull().default("hsl(262, 83%, 58%)"),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
});

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export const events = pgTable("events", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id", { length: 255 }).notNull(),
  type: text("type", { enum: ["meeting", "note", "code"] }).notNull(),
  isDecision: boolean("is_decision").notNull().default(false),
  label: text("label").notNull(),
  description: text("description").notNull(),
  timestamp: text("timestamp").notNull(),
  status: text("status", { enum: ["active", "archived", "pending"] }).default("active"),
  impact: text("impact", { enum: ["high", "medium", "low"] }).default("medium"),
  summary: text("summary"),
  participants: text("participants").array().default(sql`'{}'::text[]`),
  transcript: text("transcript"),
  codeSnippet: text("code_snippet"),
  actionItems: jsonb("action_items").default(sql`'[]'::jsonb`),
  openQuestions: text("open_questions").array().default(sql`'{}'::text[]`),
  relatedLinks: jsonb("related_links").default(sql`'[]'::jsonb`),
  tags: text("tags").array().default(sql`'{}'::text[]`),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export const activities = pgTable("activities", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  user: text("user").notNull(),
  action: text("action").notNull(),
  target: text("target").notNull(),
  time: text("time").notNull(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({ id: true });
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

// --- Meetings ---
export const meetings = pgTable("meetings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  rawNotes: text("raw_notes").notNull(),
  source: text("source"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export const insertMeetingSchema = createInsertSchema(meetings).omit({ id: true, createdAt: true });
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type Meeting = typeof meetings.$inferSelect;

// --- Decisions ---
export const decisions = pgTable("decisions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  meetingId: uuid("meeting_id").notNull().references(() => meetings.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  rationale: text("rationale"),
  status: text("status", { enum: ["decided", "proposed", "revisiting", "superseded"] }).notNull().default("decided"),
  confidence: text("confidence", { enum: ["high", "medium", "low"] }).notNull().default("high"),
  project: text("project"),
  team: text("team"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export const insertDecisionSchema = createInsertSchema(decisions).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDecision = z.infer<typeof insertDecisionSchema>;
export type Decision = typeof decisions.$inferSelect;

// --- Decision Participants ---
export const decisionParticipants = pgTable("decision_participants", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  decisionId: uuid("decision_id").notNull().references(() => decisions.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role", { enum: ["decider", "approver", "contributor", "informed", "participant"] }).notNull().default("participant"),
});

export const insertDecisionParticipantSchema = createInsertSchema(decisionParticipants).omit({ id: true });
export type InsertDecisionParticipant = z.infer<typeof insertDecisionParticipantSchema>;
export type DecisionParticipant = typeof decisionParticipants.$inferSelect;

// --- GitHub Links ---
export const githubLinks = pgTable("github_links", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  decisionId: uuid("decision_id").notNull().references(() => decisions.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  linkType: text("link_type", { enum: ["pr", "issue", "commit", "other"] }).notNull(),
  repo: text("repo"),
  ref: text("ref"),
  title: text("title"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export const insertGithubLinkSchema = createInsertSchema(githubLinks).omit({ id: true, createdAt: true });
export type InsertGithubLink = z.infer<typeof insertGithubLinkSchema>;
export type GithubLink = typeof githubLinks.$inferSelect;
