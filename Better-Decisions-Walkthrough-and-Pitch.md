# Better-Decisions: Project Walkthrough & Pitch

> An enterprise decision-tracking platform that uses AI to transform messy meeting notes into structured, searchable organizational knowledge.

---

## The Elevator Pitch

**In one sentence:** Better-Decisions uses Claude AI to automatically extract decisions from meeting notes and make them searchable, trackable, and connected to code.

**In 30 seconds:** Every engineering team makes critical decisions in meetings -- which tech stack to use, which approach to take, who owns what. But these decisions live in meeting transcripts that nobody reads again, Slack threads that scroll away, and hallway conversations that were never written down. Better-Decisions fixes this: paste your meeting notes, and AI instantly extracts every decision with context -- who decided, why, and what project it belongs to. Everything becomes searchable. Everything has a paper trail. Six months later, you can still answer "why did we build it this way?"

---

## The Problem We Solve

### Decisions Are the Most Valuable Output of Meetings

Think about it: a 1-hour meeting with 6 engineers costs ~$600 in salary. The entire _point_ of that meeting is usually 2-3 decisions. But what happens to those decisions?

```
Meeting happens → Decisions are made → ???
                                        ↓
                              Nobody writes them down
                                        ↓
                              3 months later: "Why did we do this?"
                                        ↓
                              Nobody remembers
                                        ↓
                              The team re-debates the same topic
                                        ↓
                              Another $600 meeting
```

### Who Has This Problem?

- **Engineering teams** of 5+ people making architecture and technical decisions
- **Product teams** deciding feature priorities and trade-offs
- **Startups** growing fast where decisions outpace documentation
- **Remote teams** where decisions happen across time zones in async meetings
- **Regulated industries** that need audit trails of who decided what and when

### The Market Gap

| Existing Solution | What's Wrong |
|-------------------|-------------|
| Confluence/Notion wikis | Requires manual entry. Nobody does it consistently. |
| Meeting recordings | 45 minutes of video to find one sentence |
| Architecture Decision Records (ADRs) | Only captures big decisions, too formal for daily use |
| Jira/Linear tickets | Wrong tool -- designed for tasks, not decisions |
| Email follow-ups | Gets buried, not searchable, no structure |
| Slack threads | Disappear into the void within a week |

**The common failure mode:** every solution requires a human to manually extract, format, and file the decision. That person is always too busy, so it doesn't happen.

---

## Our Solution

### Let AI Do the Extraction

Better-Decisions removes the manual step entirely:

```
1. Have a meeting (however you normally do)
2. Paste or upload the notes/transcript
3. Claude AI reads the notes and extracts:
   ✓ What decisions were made
   ✓ Why (the rationale)
   ✓ Who was involved and their role
   ✓ What project it belongs to
   ✓ How confident the team was
4. Decisions are instantly searchable and browsable
```

**Zero extra effort.** Your team is already producing meeting notes and transcripts. We just make them useful.

---

## Product Walkthrough

### Screen 1: The Projects Dashboard

When you open Better-Decisions, you see all your projects at a glance:

**What you see:**
- Grid of project cards with color coding
- Status badges (Active, On Hold, Completed)
- Progress bars
- Team member avatars
- Quick stats: Active projects, total decisions, total meetings

**What makes it special:**
- Projects are **auto-created** from your meeting notes. When Claude extracts a decision about "Mobile App v2", the project appears automatically.
- No upfront configuration. The taxonomy emerges from how your team actually talks.

### Screen 2: Submit Meeting Notes

This is the core input screen:

**What you see:**
- Title field (e.g., "Sprint Planning - Feb 7")
- Source field (optional: "Zoom", "Google Meet", "In-person")
- Large text area for notes/transcript
- File upload button for `.vtt` transcript files
- "Extract Decisions" button

**How it works:**
1. Paste your raw meeting notes (any format -- messy is fine)
2. Or upload a `.vtt` file directly from Zoom/Google Meet
3. Click "Extract Decisions"
4. Watch Claude analyze the text (takes 3-5 seconds)
5. See extracted decisions appear with full context

