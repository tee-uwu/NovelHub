import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { TopNav } from "@/components/top-nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Star, Users, MessageSquare, Heart, ChevronLeft, ChevronRight, Bookmark, Type } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useChapter, usePublicChapters } from "@/hooks/use-chapters";
import { useComments, useCreateComment } from "@/hooks/use-comments";
import { useToggleLibrary, useUpdateProgress } from "@/hooks/use-library";
import { useSession } from "@/hooks/use-session";
import { useState } from "react";
import { toast } from "sonner";

const searchSchema = z.object({
  novelId: z.string().optional(),
  chapterId: z.string().optional(),
});

function parseMarkdown(text: string) {
  if (!text) return "";
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  
  html = html
    .replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/g, "<u>$1</u>")
    .replace(/&lt;large&gt;([\s\S]*?)&lt;\/large&gt;/g, '<span class="text-2xl font-serif font-semibold">$1</span>')
    .replace(/&lt;small&gt;([\s\S]*?)&lt;\/small&gt;/g, '<span class="text-xs text-muted-foreground">$1</span>')
    .replace(/\*\*([\s\S]*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([\s\S]*?)\*/g, "<em>$1</em>")
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4 font-serif text-foreground">$1</h1>')
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-6 mb-2 font-serif text-foreground">$1</h3>')
    .replace(/^&gt; (.*$)/gim, '<blockquote class="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">$1</blockquote>')
    .replace(/---/g, '<hr class="my-6 border-muted" />');

  return html;
}

export const Route = createFileRoute("/read")({
  validateSearch: (s) => searchSchema.parse(s),
  component: Reader,
});

