import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BookCover } from "@/components/book-cover";
import { DollarSign, BookOpen, Users, TrendingUp, Star, Plus, Loader2, MessageSquare, Briefcase, ChevronRight, Check, Edit2, Bold, Italic, Underline, Heading1, Heading3, Quote, Minus } from "lucide-react";
import { ResponsiveContainer, Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/empty-state";
import { useState } from "react";
import { useCreateChapter } from "@/hooks/use-chapters";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProfile } from "@/hooks/use-social";
import { PostAdDialog } from "@/components/post-ad-dialog";
import { ChatDialog } from "@/components/chat-dialog";
import { useCollabAds, useMyAds, useAdApplications, useApplyToAd, useAcceptCandidate } from "@/hooks/use-collab";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

const data = Array.from({ length: 30 }, (_, i) => ({
  day: `D${i + 1}`,
  earnings: Math.round(60 + Math.sin(i / 3) * 15 + i * 1.6 + Math.random() * 12),
}));

function Stat({ icon: Icon, label, value, delta }: { icon: any; label: string; value: string | number; delta: string }) {
  return (
    <Card className="p-5 flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-serif font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{delta}</p>
      </div>
      <div className="rounded-full bg-primary/10 p-3 text-primary">
        <Icon className="h-5 w-5" />
      </div>
    </Card>
  );
}

interface FormattingToolbarProps {
  onFormat: (prefix: string, suffix?: string) => void;
}

