import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TopNav } from "@/components/top-nav";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, CalendarDays, Award } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useState } from "react";
import { toast } from "sonner";
import { BookCover } from "@/components/book-cover";

export const Route = createFileRoute("/contests")({
  component: ContestsPage,
});

function ContestsPage() {
  const { user } = useSession();
  
  const { data: contests = [], isLoading } = useQuery({
    queryKey: ["contests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: myProfile } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      return data;
    },
    enabled: !!user,
  });

  const isAdmin = myProfile?.role === "admin";

  const activeContests = contests.filter(c => c.status === "active");
  const pastContests = contests.filter(c => c.status === "completed");

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <TopNav />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="mb-12 text-center space-y-4">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-transparent uppercase tracking-wider text-xs">Writing Contests</Badge>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground">Challenges & Prompts</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Participate in our monthly writing contests. Win prizes, gain exposure, and challenge yourself.
          </p>
          {isAdmin && (
            <div className="pt-4">
              <Button onClick={() => toast.info("Admin contest creation UI coming soon!")}>
                Create New Contest (Admin)
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-48 bg-muted rounded-xl"></div>
            <div className="h-48 bg-muted rounded-xl"></div>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Active Contests */}
            <section>
              <h2 className="mb-6 font-serif text-2xl font-bold flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                Active Contests
              </h2>
              {activeContests.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground border-dashed">
                  No active contests at the moment. Check back soon!
                </Card>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  {activeContests.map(c => (
                    <ContestCard key={c.id} contest={c} />
                  ))}
                </div>
              )}
            </section>

            {/* Past Contests */}
            <section>
              <h2 className="mb-6 font-serif text-2xl font-bold text-muted-foreground flex items-center gap-2">
                Past Contests
              </h2>
              {pastContests.length === 0 ? (
                <p className="text-muted-foreground">No past contests yet.</p>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 opacity-75">
                  {pastContests.map(c => (
                    <ContestCard key={c.id} contest={c} isPast />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function ContestCard({ contest, isPast = false }: { contest: any, isPast?: boolean }) {
  const { user } = useSession();
  const [submitting, setSubmitting] = useState(false);

  // Fetch user's approved novels for submission dropdown
  const { data: myNovels = [] } = useQuery({
    queryKey: ["my-approved-novels", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("novels").select("id, title").eq("author_id", user.id).eq("approval_status", "approved");
      return data || [];
    },
    enabled: !!user && !isPast,
  });

  const handleEnterContest = async () => {
    if (!user) return toast.error("Please login to participate.");
    if (myNovels.length === 0) return toast.error("You need an approved novel to enter.");
    
    // Simplification for the UI: just submit the first novel for now
    // In a full implementation, you'd show a dialog to select which novel.
    const novelToSubmit = myNovels[0];
    
    setSubmitting(true);
    const { error } = await supabase.from("contest_entries").insert({
      contest_id: contest.id,
      novel_id: novelToSubmit.id,
      user_id: user.id
    });
    
    setSubmitting(false);
    if (error) {
      if (error.code === '23505') toast.error("You have already entered this novel into the contest.");
      else toast.error(error.message);
    } else {
      toast.success(`Successfully entered "${novelToSubmit.title}"!`);
    }
  };

  return (
    <Card className={`overflow-hidden flex flex-col ${isPast ? 'bg-muted/30' : 'card-hover border-primary/20'}`}>
      <div className={`h-2 ${isPast ? 'bg-muted' : 'bg-gradient-to-r from-primary to-purple-500'}`} />
      <CardHeader>
        <CardTitle className="font-serif text-xl">{contest.title}</CardTitle>
        <CardDescription className="flex flex-col gap-2 mt-2">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3 w-3" /> Ends: {new Date(contest.end_date).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-orange-500 font-medium">
            <Trophy className="h-3 w-3" /> Prize: {contest.prize}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <p className="text-sm text-foreground/80 mb-6 line-clamp-3">
          {contest.description}
        </p>
        
        {!isPast ? (
          <Button onClick={handleEnterContest} disabled={submitting} className="w-full">
            {submitting ? "Entering..." : "Enter Contest"}
          </Button>
        ) : (
          <Button variant="outline" disabled className="w-full">
            Contest Ended
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