**Example input:**
```
Sarah: I think we should switch the mobile app to TypeScript.
The runtime errors are killing us.

James: Agreed. We had 12 type-related crashes last month.

Alex: OK let's do it. Sarah, can you own the migration?

Sarah: Yes, I'll start with the auth module. James, can you
update the CI pipeline?

James: Sure. Should we target React Native or go native?

Sarah: Let's stick with React Native for now. The team knows it.
We can revisit next quarter.
```

**Example output (auto-extracted by Claude):**

| Decision | Status | Confidence | Project | Participants |
|----------|--------|-----------|---------|-------------|
| Migrate mobile app to TypeScript | Decided | High | mobile-app-v2 | Sarah (decider), James (contributor), Alex (approver) |
| Start migration with auth module | Decided | High | mobile-app-v2 | Sarah (decider) |
| Stay with React Native (revisit Q2) | Decided | Medium | mobile-app-v2 | Sarah (decider), James (contributor) |
| Update CI pipeline for TypeScript | Decided | High | mobile-app-v2 | James (decider) |

Four decisions extracted automatically. With rationale, participants, roles, project assignment, and confidence levels. In seconds.

### Screen 3: Decisions Browser

The central knowledge base of your organization:

**What you see:**
- Searchable list of all decisions
- Filter by status, project, or team
- Color-coded status badges:
  - **Green (Decided)** -- confirmed and active
  - **Blue (Proposed)** -- under consideration
  - **Amber (Revisiting)** -- being reconsidered
  - **Gray (Superseded)** -- replaced by a newer decision
- Confidence indicators (High / Medium / Low)
- Pagination for large datasets

**Click any decision to see:**
- Full description and rationale
- Source meeting (with link back to original notes)
- All participants and their roles (who decided, who was just informed)
- Connected GitHub PRs, issues, and commits
- Creation and last-updated timestamps

