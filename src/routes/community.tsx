import { createFileRoute, Link } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageCircle, Share2, TrendingUp, Users, Circle, Check, Plus, Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCommunities, useCommunityPosts, useIsMember, useToggleMembership, useCreatePost, useDeletePost, useMyCommunities, useDeleteCommunity } from "@/hooks/use-community";
import { useSession } from "@/hooks/use-session";
import { CreateCommunityDialog } from "@/components/create-community-dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community | NovelHub" },
      { name: "description", content: "Join the NovelHub community. Discuss novels, share ideas, and connect with other readers and authors." },
      { property: "og:title", content: "Community | NovelHub" },
      { property: "og:description", content: "Join the NovelHub community. Discuss novels, share ideas, and connect with other readers and authors." },
    ],
  }), component: Community });

const tags = ["Trending", "Fantasy", "Mystery", "Romance", "Action", "Isekai"];

function Community() {
  const { t } = useTranslation();
  const { user } = useSession();
  const [selectedTag, setSelectedTag] = useState("Trending");
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { data: communities = [], isLoading: commsLoading } = useCommunities();
  const { data: myCommunities = [] } = useMyCommunities();
  const [activeCommId, setActiveCommId] = useState<string | null>(null);

  // Fallback to first community if none selected
  const activeCommunity = communities.find((c) => c.id === activeCommId) || communities[0];
  const activeId = activeCommunity?.id;

  const { data: posts = [], isLoading: postsLoading } = useCommunityPosts(activeId);
  const { data: isMember = false } = useIsMember(activeId);

  const toggleMembership = useToggleMembership();
  const createPost = useCreatePost();
  const deletePostMutation = useDeletePost();
  const deleteCommunity = useDeleteCommunity();

  const [postContent, setPostContent] = useState("");
  const [replyingPostId, setReplyingPostId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Please sign in to post");
    if (!activeId) return;
    if (!postContent.trim()) return;

    createPost.mutate(
      {
        community_id: activeId,
        user_id: user.id,
        content: postContent.trim(),
      },
      {
        onSuccess: () => {
          setPostContent("");
        },
      }
    );
  };

  // Filter communities by tags and search
  let filteredComms = selectedTag === "Trending"
    ? communities
    : communities.filter((c) => c.tags?.includes(selectedTag));

  if (searchQuery.trim()) {
    filteredComms = filteredComms.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <header className="mb-8 space-y-5">
          <div>
            <h1 className="font-serif text-4xl font-semibold tracking-tight">{t("community.pageTitle")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("community.pageSubtitle")}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("community.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {user && (
              <CreateCommunityDialog open={createOpen} onOpenChange={setCreateOpen} />
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <Badge
                key={t}
                variant={selectedTag === t ? "default" : "outline"}
                className="cursor-pointer px-3 py-1"
                onClick={() => setSelectedTag(t)}
              >
                {t}
              </Badge>
            ))}
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("community.popular")}</h2>
              {commsLoading ? (
                <p className="text-muted-foreground animate-pulse">{t("community.loading")}</p>
              ) : filteredComms.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("community.noCommunities")}</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {filteredComms.map((c) => {
                    const memberCount = (c as any).community_members?.[0]?.count ?? 0;
                    const isActive = c.id === activeId;
                    const isJoined = myCommunities.some((mc: any) => mc.id === c.id);

                    return (
                      <Card
                        key={c.id}
                        onClick={() => setActiveCommId(c.id)}
                        className={`p-5 cursor-pointer border-2 transition-all ${
                          isActive ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-serif text-lg font-semibold">{c.name}</h3>
                            <p className="text-xs text-muted-foreground">{memberCount} {t("community.members")}</p>
                          </div>
                          {user && (
                            <Button
                              size="sm"
                              variant={isJoined ? "secondary" : "outline"}
                              className={isJoined ? "bg-primary/10 text-primary hover:bg-destructive hover:text-destructive-foreground group" : ""}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMembership.mutate({ communityId: c.id });
                              }}
                            >
                              {isJoined ? (
                                <>
                                  <Check className="mr-1 h-3 w-3 group-hover:hidden" />
                                  <span className="group-hover:hidden">{t("community.joined")}</span>
                                  <span className="hidden group-hover:inline">{t("community.leave")}</span>
                                </>
                              ) : (
                                "Join"
                              )}
                            </Button>
                          )}
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                        <div className="mt-3 flex flex-wrap gap-1">
                          {c.tags?.map((t: string) => (
                            <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                          ))}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>

            {activeCommunity && (
              <section className="animate-fade-in">
                <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <h2 className="font-serif text-2xl font-semibold">{activeCommunity.name}</h2>
                    <Badge variant="secondary">{t("community.activeChannel")}</Badge>
                  </div>
                  {(user?.id === activeCommunity.created_by || (user as any)?.role === "admin") && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        if (window.confirm(t("community.deleteConfirm"))) {
                          deleteCommunity.mutate(activeCommunity.id, {
                            onSuccess: () => setActiveCommId(null)
                          });
                        }
                      }}
                      disabled={deleteCommunity.isPending}
                    >
                      Delete Community
                    </Button>
                  )}
                </div>

                {user && isMember ? (
                  <Card className="mb-6 p-4">
                    <form onSubmit={handlePostSubmit} className="flex gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {user.email?.slice(0, 2).toUpperCase() || "ME"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Textarea
                          value={postContent}
                          onChange={(e) => setPostContent(e.target.value)}
                          placeholder={`Share something with the ${activeCommunity.name} community…`}
                          className="min-h-[70px] resize-none border-0 p-0 shadow-none focus-visible:ring-0"
                        />
                        <div className="mt-3 flex justify-end">
                          <Button size="sm" type="submit" disabled={createPost.isPending}>
                            {createPost.isPending ? "Posting…" : "Post"}
                          </Button>
                        </div>
                      </div>
                    </form>
                  </Card>
                ) : user && !isMember ? (
                  <Card className="mb-6 p-6 text-center text-sm text-muted-foreground space-y-3">
                    <p>{t("community.mustBeMember")}</p>
                    <Button onClick={() => toggleMembership.mutate({ communityId: activeId })}>
                      Join Community
                    </Button>
                  </Card>
                ) : (
                  <Card className="mb-6 p-6 text-center text-sm text-muted-foreground">
                    {t("community.pleaseSignIn")}
                  </Card>
                )}

                <div className="space-y-4">
                  {postsLoading ? (
                    <p className="text-muted-foreground animate-pulse">Loading channel posts...</p>
                  ) : posts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No posts yet in this community. Start the conversation!</p>
                  ) : (
                    posts.filter((p: any) => !p.parent_id).map((p: any) => {
                      const isMe = user && p.user_id === user.id;
                      const isAdmin = user && (user as any).role === "admin";
                      const isReplying = replyingPostId === p.id;
                      const replies = posts.filter((r: any) => r.parent_id === p.id);

                      return (
                        <Card key={p.id} className="p-5 flex flex-col gap-4 group">
                          <div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback>
                                    {p.user?.display_name?.slice(0, 2).toUpperCase() || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <Link to="/profile/$userId" params={{ userId: p.user_id }} className="text-sm font-semibold hover:text-primary transition-colors">
                                    {p.user?.display_name || "Anonymous"}
                                  </Link>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(p.created_at).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {user && !isReplying && (
                                  <button onClick={() => setReplyingPostId(p.id)} className="text-xs text-primary hover:underline">{t("community.reply")}</button>
                                )}
                                {(isMe || isAdmin) && (
                                  <button onClick={() => { if (confirm("Delete this post?")) deletePostMutation.mutate({ postId: p.id }); }} className="text-xs text-red-500 hover:underline">{t("community.delete")}</button>
                                )}
                              </div>
                            </div>
                            <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{p.content}</p>
                          </div>

                          {/* Reply Box */}
                          {isReplying && (
                            <div className="ml-12 flex flex-col gap-2 border-l-2 pl-4 border-primary/20">
                              <Textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Write a reply..."
                                className="min-h-[60px] text-sm resize-none"
                              />
                              <div className="flex gap-2 justify-end">
                                <Button size="sm" variant="outline" onClick={() => { setReplyingPostId(null); setReplyContent(""); }}>{t("community.cancel")}</Button>
                                <Button
                                  size="sm"
                                  disabled={createPost.isPending || !replyContent.trim()}
                                  onClick={() => {
                                    createPost.mutate({
                                      community_id: activeId!,
                                      user_id: user!.id,
                                      content: replyContent.trim(),
                                      parent_id: p.id
                                    }, {
                                      onSuccess: () => {
                                        setReplyingPostId(null);
                                        setReplyContent("");
                                      }
                                    });
                                  }}
                                >
                                  {createPost.isPending ? "Replying..." : "Reply"}
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Replies */}
                          {replies.length > 0 && (
                            <div className="ml-12 flex flex-col gap-4 border-l-2 pl-4 border-muted">
                              {replies.map((r: any) => {
                                const isReplyMe = user && r.user_id === user.id;
                                return (
                                  <div key={r.id} className="group/reply">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-7 w-7">
                                          <AvatarFallback className="text-[10px]">
                                            {r.user?.display_name?.slice(0, 2).toUpperCase() || "?"}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <div className="text-sm font-semibold flex items-baseline gap-2">
                                            <Link to="/profile/$userId" params={{ userId: r.user_id }} className="hover:text-primary transition-colors">
                                              {r.user?.display_name || "Anonymous"}
                                            </Link>
                                            <span className="text-[10px] text-muted-foreground font-normal">
                                              {new Date(r.created_at).toLocaleDateString()}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex gap-2 opacity-0 group-hover/reply:opacity-100 transition-opacity">
                                        {user && !isReplying && (
                                          <button 
                                            onClick={() => {
                                              setReplyingPostId(p.id);
                                              setReplyContent(`@${r.user?.display_name || "Anonymous"} `);
                                            }} 
                                            className="text-xs text-primary hover:underline"
                                          >
                                            Reply
                                          </button>
                                        )}
                                        {(isReplyMe || isAdmin) && (
                                          <button onClick={() => { if (confirm("Delete this reply?")) deletePostMutation.mutate({ postId: r.id }); }} className="text-xs text-red-500 hover:underline">{t("community.delete")}</button>
                                        )}
                                      </div>
                                    </div>
                                    <p className="mt-1 pl-9 text-sm leading-relaxed whitespace-pre-wrap">{r.content}</p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </Card>
                      );
                    })
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {activeCommunity && (
              <Card className="p-5 animate-fade-in">
                <h3 className="mb-3 text-sm font-semibold">Community Info</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-sm text-muted-foreground">{activeCommunity.description}</p>
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" /> Status
                    </span>
                    <span className="font-medium">Active</span>
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-5">
              <h3 className="mb-3 text-sm font-semibold">Community Rules</h3>
              <ul className="space-y-2 text-sm">
                {[
                  "No spoilers without proper warning tags",
                  "Be respectful to all members",
                  "No self-promotion without permission",
                  "Keep discussions on topic"
                ].map((r) => (
                  <li key={r} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{r}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {user && (
              <Button className="w-full" variant="outline" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Create Community
              </Button>
            )}
          </aside>
        </div>
      </div>

      <CreateCommunityDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
