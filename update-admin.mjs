import fs from "fs";
let content = fs.readFileSync("src/routes/_authenticated/admin.tsx", "utf8");

if (!content.includes("CalendarDays")) {
  content = content.replace("Star, Trash2, Ban, ShieldCheck, Loader2, CheckCircle2, Award, Plus, TrendingUp, Users, BookOpen, AlertTriangle", "Star, Trash2, Ban, ShieldCheck, Loader2, CheckCircle2, Award, Plus, TrendingUp, Users, BookOpen, AlertTriangle, CalendarDays, Trophy");
}

content = content.replace(
  /<TabsTrigger value="faqs">FAQs<\/TabsTrigger>/,
  `<TabsTrigger value="faqs">FAQs</TabsTrigger>\n            <TabsTrigger value="contests">Contests</TabsTrigger>`
);

content = content.replace(
  /grid-cols-6 max-w-4xl/,
  "grid-cols-7 max-w-5xl"
);

const tabContent = `
          {/* Contests tab */}
          <TabsContent value="contests" className="mt-6">
            <AdminContestsTab />
          </TabsContent>
`;
content = content.replace(
  /<\/Tabs>\n      <\/div>/,
  tabContent + "\n        </Tabs>\n      </div>"
);

const adminContestsTabComponent = `
function AdminContestsTab() {
  const queryClient = useQueryClient();
  const { data: contests = [], isLoading } = useQuery({
    queryKey: ["admin-contests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const updateContestMutation = useMutation({
    mutationFn: async (vars: { id: string, updates: any }) => {
      const { error } = await supabase.from("contests").update(vars.updates).eq("id", vars.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contests"] });
      queryClient.invalidateQueries({ queryKey: ["contests"] });
      toast.success("Contest updated successfully!");
      setEditOpen(false);
    },
    onError: (err: any) => toast.error(err.message)
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editingContest, setEditingContest] = useState<any>(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prize, setPrize] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleEditClick = (c: any) => {
    setEditingContest(c);
    setTitle(c.title);
    setDescription(c.description);
    setPrize(c.prize || "");
    setEndDate(c.end_date ? new Date(c.end_date).toISOString().split('T')[0] : "");
    setEditOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContest) return;
    updateContestMutation.mutate({
      id: editingContest.id,
      updates: { title, description, prize, end_date: endDate }
    });
  };

  if (isLoading) return <p className="text-muted-foreground animate-pulse">Loading contests...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif font-semibold">Manage Contests</h2>
      </div>
      
      {contests.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          No contests found.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {contests.map((c: any) => (
            <Card key={c.id} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-serif font-bold text-lg">{c.title}</h3>
                  <Badge variant={c.status === "active" ? "default" : "secondary"}>
                    {c.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{c.description}</p>
                <div className="flex flex-col gap-1 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3"/> Ends: {new Date(c.end_date).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1 text-orange-500 font-medium"><Trophy className="h-3 w-3"/> {c.prize}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEditClick(c)}>
                  Edit
                </Button>
                {c.status === "active" && (
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    className="flex-1"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to end this contest? No more entries will be accepted.")) {
                        updateContestMutation.mutate({ id: c.id, updates: { status: "completed" }});
                      }
                    }}
                  >
                    End Contest
                  </Button>
                )}
                {c.status === "completed" && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      if (window.confirm("Reactivate this contest?")) {
                        updateContestMutation.mutate({ id: c.id, updates: { status: "active" }});
                      }
                    }}
                  >
                    Reactivate
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSaveEdit}>
            <DialogHeader>
              <DialogTitle>Edit Contest</DialogTitle>
              <DialogDescription>Modify contest details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input id="edit-title" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-desc">Description</Label>
                <Textarea id="edit-desc" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-prize">Prize</Label>
                <Input id="edit-prize" value={prize} onChange={e => setPrize(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date">End Date</Label>
                <Input id="edit-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateContestMutation.isPending}>Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
`;

content += "\n" + adminContestsTabComponent;
fs.writeFileSync("src/routes/_authenticated/admin.tsx", content);
console.log("Updated admin.tsx");
