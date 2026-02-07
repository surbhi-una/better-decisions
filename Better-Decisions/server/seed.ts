import { db } from "./db";
import { projects, events, activities } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  const existingProjects = await db.select().from(projects);
  if (existingProjects.length > 0) {
    console.log("Database already seeded, skipping.");
    return;
  }

  await db.insert(projects).values([
    {
      id: "black-friday-outage",
      name: "Black Friday Outage Response",
      description: "Critical production incident: 47-minute checkout outage during peak traffic. Full post-mortem and remediation.",
      status: "completed",
      progress: 100,
      team: ["Sarah Chen", "Marcus Johnson", "Alex Rivera", "Priya Patel", "DevOps On-Call"],
      color: "hsl(0, 84%, 60%)",
      tags: ["incident", "P0", "post-mortem"],
    },
    {
      id: "payment-latency",
      name: "Payment Gateway Latency",
      description: "Investigating 3x increase in payment processing times affecting conversion rates",
      status: "active",
      progress: 65,
      team: ["Jordan Kim", "Sarah Chen", "Payments Team"],
      color: "hsl(38, 92%, 50%)",
      tags: ["performance", "payments", "revenue-impact"],
    },
    {
      id: "q1-platform-scaling",
      name: "Q1 Platform Scaling",
      description: "Proactive infrastructure upgrades to handle 3x projected traffic growth",
      status: "active",
      progress: 35,
      team: ["Marcus Johnson", "Alex Rivera", "Platform Team"],
      color: "hsl(262, 83%, 58%)",
      tags: ["infrastructure", "scaling", "Q1 Priority"],
    },
    {
      id: "mobile-app-v2",
      name: "Mobile App v2.0",
      description: "Complete redesign of mobile experience with offline-first architecture",
      status: "active",
      progress: 28,
      team: ["Emily Zhang", "Lisa Wong", "UX Team"],
      color: "hsl(199, 89%, 48%)",
      tags: ["mobile", "UX", "Q2 Launch"],
    },
    {
      id: "soc2-compliance",
      name: "SOC 2 Certification",
      description: "Security compliance initiative for enterprise customer requirements",
      status: "active",
      progress: 72,
      team: ["Security Team", "Sarah Chen", "Legal"],
      color: "hsl(142, 71%, 45%)",
      tags: ["security", "compliance", "enterprise"],
    },
  ]);

  await db.insert(events).values([
    {
      id: "1",
      projectId: "black-friday-outage",
      type: "note",
      label: "P0 Alert: Checkout Down",
      description: "PagerDuty triggered at 10:23 AM during peak Black Friday traffic.",
      timestamp: "Nov 29, 10:23 AM",
      impact: "high",
      summary: "Automated monitoring detected 100% failure rate on /api/checkout endpoint. Customer-facing error rate spiked from 0.1% to 98%. Estimated revenue impact: $47,000/minute.",
      tags: ["P0", "incident", "checkout", "revenue-critical"],
      sortOrder: 1,
    },
    {
      id: "2",
      projectId: "black-friday-outage",
      type: "meeting",
      label: "War Room Assembled",
      description: "Emergency all-hands with engineering leadership.",
      timestamp: "Nov 29, 10:31 AM",
      impact: "high",
      summary: "CTO Sarah Chen opened war room. Initial hypothesis: database connection pool exhaustion. Datadog showing 0 available connections. Orders stuck in pending state.",
      participants: ["Sarah Chen (CTO)", "Marcus Johnson (Platform Lead)", "Alex Rivera (DBA)", "Priya Patel (On-Call)", "DevOps Team"],
      transcript: "Sarah: What do we know?\nMarcus: Checkout is returning 503s across all pods.\nAlex: I'm seeing the connection pool at max. Something's holding connections.\nPriya: There was a deploy at 10:15 AM—the inventory sync feature.\nSarah: Roll it back. Now.",
      actionItems: [
        { text: "Rollback deployment v2.4.7", assignee: "Priya Patel", status: "completed" },
        { text: "Scale up database read replicas", assignee: "Alex Rivera", status: "completed" },
      ],
      tags: ["war-room", "incident-response", "leadership"],
      sortOrder: 2,
    },
    {
      id: "3",
      projectId: "black-friday-outage",
      type: "note",
      isDecision: true,
      label: "Emergency Rollback Approved",
      description: "CTO authorized immediate rollback of v2.4.7 release.",
      timestamp: "Nov 29, 10:34 AM",
      impact: "high",
      summary: "Decision made to rollback to v2.4.6 rather than debug in production. Trade-off: lose new inventory sync feature, but restore checkout immediately. Estimated time to restore: 8 minutes.",
      tags: ["decision", "rollback", "risk-mitigation"],
      relatedLinks: [
        { label: "Rollback Runbook", url: "#" },
        { label: "Release v2.4.7 Notes", url: "#" },
      ],
      sortOrder: 3,
    },
    {
      id: "4",
      projectId: "black-friday-outage",
      type: "code",
      label: "Root Cause Identified",
      description: "N+1 query in inventory sync was holding DB connections.",
      timestamp: "Nov 29, 10:42 AM",
      impact: "high",
      summary: "The new inventory sync feature introduced an N+1 query that held database connections open during a long-running loop. Under Black Friday load, this exhausted the 100-connection pool in seconds.",
      codeSnippet: `// THE BUG (v2.4.7) - N+1 query holding connections
async function syncInventory(items) {
  for (const item of items) {
    // Each iteration holds a connection!
    const stock = await db.query(
      'SELECT * FROM inventory WHERE sku = $1', 
      [item.sku]
    );
    await updateCache(item.sku, stock);
  }
}

// THE FIX (v2.4.8) - Batch query, single connection
async function syncInventory(items) {
  const skus = items.map(i => i.sku);
  const stocks = await db.query(
    'SELECT * FROM inventory WHERE sku = ANY($1)',
    [skus]
  );
  await updateCacheBatch(stocks);
}`,
      relatedLinks: [
        { label: "View Commit", url: "#" },
        { label: "Open in Cursor", url: "cursor://file/src/inventory-sync.ts" },
      ],
      tags: ["root-cause", "N+1", "database", "connection-pool"],
      sortOrder: 4,
    },
    {
      id: "5",
      projectId: "black-friday-outage",
      type: "note",
      label: "Service Restored",
      description: "Checkout back online at 11:10 AM. Total downtime: 47 minutes.",
      timestamp: "Nov 29, 11:10 AM",
      impact: "high",
      summary: "Rollback completed and verified. Checkout success rate returned to 99.7%. Estimated revenue loss: $2.2M. Customer support queue: 847 tickets opened during incident.",
      tags: ["resolved", "metrics", "revenue-impact"],
      sortOrder: 5,
    },
    {
      id: "6",
      projectId: "black-friday-outage",
      type: "meeting",
      label: "Blameless Post-Mortem",
      description: "Full incident review with action items to prevent recurrence.",
      timestamp: "Dec 2, 2:00 PM",
      impact: "high",
      summary: "Comprehensive review identified 3 systemic failures: (1) Load testing didn't simulate Black Friday scale, (2) No circuit breaker on inventory sync, (3) Connection pool alerts fired but were ignored.",
      participants: ["Sarah Chen (CTO)", "Marcus Johnson", "Alex Rivera", "Priya Patel", "QA Team", "Product Owner"],
      transcript: "Sarah: Let's be clear—this is about systems, not blame. What failed?\nMarcus: Our load tests max out at 10x normal. Black Friday was 47x.\nAlex: The connection pool alert fired at 10:19 but got lost in noise.\nPriya: I saw the alert but thought it was a false positive—we've had those.\nSarah: So we need better alerts and realistic load tests.",
      actionItems: [
        { text: "Implement circuit breaker pattern for all sync jobs", assignee: "Marcus Johnson", status: "completed" },
        { text: "Upgrade load testing to 100x capacity", assignee: "QA Team", status: "completed" },
        { text: "Create P0 alert channel with phone escalation", assignee: "DevOps", status: "completed" },
        { text: "Add connection pool metrics to main dashboard", assignee: "Alex Rivera", status: "completed" },
      ],
      openQuestions: [],
      tags: ["post-mortem", "blameless", "process-improvement"],
      relatedLinks: [{ label: "Meeting Notes", url: "#" }],
      sortOrder: 6,
    },
    {
      id: "7",
      projectId: "black-friday-outage",
      type: "note",
      isDecision: true,
      label: "Circuit Breaker Mandate",
      description: "All background jobs must implement circuit breakers.",
      timestamp: "Dec 2, 3:30 PM",
      impact: "high",
      summary: "New engineering standard: All database-intensive background jobs must implement circuit breaker pattern with automatic backoff. Added to PR checklist and CI pipeline.",
      tags: ["decision", "engineering-standard", "prevention"],
      relatedLinks: [
        { label: "RFC-031: Circuit Breakers", url: "#" },
        { label: "PR Template Update", url: "#" },
      ],
      sortOrder: 7,
    },
    {
      id: "8",
      projectId: "black-friday-outage",
      type: "code",
      label: "Hotfix Deployed: v2.4.8",
      description: "Fixed inventory sync with batch queries and circuit breaker.",
      timestamp: "Dec 3, 9:00 AM",
      impact: "medium",
      summary: "Inventory sync feature re-released with batch queries (single connection), circuit breaker (trips at 50% error rate), and comprehensive load testing (verified at 100x capacity).",
      codeSnippet: `// Circuit breaker implementation
const circuitBreaker = new CircuitBreaker({
  timeout: 5000,
  errorThreshold: 50,
  resetTimeout: 30000
});

async function syncInventory(items) {
  return circuitBreaker.fire(async () => {
    const skus = items.map(i => i.sku);
    const stocks = await db.query(
      'SELECT * FROM inventory WHERE sku = ANY($1)',
      [skus]
    );
    await updateCacheBatch(stocks);
  });
}`,
      relatedLinks: [
        { label: "View PR #1247", url: "#" },
        { label: "Load Test Results", url: "#" },
      ],
      tags: ["hotfix", "circuit-breaker", "tested"],
      sortOrder: 8,
    },
    {
      id: "9",
      projectId: "payment-latency",
      type: "note",
      label: "Latency Spike Detected",
      description: "Payment processing times increased from 200ms to 600ms average.",
      timestamp: "2 days ago",
      impact: "high",
      summary: "Monitoring detected 3x increase in Stripe API response times. Conversion rate dropped 2.3% correlated with checkout abandonment during payment step.",
      tags: ["latency", "payments", "conversion"],
      sortOrder: 9,
    },
    {
      id: "10",
      projectId: "payment-latency",
      type: "meeting",
      label: "Payment Team Sync",
      description: "Investigating latency with Stripe integration.",
      timestamp: "Yesterday, 10:00 AM",
      impact: "medium",
      summary: "Team reviewed Stripe dashboard and our integration code. Initial hypothesis: our fraud check middleware is adding latency. Stripe's own latency is within SLA.",
      participants: ["Jordan Kim", "Sarah Chen", "Payments Team"],
      actionItems: [
        { text: "Profile fraud check middleware", assignee: "Jordan Kim", status: "pending" },
        { text: "Contact Stripe support for latency breakdown", assignee: "Payments Team", status: "completed" },
      ],
      openQuestions: [
        "Is the fraud check necessary for all transactions?",
        "Can we run fraud checks async post-payment?",
      ],
      tags: ["investigation", "stripe", "fraud-check"],
      sortOrder: 10,
    },
    {
      id: "11",
      projectId: "q1-platform-scaling",
      type: "meeting",
      label: "Capacity Planning Review",
      description: "Quarterly infrastructure planning for projected growth.",
      timestamp: "3 days ago",
      impact: "medium",
      summary: "Finance projects 3x user growth in Q1 due to marketing campaign. Current infrastructure can handle 2.1x. Need to scale database, cache, and CDN.",
      participants: ["Marcus Johnson", "Alex Rivera", "Platform Team", "Finance"],
      actionItems: [
        { text: "Upgrade RDS to db.r6g.2xlarge", assignee: "Alex Rivera", status: "pending" },
        { text: "Add Redis cluster nodes", assignee: "Platform Team", status: "pending" },
        { text: "Expand CDN edge locations", assignee: "DevOps", status: "completed" },
      ],
      tags: ["capacity", "scaling", "Q1"],
      sortOrder: 11,
    },
    {
      id: "12",
      projectId: "q1-platform-scaling",
      type: "note",
      isDecision: true,
      label: "Approve $45K Infrastructure Spend",
      description: "Budget approved for Q1 scaling initiative.",
      timestamp: "2 days ago",
      impact: "high",
      summary: "CFO approved $45,000 monthly infrastructure increase. Includes database upgrade ($18K), additional Redis nodes ($12K), and CDN expansion ($15K). ROI: prevents estimated $2M+ in lost revenue from outages.",
      tags: ["decision", "budget", "approved"],
      sortOrder: 12,
    },
  ]);

  await db.insert(activities).values([
    { user: "Sarah Chen", action: "closed incident", target: "Black Friday Outage", time: "3 days ago" },
    { user: "Marcus Johnson", action: "deployed fix", target: "v2.4.8", time: "3 days ago" },
    { user: "Jordan Kim", action: "opened investigation", target: "Payment Latency", time: "2 days ago" },
    { user: "Alex Rivera", action: "approved budget", target: "Q1 Scaling", time: "2 days ago" },
  ]);

  console.log("Seeding complete!");
}

seed().catch(console.error).then(() => process.exit(0));
