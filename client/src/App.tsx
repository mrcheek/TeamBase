import { useEffect, useRef } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { BottomNav } from "@/components/bottom-nav";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home";
import PlayPage from "@/pages/play";
import CheckInPage from "@/pages/check-in";
import TrainPage from "@/pages/train";
import ProfilePage from "@/pages/profile";
import CompleteProfilePage from "@/pages/complete-profile";
import ClubDetailPage from "@/pages/club-detail";
import EventDetailPage from "@/pages/event-detail";
import AdminPage from "@/pages/admin";
import NotFound from "@/pages/not-found";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

function ProfileCompletionPrompt() {
  const { user, profileCompletion } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const shownRef = useRef(false);

  useEffect(() => {
    if (user && !user.profileCompleted && profileCompletion < 100 && !shownRef.current) {
      shownRef.current = true;
      const timer = setTimeout(() => {
        toast({
          title: `Complete Your Registration - ${profileCompletion}% Done`,
          description: "Tap here to finish setting up your ZRF profile.",
          duration: 8000,
          action: (
            <ToastAction
              altText="Complete profile"
              onClick={() => setLocation("/complete-profile")}
              data-testid="button-complete-profile-toast"
            >
              Complete
            </ToastAction>
          ),
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, profileCompletion]);

  return null;
}

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading ZRF Rugby...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">Z</span>
            </div>
            <span className="font-bold text-sm tracking-tight">ZRF Rugby</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">
              {user.xpTotal} XP
            </span>
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary text-[10px] font-bold">
                {user.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <ProfileCompletionPrompt />

      <main className="pt-2 pb-2">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/play" component={PlayPage} />
          <Route path="/check-in" component={CheckInPage} />
          <Route path="/train" component={TrainPage} />
          <Route path="/profile" component={ProfilePage} />
          <Route path="/complete-profile" component={CompleteProfilePage} />
          <Route path="/admin" component={AdminPage} />
          <Route path="/clubs/:id" component={ClubDetailPage} />
          <Route path="/events/:id" component={EventDetailPage} />
          <Route component={NotFound} />
        </Switch>
      </main>

      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
