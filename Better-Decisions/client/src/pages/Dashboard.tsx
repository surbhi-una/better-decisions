import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { Activity } from "@shared/schema";
import { ArrowUpRight, MessageSquare, GitMerge, Activity as ActivityIcon, Clock } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer } from "recharts";

const chartData = [
  { day: "Mon", context: 120, decisions: 45 },
  { day: "Tue", context: 155, decisions: 52 },
  { day: "Wed", context: 180, decisions: 68 },
  { day: "Thu", context: 140, decisions: 40 },
  { day: "Fri", context: 210, decisions: 85 },
  { day: "Sat", context: 90, decisions: 20 },
  { day: "Sun", context: 60, decisions: 15 },
];

export default function Dashboard() {
  const { data: stats } = useQuery<{
    activeProjects: number;
    totalDecisions: number;
    totalMeetings: number;
    totalEvents: number;
  }>({
    queryKey: ["/api/stats"],
  });

  const { data: activityList = [] } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const statCards = [
    { label: "Active Contexts", value: stats?.totalEvents?.toLocaleString() ?? "...", change: "+12.5%", icon: ActivityIcon },
    { label: "Decisions Logged", value: stats?.totalDecisions?.toString() ?? "...", change: "+4.2%", icon: GitMerge },
    { label: "Meetings Processed", value: stats?.totalMeetings?.toString() ?? "...", change: "+8.1%", icon: MessageSquare },
    { label: "Avg. Time to Code", value: "4.2h", change: "-15%", icon: Clock },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Overview of decision velocity and context ingestion.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" data-testid="button-export">Export Report</Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20" data-testid="button-new-analysis">
            New Analysis
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="bg-card/50 backdrop-blur-sm border-white/5 hover:border-white/10 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`text-stat-${i}`}>{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className={stat.change.startsWith('+') ? "text-emerald-500" : "text-amber-500"}>
                  {stat.change}
                </span>{" "}
                from last week
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="col-span-4 bg-card/50 backdrop-blur-sm border-white/5">
          <CardHeader>
            <CardTitle>Context Velocity</CardTitle>
            <CardDescription>
              Volume of context tokens processed vs. decisions made.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorContext" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDecisions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="context" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorContext)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="decisions" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorDecisions)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-card/50 backdrop-blur-sm border-white/5 flex flex-col">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest actions across the organization.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-6">
              {activityList.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 group" data-testid={`activity-${activity.id}`}>
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium border border-white/5 group-hover:border-primary/50 transition-colors">
                    {activity.user.charAt(0)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.user}
                      <span className="text-muted-foreground font-normal ml-1">
                        {activity.action}
                      </span>
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] font-mono font-normal">
                        {activity.target}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
