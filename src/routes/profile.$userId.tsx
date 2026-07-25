import { createFileRoute, Link } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BookCover } from "@/components/book-cover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MessageSquare, UserPlus, UserMinus, Check, AlertTriangle, Loader2 } from "lucide-react";
import { useProfile, useFollowerCount, useFollowingCount, useToggleFollow, useIsFollowing } from "@/hooks/use-social";
import { useSession } from "@/hooks/use-session";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { ChatDialog } from "@/components/chat-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateReport } from "@/hooks/use-reports";

export const Route = createFileRoute("/profile/$userId")({
  component: PublicProfile,
});

interface FollowListDialogProps {
  userId: string;
  type: "followers" | "following";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function FollowListDialog({ userId, type, open, onOpenChange }: FollowListDialogProps) {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["follow-list-details", userId, type],
    queryFn: async () => {
      if (type === "followers") {
        const { data, error } = await supabase
          .from("follows")
          .select("*, follower:profiles!follower_id(id, display_name, avatar_url, role)")
          .eq("following_id", userId);
        if (error) throw error;
        return data.map(d => d.follower);
      } else {
        const { data, error } = await supabase
          .from("follows")
          .select("*, following:profiles!following_id(id, display_name, avatar_url, role)")
          .eq("follower_id", userId);
        if (error) throw error;
        return data.map(d => d.following);
      }
    },
    enabled: open && !!userId,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif capitalize">{type}</DialogTitle>
          <DialogDescription>List of users connected to this profile.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {isLoading ? (
            <p className="text-center text-xs text-muted-foreground animate-pulse">Loading list...</p>
          ) : users.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground italic">No users found.</p>
          ) : (
            users.map((u: any) => {
              if (!u) return null;
              return (
                <Link
                  key={u.id}
                  to="/profile/$userId"
                  params={{ userId: u.id }}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Avatar className="h-9 w-9">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt={u.display_name} className="object-cover h-full w-full" />
                    ) : (
                      <AvatarFallback>{u.display_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                    )}
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate">{u.display_name}</div>
                    <Badge variant="outline" className="text-[9px] uppercase tracking-wider h-4 mt-0.5">{u.role}</Badge>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PublicProfile() {
  const { userId } = Route.useParams();
  const { user } = useSession();

  const [chatOpen, setChatOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const createReportMutation = useCreateReport();

  // Follow dialog states
  const [followType, setFollowType] = useState<"followers" | "following">("followers");
  const [followOpen, setFollowOpen] = useState(false);

  const { data: profile, isLoading: profileLoading } = useProfile(userId);
  const { data: followerCount = 0 } = useFollowerCount(userId);
  const { data: followingCount = 0 } = useFollowingCount(userId);
  const { data: isFollowing = false } = useIsFollowing(userId);

  const toggleFollow = useToggleFollow();

  // Query author's approved novels
  const { data: novels = [], isLoading: novelsLoading } = useQuery({
    queryKey: ["profile-novels-public", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("novels")
        .select("*")
        .eq("author_id", userId)
        .eq("approval_status", "approved");
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Query collab novels
  const { data: collabNovels = [], isLoading: collabLoading } = useQuery({
    queryKey: ["profile-collab-novels-public", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collaborations")
        .select("novel:novels(*)")
        .eq("user_id", userId)
        .eq("status", "accepted")
        .eq("novels.approval_status", "approved");
      if (error) throw error;
      return data.map((d: any) => d.novel).filter(Boolean);
    },
    enabled: !!userId,
  });

  const allNovels = [...novels, ...collabNovels].filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);

  // Query user's communities
  const { data: userCommunities = [] } = useQuery({
    queryKey: ["user-communities", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_members")
        .select("community_id, communities(*)")
        .eq("user_id", userId);
      
      if (error) throw error;
      return data.map((d: any) => d.communities).filter(Boolean);
    },
    enabled: !!userId,
  });

  const { data: communityPosts = [] } = useQuery({
    queryKey: ["user-community-posts", userId],
    queryFn: async () => {
      if (userCommunities.length === 0) return [];
      const commIds = userCommunities.map((c: any) => c.id);
      
      const { data, error } = await supabase
        .from("community_posts")
        .select("*, user:profiles!user_id(display_name, avatar_url), community:communities!community_id(name)")
        .in("community_id", commIds)
        .order("created_at", { ascending: false })
        .limit(20);
        
      if (error) throw error;
      return data;
    },
    enabled: userCommunities.length > 0
  });

  if (profileLoading) {
    return (
      <div className="min-h-screen">
        <TopNav />
        <div className="mx-auto max-w-7xl px-4 py-20 text-center animate-pulse">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen">
        <TopNav />
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">User profile not found.</p>
        </div>
      </div>
    );
  }

  const initials = profile.display_name?.slice(0, 2).toUpperCase() || "?";
  const isMe = user?.id === userId;

  const handleOpenFollows = (type: "followers" | "following") => {
    setFollowType(type);
    setFollowOpen(true);
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    createReportMutation.mutate(
      { reportedId: userId, reason: reportReason.trim() },
      {
        onSuccess: () => {
          setReportOpen(false);
          setReportReason("");
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Profile header card */}
        <Card className="mb-8 overflow-hidden p-0">
          <div className="h-32 bg-gradient-to-r from-primary/80 via-indigo-400 to-cyan-400" />
          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-end">
            <Avatar className="-mt-16 h-24 w-24 border-4 border-background shadow-lg">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name} className="object-cover h-full w-full" />
              ) : (
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2.5">
                <h1 className="font-serif text-3xl font-semibold">{profile.display_name}</h1>
                {profile.is_verified && (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground" title="Verified Author">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                )}
                <Badge className="capitalize font-medium">{profile.role}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{profile.bio || "No bio available."}</p>
              
              {/* GAMIFICATION STATS */}
              <div className="mt-4 flex flex-wrap gap-4 rounded-lg bg-muted/50 p-3 shadow-inner border max-w-fit">
                <div className="flex flex-col">
                  <span className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">XP</span>
                  <span className="text-lg font-bold text-primary leading-tight">{profile.xp || 0}</span>
                </div>
                <div className="w-px bg-border my-1" />
                <div className="flex flex-col">
                  <span className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Current Streak</span>
                  <span className="text-lg font-bold text-orange-500 leading-tight flex items-center gap-1">
                    🔥 {profile.current_streak || 0}
                  </span>
                </div>
                <div className="w-px bg-border my-1" />
                <div className="flex flex-col">
                  <span className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Longest Streak</span>
                  <span className="text-lg font-bold text-muted-foreground leading-tight">{profile.longest_streak || 0}</span>
                </div>
              </div>

              <div className="mt-4 flex gap-6 text-sm">
                <button onClick={() => handleOpenFollows("following")} className="hover:underline text-left">
                  <span className="font-semibold">{followingCount}</span> <span className="text-muted-foreground">Following</span>
                </button>
                <button onClick={() => handleOpenFollows("followers")} className="hover:underline text-left">
                  <span className="font-semibold">{followerCount}</span> <span className="text-muted-foreground">Followers</span>
                </button>
                <div><span className="font-semibold">{allNovels.length}</span> <span className="text-muted-foreground">Novels</span></div>
              </div>
              {profile.badges && profile.badges.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {profile.badges.map((badge: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-[10px] py-0.5 px-2">{badge}</Badge>
                  ))}
                </div>
              )}
            </div>
            {user && !isMe && (
              <div className="flex gap-2">
                <Button
                  variant={isFollowing ? "secondary" : "default"}
                  onClick={() => toggleFollow.mutate({ followerId: user.id, followingId: userId })}
                  disabled={toggleFollow.isPending}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="mr-2 h-4 w-4" /> Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" /> Follow
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setChatOpen(true)}>
                  <MessageSquare className="mr-2 h-4 w-4" /> Message
                </Button>
                <Button variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => setReportOpen(true)}>
                  <AlertTriangle className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Content */}
        <div className="space-y-6">
          <Tabs defaultValue="novels" className="space-y-6">
            <TabsList>
              <TabsTrigger value="novels">Published Novels</TabsTrigger>
              <TabsTrigger value="communities">Communities</TabsTrigger>
            </TabsList>
            
            <TabsContent value="novels">
              {(novelsLoading || collabLoading) ? (
                <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 animate-pulse">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="aspect-[2/3] bg-muted rounded-md" />
                  ))}
                </div>
              ) : allNovels.length === 0 ? (
                <Card className="p-10 text-center text-sm text-muted-foreground">
                  No public novels found for this profile yet.
                </Card>
              ) : (
                <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                  {allNovels.map((n: any, idx: number) => (
                    <Link key={n.id} to="/novel/$novelId" params={{ novelId: n.slug }} className="group flex flex-col">
                      <Card className="p-3 card-hover h-full flex flex-col justify-between">
                        <BookCover title={n.title} coverUrl={n.cover_url} palette={idx + 2} className="w-full shadow-sm" />
                        <div className="mt-3 min-w-0">
                          <h3 className="font-serif font-semibold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-1">{n.title}</h3>
                          {n.status === "completed" ? (
                            <Badge className="bg-emerald-500 text-white border-transparent hover:bg-emerald-600 mt-1.5 text-[9px] uppercase tracking-wider h-5">Completed</Badge>
                          ) : n.status === "ongoing" ? (
                            <Badge className="bg-purple-500 text-white border-transparent hover:bg-purple-600 mt-1.5 text-[9px] uppercase tracking-wider h-5">Ongoing</Badge>
                          ) : (
                            <Badge variant="outline" className="mt-1.5 text-[9px] uppercase tracking-wider h-5">{n.status}</Badge>
                          )}
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="communities" className="space-y-4">
              {userCommunities.length === 0 ? (
                <Card className="p-6 text-center text-sm text-muted-foreground">
                  This user hasn't joined any communities yet.
                </Card>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {userCommunities.map((c: any) => (
                      <Link key={c.id} to="/community">
                        <Badge variant="secondary" className="hover:bg-primary/20 transition-colors cursor-pointer">{c.name}</Badge>
                      </Link>
                    ))}
                  </div>
                  
                  <h3 className="font-serif text-lg font-semibold mt-6 mb-3 border-b pb-2">Recent Community Posts</h3>
                  {communityPosts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recent posts from their communities.</p>
                  ) : (
                    communityPosts.map((p: any) => (
                      <Card key={p.id} className="p-4 flex gap-3 items-start">
                        <Avatar className="h-8 w-8 shrink-0">
                          {p.user?.avatar_url ? (
                            <img src={p.user.avatar_url} alt={p.user.display_name} className="object-cover h-full w-full" />
                          ) : (
                            <AvatarFallback className="text-[10px]">{p.user?.display_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                          )}
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-semibold">{p.user?.display_name || "Anonymous"}</span>
                            <span className="text-[10px] text-muted-foreground">in <Link to="/community" className="font-medium hover:underline">{p.community?.name}</Link></span>
                            <span className="text-[10px] text-muted-foreground ml-auto">{new Date(p.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm mt-1 leading-relaxed text-foreground/90">{p.content}</p>
                        </div>
                      </Card>
                    ))
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <ChatDialog
        otherUserId={profile.id}
        otherUserName={profile.display_name}
        otherUserAvatar={profile.avatar_url}
        open={chatOpen}
        onOpenChange={setChatOpen}
      />

      <FollowListDialog
        userId={userId}
        type={followType}
        open={followOpen}
        onOpenChange={setFollowOpen}
      />

      {/* Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Report User</DialogTitle>
            <DialogDescription>
              If you believe this user is violating the rules, please provide a detailed reason below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReportSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="report-reason">Reason for reporting</Label>
              <Textarea 
                id="report-reason" 
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="e.g. Inappropriate behavior, spam, plagiarism..." 
                className="min-h-[100px]"
                required 
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setReportOpen(false)}>Cancel</Button>
              <Button type="submit" variant="destructive" disabled={createReportMutation.isPending}>
                {createReportMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit Report
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