**Search capabilities:**
- Full-text search across titles, descriptions, projects, and teams
- Global search bar in the header (accessible from any page)
- Debounced filtering (smart, doesn't overload the server)

### Screen 4: Project Timeline

A visual narrative of how a project evolved:

**What you see:**
- A vertical timeline with events zigzagging left and right
- An animated gradient line connecting all events
- Color-coded event types (meetings, code changes, notes)
- Decision events highlighted with a larger icon and glow effect
- Click any event for full details in a slide-out panel

**Why this matters:**
- New team members can scroll through a project's timeline and understand its entire history
- You can see the _story_ of a project: what happened, what was decided, what changed
- Decisions are highlighted so they stand out from routine updates

### Screen 5: Analytics Dashboard

High-level metrics for leadership:

**What you see:**
- Active projects count
- Total decisions tracked
- Meetings processed
- Decision velocity chart (are we making more or fewer decisions over time?)
- Recent activity feed (who submitted what, when)

### Screen 6: Global Search

Available from every page via the header search bar:

- Type any keyword and press Enter
- Instantly searches across all decisions
- Results show on the Decisions page with the search term highlighted
- Find "why we chose Postgres" or "who decided the API versioning strategy" in seconds

---

## What Makes Better-Decisions Special

### 1. Zero Friction Input

You don't need to fill out forms, assign categories, or follow a template. Just paste your messy, unstructured meeting notes. Claude handles the rest.

**Supports:** Plain text, copy-pasted chat, formal minutes, `.vtt` subtitle files, `.txt`, `.md`, `.srt`

### 2. AI-Powered Extraction

Claude (Anthropic's frontier AI model) understands:
- Explicit decisions: _"We've decided to use PostgreSQL"_
- Implicit decisions: _"Let's go with option B"_
- Confidence signals: _"I think we should probably..."_ (→ medium confidence)
- Status nuance: _"We decided X last week, but now..."_ (→ revisiting)
- Participant roles: _"Sarah will own it"_ (→ decider) vs _"CC'ing James"_ (→ informed)

### 3. Organic Project Taxonomy

Projects aren't defined upfront -- they emerge from your conversations. When Claude extracts a decision about "mobile-app-v2", the project appears automatically. Your organizational structure reflects reality, not an org chart from 6 months ago.

### 4. GitHub Integration

Link decisions to the code that implements them:
- Pull Requests: "This PR implements the TypeScript migration decision"
- Issues: "This issue tracks the auth module rewrite"
- Commits: "This commit changes the CI pipeline as decided"

This closes the **decision-to-code loop**: from _"we decided"_ to _"here's the implementation"_.

### 5. Institutional Memory

Six months from now, a new hire asks: _"Why is the mobile app written in TypeScript?"_

Without Better-Decisions:
- _"I think Sarah decided that... in some meeting... ask her"_
- Sarah left the company two months ago.

With Better-Decisions:
- Search "TypeScript mobile"
- Find: "Migrate mobile app to TypeScript"
- See rationale: "12 type-related crashes last month"
- See who decided: Sarah (decider), Alex (approver)
- See linked PR: #347 - TypeScript migration

### 6. Beautiful, Modern Interface

Built with the best tools in the React ecosystem:
- Dark mode throughout
- Smooth animations
- Responsive design (works on mobile)
- Accessible components (keyboard navigation, screen readers)
- Fast (sub-second page loads)

---

## Technical Highlights

### Architecture

```
React 19 Frontend  →  Hono API Server  →  Neon PostgreSQL
                                       →  Claude AI (Anthropic)
```

### Key Technologies

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 19, Vite, TypeScript | Latest, fastest, most popular |
| Styling | Tailwind CSS v4, shadcn/ui | Beautiful, consistent, accessible |
| State | TanStack React Query | Smart caching, auto-refresh |
| Routing | wouter (3KB) | Lightweight, simple |
| Animation | Framer Motion | Smooth, professional |
| Backend | Hono (14KB) | Fast, edge-ready, TypeScript-first |
| Database | Neon PostgreSQL | Serverless, auto-scaling, branching |
| AI | Claude (Anthropic) | Best-in-class text understanding |

### Performance

- **Frontend bundle**: Lean (wouter=3KB, Hono=14KB, no heavy dependencies)
- **API response**: <100ms for queries (Neon edge caching)
- **Decision extraction**: 3-5 seconds (Claude processing time)
- **Database**: Serverless = scales to zero cost when idle
- **Type safety**: End-to-end TypeScript prevents runtime errors

---

## Business Value

### For Engineering Managers

- **Visibility** into what decisions are being made across teams
- **Accountability** -- every decision has an owner and rationale
- **Onboarding** -- new hires can read the decision history of any project
- **Audit trail** -- when things go wrong, you can trace back to the decision

### For Individual Engineers

- **"Why did we build it this way?"** -- now you can find out in 10 seconds
- **No more re-debates** -- point to the decision record and move on
- **Career protection** -- your decisions are documented, not forgotten

### For Organizations

- **Knowledge retention** -- decisions survive employee turnover
- **Decision quality** -- having to articulate rationale improves thinking
- **Speed** -- teams move faster when they trust that past decisions are recorded
- **Compliance** -- audit trails for regulated industries (SOC 2, ISO 27001)

### ROI Calculation

```
Average engineering meeting: 1 hour, 6 people = $600
Meetings per week wasted re-debating: 2 (conservatively)
Annual cost of lost decisions: $600 × 2 × 50 weeks = $60,000 per team

Better-Decisions cost:
- Neon PostgreSQL: $0-19/month (serverless, scales to zero)
- Claude API: ~$0.003 per meeting extraction
- Hosting: $0-10/month

Annual savings per team: ~$59,000+
Payback period: Immediate
```

---

## Competitive Positioning

### vs. Notion/Confluence

| | Notion/Confluence | Better-Decisions |
|---|---|---|
| Decision capture | Manual | AI-automated |
| Time to document | 10-30 min per meeting | 10 seconds |
| Adoption rate | Low (requires discipline) | High (paste and done) |
| Structure | Whatever the author does | Consistent, searchable |
| GitHub integration | Minimal | Native linking |

### vs. Meeting Recording Tools (Otter.ai, Fireflies)

| | Recording Tools | Better-Decisions |
|---|---|---|
| Output | Full transcript | Structured decisions |
| Searchability | Text search on transcript | Search by decision, project, team |
| Actionability | Read 45 min transcript | See 3 decisions instantly |
| Privacy | Records full audio | Only processes text notes |
| Integration | Standalone | Links to GitHub, projects |

### vs. ADR Tools (Architecture Decision Records)

| | ADR Tools | Better-Decisions |
|---|---|---|
| Scope | Big architecture decisions | All decisions (big and small) |
| Format | Formal template | Free-form input → structured output |
| Effort | 30-60 min to write | 10 seconds |
| Consistency | Depends on the author | AI ensures consistent structure |
| Discoverability | File in a repo | Searchable web interface |

---

## Future Roadmap

### Near-term (Next 3 months)
- **Slack integration** -- Auto-capture decisions from Slack channels
- **Meeting bot** -- Join Zoom/Google Meet and extract in real-time
- **Email digests** -- Weekly summary of decisions per project/team
- **MCP bridge** -- Inject relevant decisions into IDE coding agents (Cursor, Windsurf)

### Medium-term (3-6 months)
- **Decision dependencies** -- Link decisions that depend on each other
- **Impact tracking** -- Did the decision achieve its intended outcome?
- **Team analytics** -- Who makes the most decisions? Which teams are slowest to decide?
- **Multi-org support** -- Enterprise SSO and team isolation

### Long-term (6-12 months)
- **Decision AI advisor** -- Claude suggests when past decisions conflict with new proposals
- **Predictive analytics** -- Identify patterns in decision-making quality
- **API marketplace** -- Connect to Jira, Linear, GitHub Issues, GitLab
- **On-premise deployment** -- For enterprises with strict data residency requirements

---

## Demo Script (5 minutes)

### Setup (30 seconds)
_"Let me show you Better-Decisions. It's a platform that uses AI to track the decisions your team makes."_

Open the app. Show the Projects dashboard briefly.

### The Core Flow (2 minutes)
_"Let's say I just had a sprint planning meeting. I'll paste my notes here."_

1. Navigate to `/meetings/new`
2. Paste sample meeting notes
3. Click "Extract Decisions"
4. _"In 5 seconds, Claude has identified 4 decisions, with full context."_
5. Point out: status badges, confidence levels, rationale, participants with roles

### Search & Discovery (1 minute)
_"Now let's say it's 3 months later and a new hire asks: why are we using TypeScript?"_

1. Type "TypeScript" in the header search bar
2. Show the filtered results
3. Click a decision to show the detail panel
4. _"Here's exactly what was decided, why, and by whom."_

### Timeline View (1 minute)
_"You can also see the full story of a project."_

1. Navigate to a project timeline
2. Scroll through events
3. Point out the highlighted decisions
4. _"New team members can scroll through this and understand the entire history."_

### Closing (30 seconds)
_"Better-Decisions eliminates the gap between 'we decided' and 'we documented it.' No forms, no templates, no discipline required. Just paste your notes and let AI do the rest."_

---

## Getting Started

### Prerequisites
- Node.js 20+
- A Neon PostgreSQL database (free tier available)
- An Anthropic API key (for Claude)

### Quick Start
```bash
# Clone the repository
git clone https://github.com/your-org/better-decisions.git
cd better-decisions

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and ANTHROPIC_API_KEY

# Run database migrations
npm run migrate

# Start the development server
npm run dev

# Open http://localhost:3000
```

### Environment Variables
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | Claude API key from Anthropic |
| `PORT` | Server port (default: 3000) |

---

## Team & Contact

**Built by:** The Better-Decisions Team

**Repository:** [GitHub - better-decisions](https://github.com)

**Stack:** React 19 + Hono + Claude AI + Neon PostgreSQL

---

*Better-Decisions: Because the most expensive decisions are the ones nobody remembers making.*
