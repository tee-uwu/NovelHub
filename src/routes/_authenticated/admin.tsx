import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShieldAlert, Check, X, Star, Trash2, Ban, ShieldCheck, Loader2, CheckCircle2, Award, Plus, TrendingUp, Users, BookOpen, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-social";
import { useReports, useUpdateReportStatus } from "@/hooks/use-reports";
import { useFaqs, useCreateFaq, useUpdateFaq, useDeleteFaq } from "@/hooks/use-faqs";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPanel,
});

interface BadgesDialogProps {
  userProfile: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function BadgesDialog({ userProfile, open, onOpenChange }: BadgesDialogProps) {
  const queryClient = useQueryClient();
  const [newBadge, setNewBadge] = useState("");
  const [badges, setBadges] = useState<string[]>([]);

  // Sync badges when user changes
  useState(() => {
    if (userProfile) {
      setBadges(userProfile.badges || []);
    }
  });

  // Re-sync badges on mount/update
  const activeBadges = userProfile ? userProfile.badges || [] : [];

  const updateBadgesMutation = useMutation({
    mutationFn: async (updatedList: string[]) => {
      const { error } = await supabase
        .from("profiles")
        .update({ badges: updatedList })
        .eq("id", userProfile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast.success("User badges updated successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update badges");
    }
  });

  const handleAddBadge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBadge.trim()) return;
    const updated = [...activeBadges, newBadge.trim()];
    updateBadgesMutation.mutate(updated);
    setNewBadge("");
  };

