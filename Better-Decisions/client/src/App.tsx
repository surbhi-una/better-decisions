import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import ContextTimeline from "@/pages/ContextTimeline";
import MCPConfig from "@/pages/MCPConfig";
import Projects from "@/pages/Projects";
import MeetingNotesSubmit from "@/pages/MeetingNotesSubmit";
import Decisions from "@/pages/Decisions";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Projects} />
        <Route path="/stream" component={ContextTimeline} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/meetings/new" component={MeetingNotesSubmit} />
        <Route path="/decisions" component={Decisions} />
        <Route path="/mcp" component={MCPConfig} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