function FormattingToolbar({ onFormat }: FormattingToolbarProps) {
  return (
    <div className="flex flex-wrap gap-1 items-center bg-muted/40 p-1.5 rounded-t-md border border-b-0 border-input">
      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Bold" onClick={() => onFormat("**", "**")}>
        <Bold className="h-3.5 w-3.5" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Italic" onClick={() => onFormat("*", "*")}>
        <Italic className="h-3.5 w-3.5" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Underline" onClick={() => onFormat("<u>", "</u>")}>
        <Underline className="h-3.5 w-3.5" />
      </Button>
      <div className="h-4 w-px bg-border mx-1" />
      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Big Heading" onClick={() => onFormat("# ", "")}>
        <Heading1 className="h-3.5 w-3.5" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Sub Heading" onClick={() => onFormat("### ", "")}>
        <Heading3 className="h-3.5 w-3.5" />
      </Button>
      <div className="h-4 w-px bg-border mx-1" />
      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground flex items-center" title="Large Text" onClick={() => onFormat("<large>", "</large>")}>
        <span className="text-xs font-bold font-serif">A+</span>
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground flex items-center" title="Small Text" onClick={() => onFormat("<small>", "</small>")}>
        <span className="text-[10px] font-medium font-serif">A-</span>
      </Button>
      <div className="h-4 w-px bg-border mx-1" />
      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Quote" onClick={() => onFormat("> ", "")}>
        <Quote className="h-3.5 w-3.5" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Horizontal Line" onClick={() => onFormat("\n---\n", "")}>
        <Minus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

interface WriteChapterDialogProps {
  novelId: string | null;
  novelTitle: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function WriteChapterDialog({ novelId, novelTitle, open, onOpenChange }: WriteChapterDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [img1, setImg1] = useState("");
  const [img2, setImg2] = useState("");
  const createChapter = useCreateChapter();

  const insertFormat = (prefix: string, suffix: string = "") => {
    const textarea = document.getElementById("ch-content") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const replacement = prefix + (selectedText || "text") + suffix;
    const newValue = text.substring(0, start) + replacement + text.substring(end);
    setContent(newValue);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText || "text").length);
    }, 0);
  };

  const { data: chapters = [] } = useQuery({
    queryKey: ["chapters-count", novelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapters")
        .select("chapter_number")
        .eq("novel_id", novelId);
      if (error) throw error;
      return data;
    },
    enabled: !!novelId && open,
  });

  const nextChapterNumber = chapters.length > 0 
    ? Math.max(...chapters.map(c => c.chapter_number)) + 1 
    : 1;

  const handleSubmit = (e: React.FormEvent, status: string) => {
    e.preventDefault();
    if (!novelId || !title.trim() || !content.trim()) return;

    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    const images: string[] = [];
    if (img1.trim()) images.push(img1.trim());
    if (img2.trim()) images.push(img2.trim());

    createChapter.mutate(
      {
        novel_id: novelId,
        chapter_number: nextChapterNumber,
        title: title.trim(),
        content: content.trim(),
        word_count: wordCount,
        featured_images: images,
        status,
      },
      {
        onSuccess: () => {
          setTitle("");
          setContent("");
          setImg1("");
          setImg2("");
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Write Chapter for {novelTitle}</DialogTitle>
          <DialogDescription>Draft and publish a new chapter. Automatically numbered as #{nextChapterNumber}.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4 mt-2">
          <div className="grid gap-2">
            <Label htmlFor="ch-title">Chapter Title</Label>
            <Input
              id="ch-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Call to Adventure"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ch-img1">Illustration Image 1 URL (Optional)</Label>
              <Input
                id="ch-img1"
                value={img1}
                onChange={(e) => setImg1(e.target.value)}
                placeholder="https://example.com/art1.jpg"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ch-img2">Illustration Image 2 URL (Optional)</Label>
              <Input
                id="ch-img2"
                value={img2}
                onChange={(e) => setImg2(e.target.value)}
                placeholder="https://example.com/art2.jpg"
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded border border-border leading-relaxed">
            💡 <strong>Free Image Hosting Tip:</strong> Need image links? You can upload illustrations for free on sites like <a href="https://postimages.org" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-primary/80 font-medium">Postimages.org</a> or <a href="https://imgur.com" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-primary/80 font-medium">Imgur.com</a>. Make sure to copy and paste the <strong>"Direct Link"</strong> URL option!
          </p>
          <div className="grid gap-2">
            <Label htmlFor="ch-content">Chapter Content</Label>
            <div className="flex flex-col">
              <FormattingToolbar onFormat={insertFormat} />
              <Textarea
                id="ch-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your chapter content here..."
                className="min-h-[300px] font-serif text-[16px] leading-relaxed rounded-t-none"
                required
              />
            </div>
            <div className="text-xs text-muted-foreground text-right mt-1">
              Word Count: {content.trim().split(/\s+/).filter(Boolean).length}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={(e) => handleSubmit(e, "draft")} 
              disabled={createChapter.isPending}
            >
              Save as Draft
            </Button>
            <Button 
              type="button" 
              className="w-full" 
              onClick={(e) => handleSubmit(e, "pending")} 
              disabled={createChapter.isPending}
            >
              {createChapter.isPending ? "Submitting..." : "Submit for Approval"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ManageApplicationsProps {
  ad: any;
  onChatClick: (userId: string, userName: string) => void;
  novelId: string | null;
}

function ManageApplications({ ad, onChatClick, novelId }: ManageApplicationsProps) {
  const { data: apps = [], isLoading } = useAdApplications(ad.id);
  const acceptCandidate = useAcceptCandidate();

  if (isLoading) return <p className="text-xs text-muted-foreground animate-pulse text-center py-2">Loading candidates...</p>;
  if (apps.length === 0) return <p className="text-xs text-muted-foreground italic text-center py-2">No candidates applied yet.</p>;

  return (
    <div className="mt-3 space-y-2 border-t pt-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Applications</h4>
      {apps.map((app) => (
        <div key={app.id} className="flex items-center justify-between bg-muted/40 p-2.5 rounded-lg border text-sm">
          <div>
            <div className="font-semibold">{app.user?.display_name}</div>
            <div className="text-xs text-muted-foreground line-clamp-2">{app.message}</div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-8 px-2 flex items-center gap-1" onClick={() => onChatClick(app.user_id, app.user?.display_name || "")}>
              <MessageSquare className="h-3.5 w-3.5" /> Chat
            </Button>
            {app.status === "pending" && novelId && (
              <Button
                size="sm"
                className="h-8 px-2 flex items-center gap-1"
                disabled={acceptCandidate.isPending}
                onClick={() => acceptCandidate.mutate({ adId: ad.id, userId: app.user_id, novelId, role: ad.role_needed })}
              >
                <Check className="h-3.5 w-3.5" /> Accept
              </Button>
            )}
            {app.status === "accepted" && (
              <Badge variant="default" className="text-xs font-medium px-2 py-0.5">Accepted</Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface ApplyModalProps {
  ad: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ApplyModal({ ad, open, onOpenChange }: ApplyModalProps) {
  const [message, setMessage] = useState("");
  const applyMutation = useApplyToAd();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ad || !message.trim()) return;

    applyMutation.mutate(
      { ad_id: ad.id, message: message.trim() },
      {
        onSuccess: () => {
          setMessage("");
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Apply for Collaboration</DialogTitle>
          <DialogDescription>Submit your application to work on: <strong>{ad?.title}</strong></DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="app-msg">Introduce yourself & showcase portfolio</Label>
            <Textarea
              id="app-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi, I am interested. Here is my portfolio..."
              className="min-h-[100px]"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={applyMutation.isPending}>
            {applyMutation.isPending ? "Applying..." : "Submit Application"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Dashboard() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();

  // Profile role check
  const { data: profile } = useProfile(user.id);

  // Modal states
  const [writeOpen, setWriteOpen] = useState(false);
  const [selectedNovelId, setSelectedNovelId] = useState<string | null>(null);
  const [selectedNovelTitle, setSelectedNovelTitle] = useState<string | null>(null);

  const [postAdOpen, setPostAdOpen] = useState(false);
  const [adToEdit, setAdToEdit] = useState<any | null>(null);
  
  // DM states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatUserId, setChatUserId] = useState<string | null>(null);
  const [chatUserName, setChatUserName] = useState<string | null>(null);

  // Application states
  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<any | null>(null);

  // Query author's novels (polls every 3 seconds to show real-time views!)
  const { data: novels = [], isLoading } = useQuery({
    queryKey: ["my-novels", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("novels")
        .select("*")
        .eq("author_id", user.id);
      if (error) throw error;
      return data;
    },
    refetchInterval: 3000, 
  });

  // Query collaborator workspace novels
  const { data: collabNovels = [] } = useQuery({
    queryKey: ["collab-workspace", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collaborations")
        .select("*, novel:novels(*, author:profiles!author_id(display_name))")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
  });

  // Query collab ads
  const { data: myAds = [] } = useMyAds();
  const { data: adsFeed = [] } = useCollabAds();

  const totalViews = novels.reduce((acc, curr) => acc + curr.view_count, 0);
  
  // Format view count
  const formattedViews = totalViews >= 1000 
    ? (totalViews / 1000).toFixed(1) + "K" 
    : totalViews;

  const openWriteChapter = (novelId: string, title: string) => {
    setSelectedNovelId(novelId);
    setSelectedNovelTitle(title);
    setWriteOpen(true);
  };

  const handleChatClick = (targetId: string, targetName: string) => {
    setChatUserId(targetId);
    setChatUserName(targetName);
    setChatOpen(true);
  };

  const handleApplyClick = (ad: any) => {
    setSelectedAd(ad);
    setApplyOpen(true);
  };

  const handleEditAdClick = (ad: any) => {
    setAdToEdit(ad);
    setPostAdOpen(true);
  };

  const handleNewAdClick = () => {
    setAdToEdit(null);
    setPostAdOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-4xl font-semibold tracking-tight">Workspace Dashboard</h1>
              <Badge className="capitalize font-medium">{profile?.role || "Author"}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Track earnings, collab ads, and novel views in real-time.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/upload">
              <Button><Plus className="mr-2 h-4 w-4" />New Novel</Button>
            </Link>
            {profile?.role === "author" && (
              <Button variant="outline" onClick={handleNewAdClick}>
                <Briefcase className="mr-2 h-4 w-4" /> Post Collab Ad
              </Button>
            )}
          </div>
        </header>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Stat icon={BookOpen} label="Total Views (Realtime)" value={formattedViews} delta="Refreshed live" />
          <Stat icon={Users} label="My Projects" value={novels.length + collabNovels.length} delta="Active workspaces" />
        </div>

        {/* Novels Workspace */}
        <section className="space-y-4">
          <h2 className="text-xl font-serif font-bold">My Authored Novels</h2>
          {isLoading ? (
            <p className="text-muted-foreground animate-pulse">Loading novels...</p>
          ) : novels.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No novels yet"
              description="Start publishing your first story to grow an audience!"
              action={{
                label: "Publish Novel",
                onClick: () => navigate({ to: "/upload" }),
              }}
            />
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {novels.map((n, idx) => (
                <Card key={n.id} className="flex flex-col justify-between p-5 card-hover relative overflow-hidden">
                  <div className="flex gap-4">
                    <div className="w-24 shrink-0">
                      <BookCover title={n.title} coverUrl={n.cover_url} coverColor={n.cover_color} palette={idx} className="w-full" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {n.status === "completed" ? (
                          <Badge className="bg-emerald-500 text-white border-transparent hover:bg-emerald-600 text-[10px] uppercase font-medium">Completed</Badge>
                        ) : n.status === "ongoing" ? (
                          <Badge className="bg-purple-500 text-white border-transparent hover:bg-purple-600 text-[10px] uppercase font-medium">Ongoing</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] uppercase font-medium">{n.status}</Badge>
                        )}
                        {n.approval_status !== "approved" && (
                          <Badge variant="destructive" className="text-[10px] uppercase font-medium">{n.approval_status}</Badge>
                        )}
                      </div>
                      <h3 className="font-serif text-lg font-bold leading-tight line-clamp-2">{n.title}</h3>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="font-semibold text-foreground animate-pulse">{n.view_count}</span> views (realtime)
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t flex flex-wrap gap-2 justify-end">
                    <Link to="/novel/$novelId" params={{ novelId: n.slug }}>
                      <Button size="sm" variant="outline">View Page</Button>
                    </Link>
                    <Button size="sm" onClick={() => openWriteChapter(n.id, n.title)}>
                      <Plus className="mr-1 h-3.5 w-3.5" /> Chapter
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Collaborators Workspace */}
        {collabNovels.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-serif font-bold">Collaborative Workspace</h2>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {collabNovels.map((col, idx) => {
                const n = col.novel;
                if (!n) return null;
                return (
                  <Card key={col.id} className="flex flex-col justify-between p-5 card-hover relative overflow-hidden">
                    <div className="flex gap-4">
                      <div className="w-24 shrink-0">
                        <BookCover title={n.title} coverUrl={n.cover_url} coverColor={n.cover_color} palette={idx + 4} className="w-full" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <h3 className="font-serif text-lg font-bold leading-tight line-clamp-2">{n.title}</h3>
                        <div className="text-xs text-muted-foreground">
                          by {n.author?.display_name}
                        </div>
                        <Badge className="mt-2 text-xs uppercase" variant="outline">{col.role}</Badge>
                      </div>
                    </div>
                    <div className="mt-5 pt-3 border-t flex justify-end gap-2">
                      <Link to="/workspace/$novelId" params={{ novelId: n.id }}>
                        <Button size="sm" variant="default">Workspace</Button>
                      </Link>
                      {col.role === "author" && (
                        <Button size="sm" variant="outline" onClick={() => openWriteChapter(n.id, n.title)}>
                          <Plus className="mr-1 h-3.5 w-3.5" /> Chapter
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Collaboration Job Ads section */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Posted Ads (My Recruitment) */}
          <section className="space-y-4">
            <h2 className="text-xl font-serif font-bold">My Recruitment Ads</h2>
            {myAds.length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">
                No active recruitment ads. Post an ad to hire Illustrators or Editors.
              </Card>
            ) : (
              <div className="space-y-4">
                {myAds.map((ad) => (
                  <Card key={ad.id} className="p-5">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{ad.title}</h3>
                        <div className="flex flex-wrap gap-1.5 text-xs">
                          <Badge variant="outline" className="capitalize">Needs: {ad.role_needed}</Badge>
                          <Badge className="bg-primary/10 text-primary border-primary/20">{ad.payment_amount || "Volunteer"}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handleEditAdClick(ad)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Badge variant={ad.status === "open" ? "default" : "secondary"} className="capitalize">{ad.status}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">{ad.description}</p>
                    <ManageApplications ad={ad} onChatClick={handleChatClick} novelId={ad.novel_id} />
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Job Board Feed (Available collaborations) */}
          <section className="space-y-4">
            <h2 className="text-xl font-serif font-bold">Available Collaborations</h2>
            {adsFeed.length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">
                No collaboration requests posted at the moment.
              </Card>
            ) : (
              <div className="space-y-4">
                {adsFeed.map((ad) => (
                  <Card key={ad.id} className="p-5 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{ad.title}</h3>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            <Badge variant="outline" className="capitalize text-xs">Role: {ad.role_needed}</Badge>
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">{ad.payment_amount || "Volunteer"}</Badge>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Posted by {ad.author?.display_name}</p>
                      <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{ad.description}</p>
                    </div>
                    {user && user.id !== ad.author_id && (
                      <div className="mt-4 flex gap-2 border-t pt-3 justify-end">
                        <Button size="sm" variant="outline" onClick={() => handleChatClick(ad.author_id, ad.author?.display_name || "")}>
                          <MessageSquare className="mr-1 h-3.5 w-3.5" /> Chat
                        </Button>
                        <Button size="sm" onClick={() => handleApplyClick(ad)}>
                          Apply
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <WriteChapterDialog
        novelId={selectedNovelId}
        novelTitle={selectedNovelTitle}
        open={writeOpen}
        onOpenChange={setWriteOpen}
      />

      <PostAdDialog
        open={postAdOpen}
        onOpenChange={setPostAdOpen}
        adToEdit={adToEdit}
      />

      <ChatDialog
        otherUserId={chatUserId}
        otherUserName={chatUserName}
        open={chatOpen}
        onOpenChange={setChatOpen}
      />

      <ApplyModal
        ad={selectedAd}
        open={applyOpen}
        onOpenChange={setApplyOpen}
      />
    </div>
  );
}