  const handleRemoveBadge = (idx: number) => {
    const updated = activeBadges.filter((_: any, i: number) => i !== idx);
    updateBadgesMutation.mutate(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Manage User Badges</DialogTitle>
          <DialogDescription>Modify badges for <strong>{userProfile?.display_name}</strong></DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current badges list */}
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Current Badges</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {activeBadges.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No custom badges assigned.</p>
              ) : (
                activeBadges.map((badge: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="flex items-center gap-1.5 px-2.5 py-1">
                    {badge}
                    <button
                      type="button"
                      onClick={() => handleRemoveBadge(idx)}
                      className="text-muted-foreground hover:text-destructive rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>

          <Separator />

          {/* Add badge form */}
          <form onSubmit={handleAddBadge} className="flex gap-2">
            <Input
              value={newBadge}
              onChange={(e) => setNewBadge(e.target.value)}
              placeholder="e.g. Verified Author, Top Reviewer..."
              required
            />
            <Button type="submit" size="sm" className="flex items-center gap-1">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Separator() {
  return <div className="h-px bg-border my-2" />;
}

function AdminPanel() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [searchNovel, setSearchNovel] = useState("");
  const [searchUser, setSearchUser] = useState("");

  // Badges edit state
  const [badgesOpen, setBadgesOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const { data: profile, isLoading: profileLoading } = useProfile(user.id);
  const { data: reports = [], isLoading: reportsLoading } = useReports();
  const updateReportStatus = useUpdateReportStatus();

  // 1. Query pending approval novels
  const { data: pendingNovels = [], isLoading: pendingLoading } = useQuery({
    queryKey: ["admin-pending-novels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("novels")
        .select("*, author:profiles!author_id(display_name)")
        .eq("approval_status", "pending")
        .neq("status", "draft")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: profile?.role === "admin",
  });

  // 2. Query all approved novels
  const { data: approvedNovels = [], isLoading: approvedLoading } = useQuery({
    queryKey: ["admin-approved-novels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("novels")
        .select("*, author:profiles!author_id(display_name)")
        .eq("approval_status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: profile?.role === "admin",
  });

  // 2b. Query pending chapters
  const { data: pendingChapters = [], isLoading: pendingChaptersLoading } = useQuery({
    queryKey: ["admin-pending-chapters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapters")
        .select("*, novel:novels!novel_id(title, author:profiles!author_id(display_name))")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: profile?.role === "admin",
  });

  // 3. Query all users profiles
  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: profile?.role === "admin",
  });

  // Approvals mutations
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("novels").update({ approval_status: "approved" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-novels"] });
      queryClient.invalidateQueries({ queryKey: ["admin-approved-novels"] });
      queryClient.invalidateQueries({ queryKey: ["novels"] });
      toast.success("Novel approved and published!");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("novels").update({ approval_status: "rejected" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-novels"] });
      toast.success("Novel rejected.");
    },
  });

  // Chapter approval mutations
  const approveChapterMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chapters").update({ status: "published" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-chapters"] });
      queryClient.invalidateQueries({ queryKey: ["chapters"] });
      toast.success("Chapter approved and published!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to approve chapter");
    }
  });

  const rejectChapterMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chapters").update({ status: "rejected" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-chapters"] });
      queryClient.invalidateQueries({ queryKey: ["chapters"] });
      toast.success("Chapter rejected");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to reject chapter");
    }
  });

  // Editor choice toggle
  const toggleChoiceMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: boolean }) => {
      const { error } = await supabase.from("novels").update({ is_editors_choice: status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-approved-novels"] });
      queryClient.invalidateQueries({ queryKey: ["novels"] });
      toast.success("Editors Choice status updated!");
    },
  });

  // Delete novel
  const deleteNovelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("novels").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-novels"] });
      queryClient.invalidateQueries({ queryKey: ["admin-approved-novels"] });
      queryClient.invalidateQueries({ queryKey: ["novels"] });
      toast.success("Novel permanently deleted.");
    },
  });

  // Ban toggle user
  const toggleBanMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: boolean }) => {
      const { error } = await supabase.from("profiles").update({ is_banned: status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast.success("User ban status updated!");
    },
  });

  // Verify toggle user
  const toggleVerifyMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: boolean }) => {
      const { error } = await supabase.from("profiles").update({ is_verified: status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast.success("User verification status updated!");
    },
  });

  const handleEditBadgesClick = (p: any) => {
    setSelectedUser(p);
    setBadgesOpen(true);
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen">
        <TopNav />
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Access check
  if (profile?.role !== "admin") {
    return (
      <div className="min-h-screen">
        <TopNav />
        <div className="mx-auto max-w-md text-center py-20 px-4">
          <ShieldAlert className="h-14 w-14 text-destructive mx-auto mb-4" />
          <h1 className="font-serif text-2xl font-semibold">Access Denied</h1>
          <p className="text-sm text-muted-foreground mt-2">Only system administrators can access the moderation suite.</p>
          <Button onClick={() => navigate({ to: "/" })} className="mt-6">Go Home</Button>
        </div>
      </div>
    );
  }

  const filteredApproved = approvedNovels.filter(n => n.title.toLowerCase().includes(searchNovel.toLowerCase()));
  const filteredUsers = profiles.filter(p => (p.display_name || "").toLowerCase().includes(searchUser.toLowerCase()) || p.id.includes(searchUser));

  const allPending = useMemo(() => {
    const items = [
      ...pendingNovels.map((n: any) => ({ ...n, type: 'novel' as const })),
      ...pendingChapters.map((c: any) => ({ ...c, type: 'chapter' as const }))
    ];
    return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [pendingNovels, pendingChapters]);

  const chartData = useMemo(() => {
    if (!profiles || profiles.length === 0) return [];
    
    const grouped = profiles.reduce((acc: Record<string, number>, profile: any) => {
      const date = new Date(profile.created_at);
      const monthYear = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!acc[monthYear]) acc[monthYear] = 0;
      acc[monthYear]++;
      return acc;
    }, {});

    const data = Object.keys(grouped).map(key => {
      const [month, year] = key.split(" ");
      const d = new Date(`${month} 1, 20${year}`);
      return { name: key, users: grouped[key], timestamp: d.getTime() };
    }).sort((a, b) => a.timestamp - b.timestamp);
    
    let cumulative = 0;
    const finalData = data.map(d => {
      cumulative += d.users;
      return { name: d.name, users: cumulative };
    });

    // If there's only one data point, add a dummy previous month so the chart doesn't look empty
    if (finalData.length === 1) {
      const [month, year] = finalData[0].name.split(" ");
      const d = new Date(`${month} 1, 20${year}`);
      d.setMonth(d.getMonth() - 1);
      const prevMonthYear = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      return [{ name: prevMonthYear, users: 0 }, ...finalData];
    }
    
    return finalData;
  }, [profiles]);

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <header className="mb-8 flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="font-serif text-4xl font-semibold tracking-tight">Admin Moderation Suite</h1>
            <p className="text-sm text-muted-foreground">Approve new content, ban toxic users, and manage badges and verification.</p>
          </div>
        </header>

        <Tabs defaultValue="dashboard">
          <TabsList className="grid w-full grid-cols-6 max-w-4xl">
            <TabsTrigger value="dashboard">Trends</TabsTrigger>
            <TabsTrigger value="approvals">Approvals ({pendingNovels.length + pendingChapters.length})</TabsTrigger>
            <TabsTrigger value="novels">All Novels</TabsTrigger>
            <TabsTrigger value="users">Manage Users</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="faqs">FAQs</TabsTrigger>
          </TabsList>

          {/* Dashboard & Trends tab */}
          <TabsContent value="dashboard" className="mt-6 space-y-6">
            <h2 className="text-xl font-serif font-semibold">Platform Overview</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Users</p>
                  <p className="text-2xl font-serif font-bold">{profiles.length}</p>
                  <p className="text-xs text-emerald-500 font-medium">+12% this month</p>
                </div>
                <div className="rounded-full bg-primary/10 p-3 text-primary"><Users className="h-5 w-5" /></div>
              </Card>
              <Card className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Novels</p>
                  <p className="text-2xl font-serif font-bold">{approvedNovels.length}</p>
                  <p className="text-xs text-emerald-500 font-medium">+5% this month</p>
                </div>
                <div className="rounded-full bg-primary/10 p-3 text-primary"><BookOpen className="h-5 w-5" /></div>
              </Card>
              <Card className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending Approvals</p>
                  <p className="text-2xl font-serif font-bold">{pendingNovels.length}</p>
                  <p className="text-xs text-muted-foreground">Needs review</p>
                </div>
                <div className="rounded-full bg-amber-500/10 p-3 text-amber-500"><CheckCircle2 className="h-5 w-5" /></div>
              </Card>
            </div>
            
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> User Growth Trends</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>

          {/* Approvals tab */}
          <TabsContent value="approvals" className="mt-6 space-y-8">
            <div>
              <h2 className="text-xl font-serif font-semibold mb-4">Pending Approvals Queue</h2>
              {pendingLoading || pendingChaptersLoading ? (
                <p className="text-muted-foreground animate-pulse">Loading queue...</p>
              ) : allPending.length === 0 ? (
                <Card className="p-6 text-center text-sm text-muted-foreground">
                  No pending items in the approval queue. Excellent!
                </Card>
              ) : (
                <div className="space-y-4">
                  {allPending.map((item) => (
                    <Card key={`${item.type}-${item.id}`} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      {item.type === 'novel' ? (
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-serif text-lg font-semibold truncate">{item.title}</h3>
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">New Novel</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">by {item.author?.display_name} · Genre: {item.genre}</p>
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{item.synopsis}</p>
                        </div>
                      ) : (
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-serif text-lg font-semibold truncate">{item.novel?.title}</h3>
                            <Badge variant="outline">Chapter {item.chapter_number}</Badge>
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">New Chapter</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">by {item.novel?.author?.display_name}</p>
                        </div>
                      )}
                      
                      <div className="flex gap-2 shrink-0">
                        {item.type === 'novel' ? (
                          <>
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                              onClick={() => approveMutation.mutate(item.id)}
                              disabled={approveMutation.isPending}
                            >
                              <Check className="h-4 w-4" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex items-center gap-1"
                              onClick={() => rejectMutation.mutate(item.id)}
                              disabled={rejectMutation.isPending}
                            >
                              <X className="h-4 w-4" /> Reject
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                              onClick={() => approveChapterMutation.mutate(item.id)}
                              disabled={approveChapterMutation.isPending}
                            >
                              <Check className="h-4 w-4" /> Publish
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex items-center gap-1"
                              onClick={() => rejectChapterMutation.mutate(item.id)}
                              disabled={rejectChapterMutation.isPending}
                            >
                              <X className="h-4 w-4" /> Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* All Novels tab */}
          <TabsContent value="novels" className="mt-6">
            <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
              <h2 className="text-xl font-serif font-semibold">Approved Novels Directory</h2>
              <Input
                placeholder="Search approved novels..."
                value={searchNovel}
                onChange={(e) => setSearchNovel(e.target.value)}
                className="max-w-xs"
              />
            </div>

            {approvedLoading ? (
              <p className="text-muted-foreground animate-pulse">Loading novels...</p>
            ) : filteredApproved.length === 0 ? (
              <p className="text-sm text-muted-foreground">No approved novels found.</p>
            ) : (
              <div className="space-y-3">
                {filteredApproved.map((n) => (
                  <Card key={n.id} className="p-4 flex items-center justify-between gap-4 text-sm flex-wrap sm:flex-nowrap">
                    <div>
                      <div className="font-serif font-semibold text-base flex items-center gap-2">
                        {n.title}
                        {n.is_editors_choice && <Badge className="bg-primary/20 text-primary border-primary/30">Editors Choice</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">by {n.author?.display_name} · {n.view_count} views</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 px-3 flex items-center gap-1"
                        onClick={() => toggleChoiceMutation.mutate({ id: n.id, status: !n.is_editors_choice })}
                      >
                        <Star className={`h-4 w-4 ${n.is_editors_choice ? "fill-primary text-primary" : ""}`} /> choice
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-9 px-3 flex items-center gap-1"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to permanently delete "${n.title}"?`)) {
                            deleteNovelMutation.mutate(n.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* User directory tab */}
          <TabsContent value="users" className="mt-6">
            <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
              <h2 className="text-xl font-serif font-semibold">User Directory</h2>
              <Input
                placeholder="Search users..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="max-w-xs"
              />
            </div>

            {profilesLoading ? (
              <p className="text-muted-foreground animate-pulse">Loading directory...</p>
            ) : filteredUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users found.</p>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((p) => (
                  <Card key={p.id} className="p-4 flex items-center justify-between gap-4 text-sm flex-wrap sm:flex-nowrap">
                    <div>
                      <div className="font-semibold text-base flex items-center gap-2">
                        {p.display_name}
                        {p.is_verified && (
                          <span className="inline-flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-primary-foreground" title="Verified Author">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </span>
                        )}
                        <Badge className="capitalize">{p.role}</Badge>
                        {p.is_banned && <Badge variant="destructive">Banned</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono truncate max-w-xs sm:max-w-md">{p.id}</div>
                      {p.badges && p.badges.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {p.badges.map((badge: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-[10px] py-0 px-1.5">{badge}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={p.is_verified ? "secondary" : "outline"}
                        className="h-9 px-3 flex items-center gap-1"
                        onClick={() => toggleVerifyMutation.mutate({ id: p.id, status: !p.is_verified })}
                      >
                        <CheckCircle2 className={`h-4 w-4 ${p.is_verified ? "text-primary fill-primary/10" : ""}`} />
                        {p.is_verified ? "Unverify" : "Verify"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 px-3 flex items-center gap-1"
                        onClick={() => handleEditBadgesClick(p)}
                      >
                        <Award className="h-4 w-4" /> Badges
                      </Button>
                      <Button
                        size="sm"
                        variant={p.is_banned ? "outline" : "destructive"}
                        className="h-9 px-3 flex items-center gap-1"
                        disabled={p.role === "admin"} // Cannot ban admins
                        onClick={() => toggleBanMutation.mutate({ id: p.id, status: !p.is_banned })}
                      >
                        <Ban className="h-4 w-4" /> {p.is_banned ? "Unban" : "Ban"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Reports tab */}
          <TabsContent value="reports" className="mt-6">
            <h2 className="text-xl font-serif font-semibold mb-4">User Reports & Complaints</h2>
            {reportsLoading ? (
              <p className="text-muted-foreground animate-pulse">Loading reports...</p>
            ) : reports.length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">
                No reports found. The community is peaceful!
              </Card>
            ) : (
              <div className="space-y-4">
                {reports.map((r: any) => (
                  <Card key={r.id} className="p-5 flex flex-col lg:flex-row justify-between gap-4">
                    <div className="flex-1 space-y-2 min-w-0 max-w-full">
                      <div className="flex items-center gap-2 flex-wrap">
                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                        <span className="font-semibold text-sm truncate max-w-[200px] sm:max-w-xs">Reported User: {r.reported?.display_name || 'Unknown'}</span>
                        <Badge variant="outline" className="text-[10px] uppercase shrink-0">{r.status}</Badge>
                      </div>
                      <p className="text-sm bg-muted/50 p-3 rounded-md italic whitespace-pre-wrap break-words">"{r.reason}"</p>
                      <div className="text-xs text-muted-foreground truncate max-w-full">
                        Reported by {r.reporter?.display_name || 'Unknown'} on {new Date(r.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {r.status === "pending" && (
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateReportStatus.mutate({ reportId: r.id, status: 'dismissed' })}
                        >
                          Dismiss Report
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => {
                            updateReportStatus.mutate({ reportId: r.id, status: 'resolved' });
                            toggleBanMutation.mutate({ id: r.reported_id, status: true });
                          }}
                        >
                          Ban User & Resolve
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* FAQs tab */}
          <TabsContent value="faqs" className="mt-6">
            <FaqManagementTab />
          </TabsContent>
        </Tabs>
      </div>

      <BadgesDialog
        userProfile={selectedUser}
        open={badgesOpen}
        onOpenChange={setBadgesOpen}
      />
    </div>
  );
}

function FaqManagementTab() {
  const { data: faqs = [], isLoading } = useFaqs();
  const createFaq = useCreateFaq();
  const updateFaq = useUpdateFaq();
  const deleteFaq = useDeleteFaq();
  
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);
  
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;
    createFaq.mutate({ question, answer, order_index: orderIndex }, {
      onSuccess: () => {
        setQuestion("");
        setAnswer("");
        setOrderIndex(0);
      }
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !question.trim() || !answer.trim()) return;
    updateFaq.mutate({ id: editingId, question, answer, order_index: orderIndex }, {
      onSuccess: () => {
        setEditingId(null);
        setQuestion("");
        setAnswer("");
        setOrderIndex(0);
      }
    });
  };

  const handleEditClick = (faq: any) => {
    setEditingId(faq.id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setOrderIndex(faq.order_index);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setQuestion("");
    setAnswer("");
    setOrderIndex(0);
  };

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <h2 className="text-xl font-serif font-semibold mb-4">
          {editingId ? "Edit FAQ" : "Add New FAQ"}
        </h2>
        <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
          <div>
            <Label htmlFor="faq-question">Question</Label>
            <Input 
              id="faq-question" 
              value={question} 
              onChange={(e) => setQuestion(e.target.value)} 
              required 
              placeholder="e.g., How do I reset my password?" 
            />
          </div>
          <div>
            <Label htmlFor="faq-answer">Answer (Markdown Supported)</Label>
            <Textarea 
              id="faq-answer" 
              value={answer} 
              onChange={(e) => setAnswer(e.target.value)} 
              required 
              className="min-h-[120px]"
              placeholder="Provide a detailed step-by-step answer here..." 
            />
          </div>
          <div>
            <Label htmlFor="faq-order">Display Order (Lower numbers appear first)</Label>
            <Input 
              id="faq-order" 
              type="number" 
              value={orderIndex} 
              onChange={(e) => setOrderIndex(parseInt(e.target.value) || 0)} 
              required 
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={createFaq.isPending || updateFaq.isPending}>
              {editingId ? "Update FAQ" : "Add FAQ"}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-serif font-semibold">Existing FAQs</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading FAQs...</p>
        ) : faqs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No FAQs found.</p>
        ) : (
          <div className="grid gap-4">
            {faqs.map((faq) => (
              <Card key={faq.id} className="p-4 flex flex-col gap-2 relative group">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="outline" onClick={() => handleEditClick(faq)}>Edit</Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this FAQ?")) {
                        deleteFaq.mutate(faq.id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
                <div className="pr-20">
                  <Badge variant="secondary" className="mb-2 text-xs">Order: {faq.order_index}</Badge>
                  <h3 className="font-semibold text-lg">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-3">{faq.answer}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
