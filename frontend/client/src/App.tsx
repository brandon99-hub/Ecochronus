import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import MissionPage from "@/pages/MissionPage";
import CompleteMissionPage from "@/pages/CompleteMissionPage";
import NotFound from "@/pages/not-found";
import ProfilePage from "@/pages/ProfilePage";
import CodexPage from "@/pages/CodexPage";
import RewardsPage from "@/pages/RewardsPage";
import MapPage from "@/pages/MapPage";
import InventoryPage from "@/pages/InventoryPage";
import { useSyncExternalStore } from "react";
import { authStore } from "@/lib/api";

function Router() {
  const isAuthenticated = useSyncExternalStore(
    authStore.subscribe,
    authStore.getSnapshot,
    authStore.getServerSnapshot
  );

  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/dashboard">
        {isAuthenticated ? <Dashboard /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/mission/:id">
        {isAuthenticated ? <MissionPage /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/mission/:id/complete">
        {isAuthenticated ? <CompleteMissionPage /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/profile">
        {isAuthenticated ? <ProfilePage /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/codex">
        {isAuthenticated ? <CodexPage /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/rewards">
        {isAuthenticated ? <RewardsPage /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/map">
        {isAuthenticated ? <MapPage /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/inventory">
        {isAuthenticated ? <InventoryPage /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/">
        {isAuthenticated ? <Redirect to="/dashboard" /> : <Redirect to="/auth" />}
      </Route>
      <Route component={NotFound} />
    </Switch>
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
