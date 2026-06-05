import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import Home from "./pages/home";
import Analyze from "./pages/analyze";

const queryClient = new QueryClient();

function DarkModeController() {
  const [location] = useLocation();
  useEffect(() => {
    const isAnalyzePage = location.startsWith("/analyze/");
    if (isAnalyzePage) {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, [location]);
  return null;
}

function Router() {
  return (
    <>
      <DarkModeController />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/analyze/:address" component={Analyze} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
