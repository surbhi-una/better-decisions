# Better-Decisions

> An AI-powered decision-tracking platform that transforms meeting notes into structured, searchable organizational knowledge.

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Hono](https://img.shields.io/badge/Hono-Latest-orange.svg)](https://hono.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue.svg)](https://neon.tech/)

---

## The Problem

**Decisions are the most valuable output of meetings, yet they vanish without a trace.**

A 1-hour meeting with 6 engineers costs ~$600. The point? Usually 2-3 critical decisions. But what happens next?

```
Meeting happens → Decisions made → Nobody documents them
                                    ↓
                          3 months later: "Why did we do this?"
                                    ↓
                          Nobody remembers → Re-debate the same topic
                                    ↓
                          Another $600 wasted
```

**The common failure mode:** Every solution requires manual extraction and documentation. That person is always too busy.

---

## The Solution

**Let AI do the extraction work.**

Better-Decisions uses Claude AI to automatically extract decisions from meeting notes:

1. **Paste meeting notes** (any format—messy is fine)
2. **AI extracts decisions** with context, rationale, participants, and confidence
3. **Everything becomes searchable** and trackable forever

**Zero extra effort.** Your team already produces meeting notes. We make them useful.

---

## Key Features

### 🎯 AI-Powered Decision Extraction

Submit raw meeting notes and Claude AI automatically extracts:
- **What** was decided (title & description)
- **Why** (rationale and context)
- **Who** was involved (with roles: decider, approver, contributor, informed)
- **Project** assignment (auto-categorized)
- **Confidence level** (high, medium, low)
- **Status** (decided, proposed, revisiting, superseded)

### 📊 Projects Dashboard

- Visual grid/list view of all projects
- Auto-generated from decision context
- Status tracking (active, on-hold, completed)
- Progress indicators and team avatars
- Real-time statistics

### 🔍 Decision Browser

- Full-text search across all decisions
- Filter by status, project, team, confidence
- Paginated results with debounced search
- Detailed view with meeting context
- GitHub integration (link PRs, issues, commits)

### 📈 Context Timeline

- Visual timeline of project evolution
- Zigzag layout with animated gradient
- Decision events highlighted with glow effects
- Filter by keywords and tags
- Event detail panels

### 📉 Analytics Dashboard

- Active projects count
- Total decisions tracked
- Meetings processed
- Decision velocity charts
- Recent activity feed
- PDF export capability

### 🔗 GitHub Integration

Connect decisions to code:
- Link pull requests
- Reference issues
- Track commits
- Maintain decision-to-implementation traceability

### 🧩 MCP Marketplace

- Browse and connect Model Context Protocol servers
- Real-time MCP server catalog (powered by Smithery Registry)
- Configure stdio and HTTP transports
- Discover and execute MCP tools
- Live connection status monitoring

### 📁 File Support

- `.vtt` (WebVTT transcripts from Zoom/Google Meet)
- `.txt`, `.md`, `.srt` (plain text notes)
- Automatic speaker detection and formatting

---

## Technology Stack

### Frontend
- **React 19** - Latest React with concurrent features
- **TypeScript** - End-to-end type safety
- **Vite** - Lightning-fast dev server and build tool
- **Tailwind CSS v4** - Modern utility-first styling
- **shadcn/ui** - Beautiful, accessible components
- **TanStack React Query** - Smart data fetching and caching
- **wouter** - Lightweight routing (3KB)
- **Framer Motion** - Smooth animations

### Backend
- **Hono** - Ultra-fast, edge-ready web framework (14KB)
- **Node.js** - JavaScript runtime
- **TypeScript** - Type-safe API layer
- **Drizzle ORM** - Type-safe database operations

### Database
- **PostgreSQL** - Robust relational database
- **Neon** - Serverless PostgreSQL with auto-scaling
- **Drizzle Kit** - Schema migrations

### AI & Integrations
- **Claude (Anthropic)** - Advanced AI for decision extraction
- **Octokit** - GitHub API integration
- **Model Context Protocol** - Connect to MCP servers

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                       │
│   Projects • Timeline • Decisions • Dashboard • MCP     │
└───────────────────────┬─────────────────────────────────┘
                        │
                        │ HTTP/JSON
                        ↓
┌─────────────────────────────────────────────────────────┐
│                    Hono API Server                       │
│  /meetings • /decisions • /projects • /events • /mcp   │
└───────────┬─────────────────────────┬───────────────────┘
            │                         │
            ↓                         ↓
   ┌────────────────┐      ┌─────────────────────┐
   │ Neon PostgreSQL│      │   Claude AI (API)   │
   │   (Drizzle)    │      │  Decision Extraction │
   └────────────────┘      └─────────────────────┘
```

---

## Getting Started

### Prerequisites

- **Node.js 20+**
- **PostgreSQL database** (Neon recommended for serverless)
- **Anthropic API key** (for Claude)

### Installation

```bash
# Clone the repository
git clone https://github.com/surbhi-una/better-decisions.git
cd better-decisions

# Install dependencies
cd Better-Decisions
npm install

# Set up environment variables
cp .env.example .env
```

### Environment Variables

Create a `.env` file in the `Better-Decisions` directory:

```env
# Database
DATABASE_URL=postgresql://user:pass@host/db

# AI
ANTHROPIC_API_KEY=sk-ant-...

# Server
PORT=3000
NODE_ENV=development

# Optional: GitHub Integration
GITHUB_TOKEN=ghp_...

# Optional: MCP Marketplace
SMITHERY_API_KEY=...
```

### Database Setup

```bash
# Run migrations
npm run db:push
```

### Development

```bash
# Start backend server
npm run dev

# In another terminal, start frontend
npm run dev:client
```

Open [http://localhost:5000](http://localhost:5000) in your browser.

### Production Build

```bash
npm run build
npm run start
```

---

## Usage

### 1. Submit Meeting Notes

Navigate to **Submit Meeting Notes** (`/meetings/new`):

1. Enter meeting title (e.g., "Sprint Planning - Feb 7")
2. Optionally specify source (Zoom, Google Meet, etc.)
3. Paste meeting notes or upload a `.vtt` file
4. Click **Submit Meeting Notes**
5. AI extracts decisions automatically (saved for future linking)

**Note:** The current implementation saves meeting notes without automatic decision extraction. Decisions are stored and can be linked to meetings manually or through future enhancements.

### 2. Browse Decisions

Go to **Decisions** (`/decisions`):

- Search by keyword in the global search bar
- Filter by status, project, or team
- Click any decision to view full details
- See participants, rationale, GitHub links, and meeting context

### 3. Explore Project Timeline

Visit **Decision Stream** (`/stream`):

- View all events chronologically
- See decisions highlighted with special styling
- Filter by project using `?project=<id>` parameter
- Click events for detailed information

### 4. Track Analytics

Check the **Dashboard** (`/dashboard`):

- View decision velocity over time
- Monitor active projects and meetings
- Export PDF reports
- See recent activity across teams

### 5. Connect MCP Servers

Configure **MCP** (`/mcp`):

- Browse the MCP marketplace
- Connect to servers via stdio or HTTP
- Discover available tools
- Execute tools directly from the UI

---

## Key Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Projects | Grid/list view of all projects with stats |
| `/stream` | Context Timeline | Visual timeline of all events (filterable by project) |
| `/dashboard` | Analytics | Charts, metrics, and activity feed |
| `/meetings/new` | Submit Notes | Upload or paste meeting notes for processing |
| `/decisions` | Decisions Browser | Search, filter, and view all decisions |
| `/mcp` | MCP Configuration | Connect and manage MCP servers |

---

## Data Model

### Core Entities

**Projects**
- Auto-generated from decision context
- Track status, progress, team, and tags

**Meetings**
- Store raw notes and transcripts
- Link to extracted decisions
- Track source (Zoom, Google Meet, etc.)

**Decisions**
- Extracted from meetings (or manually created)
- Include title, description, rationale
- Status: decided, proposed, revisiting, superseded
- Confidence: high, medium, low

**Decision Participants**
- Name and role (decider, approver, contributor, informed)

**Events**
- Timeline entries (meetings, notes, code changes)
- Filterable by project
- Can be marked as decisions

**GitHub Links**
- Connect decisions to PRs, issues, commits
- Track implementation traceability

---

## Performance

- **Frontend bundle**: Optimized with Vite and minimal dependencies
- **API response**: <100ms for most queries (Neon edge caching)
- **AI extraction**: 3-5 seconds (Claude processing time)
- **Database**: Serverless PostgreSQL scales to zero when idle
- **Type safety**: End-to-end TypeScript prevents runtime errors

---

## Future Roadmap

### Near-term
- [ ] Real-time AI decision extraction on meeting submission
- [ ] Slack integration for automatic decision capture
- [ ] Meeting bot (join Zoom/Meet and extract in real-time)
- [ ] Email digests (weekly decision summaries)
- [ ] Enhanced MCP bridge features

### Medium-term
- [ ] Decision dependencies graph
- [ ] Impact tracking (did the decision achieve its goal?)
- [ ] Team analytics and decision velocity metrics
- [ ] Multi-organization support with SSO

### Long-term
- [ ] AI advisor (detect conflicting decisions)
- [ ] Predictive analytics for decision quality
- [ ] API marketplace (Jira, Linear, GitLab)
- [ ] On-premise deployment option

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT

---

## Team & Contact

**Built by:** Surbhi Bhatnagar

**Repository:** [github.com/surbhi-una/better-decisions](https://github.com/surbhi-una/better-decisions)

**Stack:** React 19 + Hono + Claude AI + Neon PostgreSQL + Model Context Protocol

---

*Better-Decisions: Because the most expensive decisions are the ones nobody remembers making.*
