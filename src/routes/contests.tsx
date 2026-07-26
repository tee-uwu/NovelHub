import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";


export const Route = createFileRoute("/contests")({
  head: () => ({
    meta: [
      { title: "Writing Contests | NovelHub" },
      { name: "description", content: "Participate in writing contests, win prizes, and get recognized on NovelHub." },
      { property: "og:title", content: "Writing Contests | NovelHub" },
      { property: "og:description", content: "Participate in writing contests, win prizes, and get recognized on NovelHub." },
    ],
  }),
  component: ContestsPage,
});

function ContestsPage() {
  const { user } = useSession();
  
  const { data: contests = [], isLoading } = useQuery({
    queryKey: ["contests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contests")
        .select("*, entries:contest_entries(id, user_id, novel_id, user:profiles(display_name), novel:novels(title, slug))")
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
              <AdminContestDialog />
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
  const [enterOpen, setEnterOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedNovelId, setSelectedNovelId] = useState<string>("");

  const { data: myNovels = [] } = useQuery({
    queryKey: ["my-approved-novels", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("novels").select("id, title").eq("author_id", user.id).eq("approval_status", "approved");
      return data || [];
    },
    enabled: !!user && !isPast,
  });

  const handleEnterContest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Please login to participate.");
    if (!selectedNovelId) return toast.error("Please select a novel to enter.");
    
    setSubmitting(true);
    const { error } = await supabase.from("contest_entries").insert({
      contest_id: contest.id,
      novel_id: selectedNovelId,
      user_id: user.id
    });
    
    setSubmitting(false);
    if (error) {
      if (error.code === '23505') toast.error("You have already entered this novel into the contest.");
      else toast.error(error.message);
    } else {
      toast.success(`Successfully entered!`);
      setEnterOpen(false);
      // Ideally invalidate queries here but page refresh will work too, or pass down a refetch function
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
          <span className="flex items-center gap-1.5 text-xs text-blue-500 font-medium">
            <Users className="h-3 w-3" /> Participants: {contest.entries?.length || 0}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <p className="text-sm text-foreground/80 mb-6 line-clamp-3">
          {contest.description}
        </p>
        
        <div className="flex gap-2 mt-auto">
          <Button variant="secondary" className="flex-1" onClick={() => setDetailsOpen(true)}>
            View Details
          </Button>

          {!isPast ? (
            <Dialog open={enterOpen} onOpenChange={setEnterOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1" onClick={() => {
                  if (!user) {
                    toast.error("Please login to participate.");
                    return;
                  }
                  if (myNovels.length === 0) {
                    toast.error("You need an approved novel to enter.");
                    return;
                  }
                }}>
                  Enter Contest
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleEnterContest}>
                  <DialogHeader>
                    <DialogTitle>Enter Contest</DialogTitle>
                    <DialogDescription>Select which of your approved novels you'd like to submit for "{contest.title}".</DialogDescription>
                  </DialogHeader>
                  <div className="py-6">
                    <Label className="mb-2 block">Select Novel</Label>
                    <Select value={selectedNovelId} onValueChange={setSelectedNovelId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a novel..." />
                      </SelectTrigger>
                      <SelectContent>
                        {myNovels.map((n: any) => (
                          <SelectItem key={n.id} value={n.id}>{n.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setEnterOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={submitting || !selectedNovelId}>
                      {submitting ? "Entering..." : "Submit Entry"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : (
            <Button variant="outline" disabled className="flex-1">
              Contest Ended
            </Button>
          )}
        </div>
      </CardContent>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">{contest.title}</DialogTitle>
            <div className="flex flex-wrap gap-4 pt-2">
              <Badge variant="outline" className="flex items-center gap-1 text-orange-500 border-orange-500/20 bg-orange-500/10">
                <Trophy className="h-3 w-3" /> {contest.prize}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" /> Ends: {new Date(contest.end_date).toLocaleDateString()}
              </Badge>
            </div>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div>
              <h4 className="text-sm font-semibold mb-2 uppercase tracking-wider text-muted-foreground">Description & Rules</h4>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{contest.description}</p>
            </div>
            
            <div className="border-t pt-6">
              <h4 className="text-sm font-semibold mb-4 flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                <Users className="h-4 w-4" /> Participants ({contest.entries?.length || 0})
              </h4>
              {(!contest.entries || contest.entries.length === 0) ? (
                <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg text-center">No one has entered this contest yet. Be the first!</p>
              ) : (
                <div className="space-y-3">
                  {contest.entries.map((entry: any) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <div>
                        <Link to={`/novel/${entry.novel?.slug}`} className="font-medium text-primary hover:underline" onClick={() => setDetailsOpen(false)}>
                          {entry.novel?.title}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">by {entry.user?.display_name}</p>
                      </div>
                      <Link to={`/novel/${entry.novel?.slug}`} onClick={() => setDetailsOpen(false)}>
                        <Button size="sm" variant="secondary">Read Novel</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}


function AdminContestDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prize, setPrize] = useState("");
  const [endDate, setEndDate] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("contests").insert({
        title,
        description,
        prize,
        end_date: endDate,
        start_date: new Date().toISOString(),
        status: "active"
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contests"] });
      toast.success("Contest created successfully!");
      setOpen(false);
      // reset form
      setTitle("");
      setDescription("");
      setPrize("");
      setEndDate("");
    },
    onError: (error) => {
      toast.error(`Failed to create contest: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !prize || !endDate) {
      toast.error("Please fill in all fields");
      return;
    }
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create New Contest (Admin)</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Writing Contest</DialogTitle>
            <DialogDescription>
              Launch a new writing contest for the community.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Contest Title</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Summer Romance Prompt" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the rules, theme, and requirements..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prize">Prize Details</Label>
              <Input id="prize" value={prize} onChange={e => setPrize(e.target.value)} placeholder="e.g. 5000 XP & Special Badge" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Launch Contest"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
