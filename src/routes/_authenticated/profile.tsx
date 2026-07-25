import { createFileRoute, Link } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BookCover } from "@/components/book-cover";
import { Settings2, BookOpen, Check } from "lucide-react";
import { useProfile, useFollowerCount, useFollowingCount } from "@/hooks/use-social";
import { useLibrary } from "@/hooks/use-library";
import { useMyCommunities } from "@/hooks/use-community";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/profile")({ component: Profile });

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
          <DialogDescription>List of users you are connected with.</DialogDescription>
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

function Profile() {
  const { user } = Route.useRouteContext();

  const { data: profile, isLoading: profileLoading } = useProfile(user.id);
  const { data: followerCount = 0 } = useFollowerCount(user.id);
  const { data: followingCount = 0 } = useFollowingCount(user.id);

  const { data: libraryItems = [] } = useLibrary();

  // Follow dialog states
  const [followType, setFollowType] = useState<"followers" | "following">("followers");
  const [followOpen, setFollowOpen] = useState(false);

  // Query author's novels
  const { data: novels = [], isLoading: novelsLoading } = useQuery({
    queryKey: ["profile-novels", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("novels")
        .select("*")
        .eq("author_id", user.id);
      if (error) throw error;
      return data;
    },
  });

  // Query user comments
  const { data: comments = [] } = useQuery({
    queryKey: ["profile-comments", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*, chapter:chapters!chapter_id(title, novel:novels!novel_id(title))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: myCommunities = [] } = useMyCommunities();
  const { data: communityPosts = [] } = useQuery({
    queryKey: ["my-community-posts", user.id],
    queryFn: async () => {
      if (myCommunities.length === 0) return [];
      const commIds = myCommunities.map((c: any) => c.id);
      
      const { data, error } = await supabase
        .from("community_posts")
        .select("*, user:profiles!user_id(display_name, avatar_url), community:communities!community_id(name)")
        .in("community_id", commIds)
        .order("created_at", { ascending: false })
        .limit(20);
        
      if (error) throw error;
      return data;
    },
    enabled: myCommunities.length > 0
  });

  const initials = profile?.display_name?.slice(0, 2).toUpperCase() || user.email?.slice(0, 2).toUpperCase() || "?";

  const handleOpenFollows = (type: "followers" | "following") => {
    setFollowType(type);
    setFollowOpen(true);
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Card className="mb-8 overflow-hidden p-0">
          <div className="h-32 bg-gradient-to-r from-primary/80 via-rose-400 to-amber-400" />
          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-end">
            <Avatar className="-mt-16 h-24 w-24 border-4 border-background shadow-lg">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name} className="object-cover h-full w-full" />
              ) : (
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-3xl font-semibold">{profile?.display_name || "Unknown User"}</h1>
                {profile?.is_verified && (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground" title="Verified Author">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{profile?.bio || "No biography provided yet."}</p>
              <div className="mt-3 flex gap-6 text-sm">
                <button onClick={() => handleOpenFollows("following")} className="hover:underline text-left">
                  <span className="font-semibold">{followingCount}</span> <span className="text-muted-foreground">Following</span>
                </button>
                <button onClick={() => handleOpenFollows("followers")} className="hover:underline text-left">
                  <span className="font-semibold">{followerCount}</span> <span className="text-muted-foreground">Followers</span>
                </button>
                <div><span className="font-semibold">{novels.length}</span> <span className="text-muted-foreground">Novels</span></div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to="/settings">
                <Button variant="outline"><Settings2 className="mr-2 h-4 w-4" />Settings</Button>
              </Link>
            </div>
          </div>
        </Card>

        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <div>
            <Tabs defaultValue="reading">
              <TabsList>
                <TabsTrigger value="reading">Reading List</TabsTrigger>
                <TabsTrigger value="novels">My Novels</TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
                <TabsTrigger value="communities">My Communities</TabsTrigger>
              </TabsList>
              
              <TabsContent value="reading" className="mt-5">
                {libraryItems.length === 0 ? (
                  <Card className="p-6 text-center text-sm text-muted-foreground">
                    Your reading list is empty.
                  </Card>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {libraryItems.map((b, idx) => (
                      <Link key={b.id} to="/read" search={{ novelId: b.novel_id }}>
                        <Card className="flex gap-3 p-4 card-hover h-full">
                          <BookCover title={b.novel?.title || ""} coverUrl={b.novel?.cover_url} coverColor={b.novel?.cover_color} palette={idx} className="w-16 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-serif font-semibold truncate">{b.novel?.title}</h3>
                            <p className="mt-1 text-xs text-muted-foreground">Chapter {b.current_chapter} of {b.progress}%</p>
                            <Progress value={b.progress} className="mt-2 h-1.5" />
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="novels" className="mt-5">
                {novels.length === 0 ? (
                  <Card className="p-6 text-center text-sm text-muted-foreground">
                    You haven't published any novels yet.
                  </Card>
                ) : (
                  <div className="grid gap-6 grid-cols-2 sm:grid-cols-3">
                    {novels.map((b, idx) => (
                      <Link key={b.id} to="/novel/$novelId" params={{ novelId: b.slug }} className="group flex flex-col">
                        <Card className="p-3 card-hover h-full flex flex-col justify-between">
                          <BookCover title={b.title} coverUrl={b.cover_url} coverColor={b.cover_color} palette={idx + 2} className="w-full shadow-sm" />
                          <div className="mt-3 min-w-0">
                            <h3 className="font-serif font-semibold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-1">{b.title}</h3>
                            {b.status === "completed" ? (
                              <Badge className="bg-emerald-500 text-white border-transparent hover:bg-emerald-600 mt-1.5 text-[9px] uppercase tracking-wider h-5">Completed</Badge>
                            ) : b.status === "ongoing" ? (
                              <Badge className="bg-purple-500 text-white border-transparent hover:bg-purple-600 mt-1.5 text-[9px] uppercase tracking-wider h-5">Ongoing</Badge>
                            ) : (
                              <Badge variant="secondary" className="mt-1.5 text-[9px] uppercase tracking-wider h-5">{b.status}</Badge>
                            )}
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="comments" className="mt-5 space-y-3">
                {comments.length === 0 ? (
                  <Card className="p-6 text-center text-sm text-muted-foreground">
                    You haven't commented on any chapters yet.
                  </Card>
                ) : (
                  comments.map((c) => (
                    <Card key={c.id} className="p-4 text-sm">
                      <div className="text-muted-foreground text-xs mb-2">
                        Commented on: <span className="font-semibold text-foreground">{c.chapter?.novel?.title}</span> - {c.chapter?.title}
                      </div>
                      <p>{c.content}</p>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString()}
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="communities" className="mt-5 space-y-4">
                {myCommunities.length === 0 ? (
                  <Card className="p-6 text-center text-sm text-muted-foreground">
                    You haven't joined any communities yet.
                  </Card>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {myCommunities.map((c: any) => (
                        <Link key={c.id} to="/community">
                          <Badge variant="secondary" className="hover:bg-primary/20 transition-colors cursor-pointer">{c.name}</Badge>
                        </Link>
                      ))}
                    </div>
                    
                    <h3 className="font-serif text-lg font-semibold mt-6 mb-3 border-b pb-2">Recent Community Posts</h3>
                    {communityPosts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No recent posts from your communities.</p>
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

          <aside className="space-y-4">
            <Card className="p-5">
              <h3 className="mb-3 text-sm font-semibold">Currently Reading</h3>
              <ul className="space-y-4">
                {libraryItems.slice(0, 3).map((b, idx) => (
                  <li key={b.id} className="flex gap-3">
                    <BookCover title={b.novel?.title || ""} coverUrl={b.novel?.cover_url} coverColor={b.novel?.cover_color} palette={idx} className="w-10 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{b.novel?.title}</div>
                      <div className="text-xs text-muted-foreground">Ch {b.current_chapter}</div>
                      <Progress value={b.progress} className="mt-1.5 h-1" />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-5">
              <h3 className="mb-2 text-sm font-semibold">Badges</h3>
              <div className="flex flex-wrap gap-1.5">
                {profile?.badges && profile.badges.length > 0 ? (
                  profile.badges.map((badge: string, idx: number) => (
                    <Badge key={idx} variant="secondary">{badge}</Badge>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">No custom badges assigned.</p>
                )}
                {novels.length > 0 && <Badge variant="outline">Author</Badge>}
              </div>
            </Card>
          </aside>
        </div>
      </div>

      <FollowListDialog
        userId={user.id}
        type={followType}
        open={followOpen}
        onOpenChange={setFollowOpen}
      />
    </div>
  );
}

