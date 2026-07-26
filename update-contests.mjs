import fs from "fs";
let content = fs.readFileSync("src/routes/contests.tsx", "utf8");

// 1. Update the query to include contest_entries
content = content.replace(
  /select\("\*"\)/,
  `select("*, entries:contest_entries(id, user_id, novel_id, user:profiles(display_name), novel:novels(title, slug))")`
);

// We need to import Select components and Users icon
if (!content.includes("Select,")) {
  content = content.replace(
    /import \{ Dialog, DialogContent,/,
    `import { Users } from "lucide-react";\nimport { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";\nimport { Dialog, DialogContent,`
  );
}

// 2. Rewrite ContestCard function completely
const newContestCard = `
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
      toast.success(\`Successfully entered!\`);
      setEnterOpen(false);
      // Ideally invalidate queries here but page refresh will work too, or pass down a refetch function
    }
  };

  return (
    <Card className={\`overflow-hidden flex flex-col \${isPast ? 'bg-muted/30' : 'card-hover border-primary/20'}\`}>
      <div className={\`h-2 \${isPast ? 'bg-muted' : 'bg-gradient-to-r from-primary to-purple-500'}\`} />
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
                        <Link to={\`/novel/\${entry.novel?.slug}\`} className="font-medium text-primary hover:underline" onClick={() => setDetailsOpen(false)}>
                          {entry.novel?.title}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">by {entry.user?.display_name}</p>
                      </div>
                      <Link to={\`/novel/\${entry.novel?.slug}\`} onClick={() => setDetailsOpen(false)}>
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
`;

// Extract everything except ContestCard and AdminContestDialog
const regex = /function ContestCard[\s\S]*?(?=function AdminContestDialog)/;
content = content.replace(regex, newContestCard + "\n\n");

fs.writeFileSync("src/routes/contests.tsx", content);
console.log("Updated contests.tsx");