function Reader() {
  const { novelId, chapterId } = Route.useSearch();
  const { user } = useSession();
  const navigate = useNavigate();

  const [commentContent, setCommentContent] = useState("");

  // Fetch novel by ID
  const { data: novel, isLoading: novelLoading } = useQuery({
    queryKey: ["novel-by-id", novelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("novels")
        .select("*, author:profiles!author_id(display_name)")
        .eq("id", novelId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!novelId,
  });

  const { data: chapter, isLoading: chapterLoading } = useChapter(chapterId);
  const { data: chapters = [], isLoading: chaptersLoading } = usePublicChapters(novelId);
  const { data: comments = [], isLoading: commentsLoading } = useComments(chapterId);
  
  const createComment = useCreateComment();
  const updateProgress = useUpdateProgress();
  const toggleLibrary = useToggleLibrary();

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const queryClient = useQueryClient();

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", chapterId] });
      toast.success("Comment deleted");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete comment");
    }
  });

  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const { error } = await supabase
        .from("comments")
        .update({ content })
        .eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", chapterId] });
      toast.success("Comment updated");
      setEditingCommentId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update comment");
    }
  });

  if (novelLoading || chapterLoading || chaptersLoading) {
    return (
      <div className="min-h-screen">
        <TopNav />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <p className="text-muted-foreground animate-pulse">Loading reading room...</p>
        </div>
      </div>
    );
  }

  if (!chapter || !novel) {
    return (
      <div className="min-h-screen">
        <TopNav />
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Chapter or Novel not found.</p>
        </div>
      </div>
    );
  }

  // Find index of current chapter
  const currentIdx = chapters.findIndex((c) => c.id === chapterId);
  const prevChapter = currentIdx > 0 ? chapters[currentIdx - 1] : null;
  const nextChapter = currentIdx < chapters.length - 1 ? chapters[currentIdx + 1] : null;

  const currentPercent = chapters.length > 0 
    ? Math.round(((currentIdx + 1) / chapters.length) * 100) 
    : 0;

  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return toast.error("Must be logged in to comment");
    if (!commentContent.trim()) return;

    createComment.mutate(
      {
        chapter_id: chapter!.id,
        user_id: user.id,
        content: commentContent.trim(),
      },
      {
        onSuccess: () => {
          setCommentContent("");
        },
      }
    );
  }

  function handleSaveBookmark() {
    if (!user) return toast.error("Must be logged in to save bookmarks");
    updateProgress.mutate({
      novelId: novel!.id,
      current_chapter: chapter!.chapter_number,
      progress: currentPercent,
    }, {
      onSuccess: () => {
        toast.success("Bookmark saved!");
      }
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <TopNav />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[220px_1fr_320px]">
        {/* Chapter list */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <h3 className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Chapters</h3>
            <nav className="max-h-[75vh] space-y-0.5 overflow-y-auto pr-2">
              {chapters.map((c) => (
                <Link
                  key={c.id}
                  to="/read"
                  search={{ novelId, chapterId: c.id }}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                    c.id === chapterId
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span className="truncate">Ch {c.chapter_number}: {c.title}</span>
                  {c.id === chapterId && <span className="ml-2 h-1.5 w-1.5 rounded-full bg-primary" />}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Reading area */}
        <main className="max-w-2xl mx-auto w-full">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Chapter {chapter.chapter_number}
              </p>
              <h1 className="mt-1 font-serif text-3xl font-semibold">{chapter.title}</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={handleSaveBookmark} title="Save Bookmark">
                <Bookmark className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Chapter visual illustrations (featured images) */}
          {(chapter as any).featured_images && (chapter as any).featured_images.length > 0 && (
            <div className="my-6 grid gap-4 sm:grid-cols-2">
              {(chapter as any).featured_images.map((img: string, idx: number) => (
                <div key={idx} className="relative aspect-[16/9] sm:aspect-[4/3] w-full overflow-hidden rounded-lg border shadow-sm group bg-muted">
                  <img 
                    src={fixImageUrl(img)} 
                    alt={`Illustration ${idx + 1}`} 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://placehold.co/600x400/1e293b/white?text=Invalid+Image+Link";
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          <article 
            className="font-serif text-[18px] leading-8 space-y-6 text-foreground/90 whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(chapter.content) }}
          />

          <div className="mt-12 flex items-center justify-between border-t pt-6">
            {prevChapter ? (
              <Link to="/read" search={{ novelId, chapterId: prevChapter.id }}>
                <Button variant="outline"><ChevronLeft className="mr-1 h-4 w-4" /> Previous</Button>
              </Link>
            ) : (
              <Button variant="outline" disabled><ChevronLeft className="mr-1 h-4 w-4" /> Start</Button>
            )}

            {nextChapter ? (
              <Link to="/read" search={{ novelId, chapterId: nextChapter.id }}>
                <Button>Next <ChevronRight className="ml-1 h-4 w-4" /></Button>
              </Link>
            ) : (
              <Button disabled>End <ChevronRight className="ml-1 h-4 w-4" /></Button>
            )}
          </div>

          {/* Comments section */}
          <section className="mt-16">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Comments</h2>
              <span className="text-sm text-muted-foreground">{comments.length}</span>
            </div>

            {user ? (
              <form onSubmit={handlePostComment} className="mb-6 rounded-lg border bg-card p-4">
                <Textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Share your thoughts on this chapter…"
                  className="min-h-[80px] resize-none border-0 p-0 shadow-none focus-visible:ring-0"
                />
                <div className="mt-3 flex justify-end">
                  <Button size="sm" type="submit" disabled={createComment.isPending}>
                    {createComment.isPending ? "Posting…" : "Post Comment"}
                  </Button>
                </div>
              </form>
            ) : (
              <Card className="mb-6 p-4 text-center text-sm text-muted-foreground">
                Please <Link to="/auth" className="text-primary hover:underline">sign in</Link> to post comments.
              </Card>
            )}

            <div className="space-y-4">
              {commentsLoading ? (
                <p className="text-sm text-muted-foreground animate-pulse">Loading comments...</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments yet. Write the first comment!</p>
              ) : (
                comments.filter((c: any) => !c.parent_id).map((c: any) => {
                  const isMe = user && c.user_id === user.id;
                  const isAdmin = user && (user as any).role === "admin";
                  const isEditing = editingCommentId === c.id;
                  const isReplying = replyingCommentId === c.id;
                  const replies = comments.filter((r: any) => r.parent_id === c.id);

                  return (
                    <div key={c.id} className="flex flex-col gap-4">
                      {/* Parent Comment */}
                      <div className="flex gap-3 items-start group">
                        <Avatar className="h-9 w-9 border shadow-sm shrink-0">
                          {c.user?.avatar_url ? (
                            <img src={c.user.avatar_url} alt={c.user.display_name} className="h-full w-full object-cover rounded-full" />
                          ) : (
                            <AvatarFallback>
                              {c.user?.display_name?.slice(0, 2).toUpperCase() || "?"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-2">
                              <Link to="/profile/$userId" params={{ userId: c.user_id }} className="text-sm font-semibold hover:text-primary transition-colors">
                                {c.user?.display_name || "Anonymous"}
                              </Link>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(c.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {user && !isReplying && (
                                <button
                                  onClick={() => setReplyingCommentId(c.id)}
                                  className="text-xs text-primary hover:underline"
                                >
                                  Reply
                                </button>
                              )}
                              {isMe && !isEditing && (
                                <button
                                  onClick={() => {
                                    setEditingCommentId(c.id);
                                    setEditContent(c.content);
                                  }}
                                  className="text-xs text-primary hover:underline"
                                >
                                  Edit
                                </button>
                              )}
                              {(isMe || isAdmin) && (
                                <button
                                  onClick={() => {
                                    if (confirm("Are you sure you want to delete this comment?")) {
                                      deleteCommentMutation.mutate(c.id);
                                    }
                                  }}
                                  className="text-xs text-red-500 hover:underline"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                          {isEditing ? (
                            <div className="mt-2 space-y-2">
                              <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="min-h-[60px] text-sm"
                              />
                              <div className="flex gap-2 justify-end">
                                <Button size="sm" variant="outline" onClick={() => setEditingCommentId(null)}>Cancel</Button>
                                <Button
                                  size="sm"
                                  onClick={() => updateCommentMutation.mutate({ commentId: c.id, content: editContent.trim() })}
                                  disabled={updateCommentMutation.isPending || !editContent.trim()}
                                >
                                  Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="mt-1 text-sm leading-relaxed text-foreground/90">{c.content}</p>
                          )}
                        </div>
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
                            <Button size="sm" variant="outline" onClick={() => { setReplyingCommentId(null); setReplyContent(""); }}>Cancel</Button>
                            <Button
                              size="sm"
                              disabled={createComment.isPending || !replyContent.trim()}
                              onClick={() => {
                                createComment.mutate({
                                  chapter_id: chapter!.id,
                                  user_id: user!.id,
                                  content: replyContent.trim(),
                                  parent_id: c.id
                                }, {
                                  onSuccess: () => {
                                    setReplyingCommentId(null);
                                    setReplyContent("");
                                  }
                                });
                              }}
                            >
                              {createComment.isPending ? "Replying..." : "Reply"}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Replies List */}
                      {replies.length > 0 && (
                        <div className="ml-12 flex flex-col gap-4 border-l-2 pl-4 border-muted">
                          {replies.map((r: any) => {
                            const isReplyMe = user && r.user_id === user.id;
                            const isReplyEditing = editingCommentId === r.id;
                            return (
                              <div key={r.id} className="flex gap-3 items-start group">
                                <Avatar className="h-7 w-7 border shadow-sm shrink-0">
                                  {r.user?.avatar_url ? (
                                    <img src={r.user.avatar_url} alt={r.user.display_name} className="h-full w-full object-cover rounded-full" />
                                  ) : (
                                    <AvatarFallback className="text-[10px]">
                                      {r.user?.display_name?.slice(0, 2).toUpperCase() || "?"}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-baseline gap-2">
                                      <Link to="/profile/$userId" params={{ userId: r.user_id }} className="text-sm font-semibold hover:text-primary transition-colors">
                                        {r.user?.display_name || "Anonymous"}
                                      </Link>
                                      <span className="text-[10px] text-muted-foreground">
                                        {new Date(r.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {user && !isReplying && (
                                          <button 
                                            onClick={() => {
                                              setReplyingCommentId(c.id);
                                              setReplyContent(`@${r.user?.display_name || "Anonymous"} `);
                                            }} 
                                            className="text-xs text-primary hover:underline"
                                          >
                                            Reply
                                          </button>
                                        )}
                                      {isReplyMe && !isReplyEditing && (
                                        <button onClick={() => { setEditingCommentId(r.id); setEditContent(r.content); }} className="text-xs text-primary hover:underline">Edit</button>
                                      )}
                                      {(isReplyMe || isAdmin) && (
                                        <button onClick={() => { if (confirm("Delete this reply?")) deleteCommentMutation.mutate(r.id); }} className="text-xs text-red-500 hover:underline">Delete</button>
                                      )}
                                    </div>
                                  </div>
                                  {isReplyEditing ? (
                                    <div className="mt-2 space-y-2">
                                      <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="min-h-[60px] text-sm" />
                                      <div className="flex gap-2 justify-end">
                                        <Button size="sm" variant="outline" onClick={() => setEditingCommentId(null)}>Cancel</Button>
                                        <Button size="sm" onClick={() => updateCommentMutation.mutate({ commentId: r.id, content: editContent.trim() })} disabled={updateCommentMutation.isPending || !editContent.trim()}>Save</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="mt-1 text-sm leading-relaxed text-foreground/90">{r.content}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </main>

        {/* Novel info sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <Card className="p-5">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-lg font-semibold leading-tight">{novel.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">by {novel.author?.display_name}</p>
                </div>
              </div>
              <div className="mb-3 flex flex-wrap gap-1">
                <Badge variant="secondary">{novel.genre}</Badge>
              </div>
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium text-primary capitalize">{novel.status}</span>
              </div>
              <Separator className="my-3" />
              
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Novel Progress</span>
                <span className="font-medium">{currentPercent}%</span>
              </div>
              <Progress value={currentPercent} className="h-1.5" />
              
              {user && (
                <Button
                  className="mt-4 w-full"
                  variant="outline"
                  onClick={() => toggleLibrary.mutate({ novelId: novel.id })}
                >
                  <Bookmark className="mr-2 h-4 w-4" />
                  Add to library
                </Button>
              )}
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}
