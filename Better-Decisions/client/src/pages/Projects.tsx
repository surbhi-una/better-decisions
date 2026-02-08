import { useState } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AgentModal } from "@/components/AgentModal";
import { useQuery } from "@tanstack/react-query";
import type { Project } from "@shared/schema";
import { 
  FolderKanban, 
  Calendar, 
  Users, 
  GitBranch, 
  MessageSquare, 
  ChevronRight,
  Plus,
  LayoutGrid,
  List,
  Clock,
  Zap,
  Target,
  TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";

export default function Projects() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAgentOpen, setIsAgentOpen] = useState(false);

  const { data: projectsList = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: stats } = useQuery<{
    activeProjects: number;
    totalDecisions: number;
    totalMeetings: number;
  }>({
    queryKey: ["/api/stats"],
  });

  const activeProjects = projectsList.filter(p => p.status === 'active');
  const totalMeetings = stats?.totalMeetings ?? 0;
  const totalDecisions = stats?.totalDecisions ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in">
        <div className="h-8 w-48 bg-secondary/50 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-secondary/30 rounded-lg animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Track decision streams across all your ongoing initiatives
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsAgentOpen(true)}>
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-card/50 border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <FolderKanban className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-active-projects">{activeProjects.length}</p>
              <p className="text-xs text-muted-foreground">Active Projects</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-card/50 border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <MessageSquare className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-total-meetings">{totalMeetings}</p>
              <p className="text-xs text-muted-foreground">Total Meetings</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-card/50 border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Target className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-total-decisions">{totalDecisions}</p>
              <p className="text-xs text-muted-foreground">Total Decisions</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">All Projects</h2>
        <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
          <Button 
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="h-8 px-3"
            onClick={() => setViewMode('grid')}
            data-testid="button-view-grid"
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="h-8 px-3"
            onClick={() => setViewMode('list')}
            data-testid="button-view-list"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectsList.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/projects/${project.id}`}>
                <Card 
                  className="p-5 bg-card/50 border-white/10 hover:border-primary/30 transition-all cursor-pointer group h-full"
                  data-testid={`card-project-${project.id}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: project.color }}
                    />
                    <Badge 
                      variant={project.status === 'active' ? 'default' : project.status === 'completed' ? 'secondary' : 'outline'}
                      className={`text-[10px] ${project.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : ''}`}
                    >
                      {project.status}
                    </Badge>
                  </div>

                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {project.description}
                  </p>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-1.5" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {project.team.slice(0, 4).map((member, j) => (
                        <div 
                          key={member}
                          className="w-7 h-7 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[10px] font-medium"
                          title={member}
                        >
                          {member.split(' ').map(n => n[0]).join('')}
                        </div>
                      ))}
                      {project.team.length > 4 && (
                        <div className="w-7 h-7 rounded-full bg-secondary/50 border-2 border-card flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                          +{project.team.length - 4}
                        </div>
                      )}
                    </div>
                    {project.tags.length > 0 && (
                      <div className="flex gap-1">
                        {project.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="outline" className="text-[9px]">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {projectsList.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link href={`/projects/${project.id}`}>
                <Card 
                  className="p-4 bg-card/50 border-white/10 hover:border-primary/30 transition-all cursor-pointer group"
                  data-testid={`row-project-${project.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-2 h-12 rounded-full shrink-0" 
                      style={{ backgroundColor: project.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {project.name}
                        </h3>
                        <Badge 
                          variant="outline"
                          className={`text-[10px] ${project.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : ''}`}
                        >
                          {project.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {project.description}
                      </p>
                    </div>
                    <div className="hidden md:flex items-center gap-6 shrink-0">
                      <div className="w-24">
                        <Progress value={project.progress} className="h-1.5" />
                        <p className="text-[10px] text-muted-foreground text-right mt-1">{project.progress}%</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
      
      <AgentModal 
        isOpen={isAgentOpen} 
        onClose={() => setIsAgentOpen(false)} 
        mode="create-project" 
      />
    </div>
  );
}
