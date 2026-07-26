import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";
import { BookCover } from "@/components/book-cover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, BookOpen, Bookmark, Share2, Plus, Loader2, Edit, Settings, Trash2, Check, Bold, Italic, Underline, Heading3, Quote, Minus, Heading1, LayoutDashboard } from "lucide-react";
import { useNovel } from "@/hooks/use-novels";
import { useChapters, useCreateChapter } from "@/hooks/use-chapters";
import { useReviews } from "@/hooks/use-reviews";
import { useLibraryItem, useToggleLibrary } from "@/hooks/use-library";
import { useSession } from "@/hooks/use-session";
import { ReviewForm } from "@/components/review-form";
import { toast } from "sonner";
import { ChapterListSkeleton } from "@/components/loading-skeleton";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNovelCollaborators } from "@/hooks/use-collab";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export const Route = createFileRoute("/novel/$novelId")({
  head: () => ({
    meta: [
      { title: "Read Novel | NovelHub" },
      { name: "description", content: "Read this amazing novel on NovelHub." },
      { property: "og:title", content: "Read Novel | NovelHub" },
      { property: "og:description", content: "Read this amazing novel on NovelHub." },
    ],
  }),
  component: NovelDetail,
});

interface FormattingToolbarProps {
  onFormat: (prefix: string, suffix?: string) => void;
}

export function FormattingToolbar({ onFormat }: FormattingToolbarProps) {
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
  novelId: string;
  novelTitle: string;
  nextChapterNumber: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WriteChapterDialog({ novelId, novelTitle, nextChapterNumber, open, onOpenChange }: WriteChapterDialogProps) {
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

  const handleSubmit = (e: React.FormEvent, status: string) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

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
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
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
              {createChapter.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save as Draft"}
            </Button>
            <Button 
              type="button" 
              className="w-full" 
              onClick={(e) => handleSubmit(e, "pending")} 
              disabled={createChapter.isPending}
            >
              {createChapter.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit for Approval"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditChapterDialogProps {
  chapter: any;
  novelTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditChapterDialog({ chapter, novelTitle, open, onOpenChange }: EditChapterDialogProps) {
  const { user } = useSession();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [img1, setImg1] = useState("");
  const [img2, setImg2] = useState("");
  const queryClient = useQueryClient();
  const [lockedBy, setLockedBy] = useState<string | null>(null);

  const insertFormat = (prefix: string, suffix: string = "") => {
    const textarea = document.getElementById("edit-ch-content") as HTMLTextAreaElement;
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

  useEffect(() => {
    if (chapter) {
      setTitle(chapter.title);
      setContent(chapter.content);
      setImg1(chapter.featured_images?.[0] || "");
      setImg2(chapter.featured_images?.[1] || "");
    }
  }, [chapter, open]);

  useEffect(() => {
    if (!open || !chapter || !user) return;

    const channel = supabase.channel(`chapter-edit-${chapter.id}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        let otherUserId = null;
        for (const [key, presences] of Object.entries(state)) {
          if (key !== user.id && presences.length > 0) {
            otherUserId = (presences[0] as any).user_id;
            break;
          }
        }
        setLockedBy(otherUserId);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: user.id });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setLockedBy(null);
    };
  }, [open, chapter, user]);

  const updateMutation = useMutation({
    mutationFn: async (status: string) => {
      if (!chapter) return;
      const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
      const images: string[] = [];
      if (img1.trim()) images.push(img1.trim());
      if (img2.trim()) images.push(img2.trim());

      const { data, error } = await supabase
        .from("chapters")
        .update({
          title: title.trim(),
          content: content.trim(),
          word_count: wordCount,
          featured_images: images,
          status,
        })
        .eq("id", chapter.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ["chapters", chapter?.novel_id] });
      queryClient.invalidateQueries({ queryKey: ["chapter", chapter?.id] });
      toast.success(status === "draft" ? "Draft saved successfully!" : "Chapter submitted for approval!");
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update chapter");
    },
  });

  const handleSubmit = (e: React.FormEvent, status: string) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    updateMutation.mutate(status);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Edit Chapter #{chapter?.chapter_number} of {novelTitle}</DialogTitle>
          <DialogDescription>Modify your chapter content, title, and illustrations.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4 mt-2">
          {lockedBy && (
            <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm font-medium flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
              </span>
              Someone else is currently editing this chapter. Editing is disabled to prevent conflicts.
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="edit-ch-title">Chapter Title</Label>
            <Input
              id="edit-ch-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Chapter Title"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-ch-img1">Illustration Image 1 URL (Optional)</Label>
              <Input
                id="edit-ch-img1"
                value={img1}
                onChange={(e) => setImg1(e.target.value)}
                placeholder="https://example.com/art1.jpg"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-ch-img2">Illustration Image 2 URL (Optional)</Label>
              <Input
                id="edit-ch-img2"
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
            <Label htmlFor="edit-ch-content">Chapter Content</Label>
            <div className="flex flex-col">
              <FormattingToolbar onFormat={insertFormat} />
              <Textarea
                id="edit-ch-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Chapter Content"
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
              disabled={updateMutation.isPending || !!lockedBy}
            >
              {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save as Draft"}
            </Button>
            <Button 
              type="button" 
              className="w-full" 
              onClick={(e) => handleSubmit(e, "pending")} 
              disabled={updateMutation.isPending || !!lockedBy}
            >
              {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit for Approval"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface NovelSettingsDialogProps {
  novel: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function NovelSettingsDialog({ novel, open, onOpenChange }: NovelSettingsDialogProps) {
  const defaultGenres = ["Fantasy", "Sci-Fi", "Romance", "Mystery", "Action", "Drama", "Isekai"];
  const isDefaultGenre = defaultGenres.includes(novel?.genre || "Fantasy");

  const [title, setTitle] = useState(novel?.title || "");
  const [synopsis, setSynopsis] = useState(novel?.synopsis || "");
  const [selectedGenreOption, setSelectedGenreOption] = useState(isDefaultGenre ? (novel?.genre || "Fantasy") : "custom");
  const [customGenre, setCustomGenre] = useState(isDefaultGenre ? "" : (novel?.genre || ""));
  const [status, setStatus] = useState(novel?.status || "ongoing");
  const [coverUrl, setCoverUrl] = useState(novel?.cover_url || "");
  const [coverColor, setCoverColor] = useState(novel?.cover_color || "#334155");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (novel) {
      setTitle(novel.title);
      setSynopsis(novel.synopsis);
      const isDefault = defaultGenres.includes(novel.genre);
      setSelectedGenreOption(isDefault ? novel.genre : "custom");
      setCustomGenre(isDefault ? "" : novel.genre);
      setStatus(novel.status);
      setCoverUrl(novel.cover_url || "");
      setCoverColor(novel.cover_color || "#334155");
    }
  }, [novel, open]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const finalGenre = selectedGenreOption === "custom" ? customGenre.trim() : selectedGenreOption;
      const { data, error } = await supabase
        .from("novels")
        .update({ title, synopsis, genre: finalGenre, status, cover_url: coverUrl.trim() || null, cover_color: coverColor })
        .eq("id", novel.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["novel", novel.slug] });
      queryClient.invalidateQueries({ queryKey: ["novels"] });
      toast.success("Novel details updated!");
      onOpenChange(false);
      if (data.slug !== novel.slug) {
        navigate({ to: `/novel/${data.slug}` });
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update novel details");
    },
  });

  const handleDelete = async () => {
    if (!window.confirm("Are you absolutely sure you want to delete this novel? This cannot be undone.")) return;
    setDeleting(true);
    const { error } = await supabase.from("novels").delete().eq("id", novel.id);
    setDeleting(false);
    if (error) {
      toast.error(error.message || "Failed to delete novel");
    } else {
      toast.success("Novel deleted successfully!");
      onOpenChange(false);
      navigate({ to: "/dashboard" });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Novel Settings</DialogTitle>
          <DialogDescription>Modify metadata or delete this project.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="set-title">Novel Title</Label>
            <Input id="set-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="set-cover">Cover Image URL</Label>
            <Input id="set-cover" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://example.com/cover.jpg" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Fallback / Background Color</Label>
            <div className="flex gap-2 items-center">
              <Input 
                type="color" 
                value={coverColor} 
                onChange={(e) => setCoverColor(e.target.value)} 
                className="w-12 h-8 p-1 cursor-pointer"
              />
              <span className="text-xs text-muted-foreground uppercase">{coverColor}</span>
            </div>
          </div>
          <div>
            <Label htmlFor="set-synopsis">Synopsis</Label>
            <Textarea id="set-synopsis" value={synopsis} onChange={(e) => setSynopsis(e.target.value)} className="min-h-[100px]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Genre</Label>
              <Select value={selectedGenreOption} onValueChange={setSelectedGenreOption}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {defaultGenres.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                  <SelectItem value="custom">Custom Genre...</SelectItem>
                </SelectContent>
              </Select>
              {selectedGenreOption === "custom" && (
                <div className="mt-2">
                  <Label>Custom Genre Name</Label>
                  <Input value={customGenre} onChange={(e) => setCustomGenre(e.target.value)} required className="mt-1" />
                </div>
              )}
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="hiatus">Hiatus</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="destructive" className="w-full flex items-center justify-center gap-2" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="h-4 w-4" /> {deleting ? "Deleting..." : "Delete Novel"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NovelDetail() {
  const { novelId: slug } = Route.useParams();
  const { user } = useSession();
  const { data: novel, isLoading: novelLoading } = useNovel(slug);
  const { data: chapters = [], isLoading: chaptersLoading } = useChapters(novel?.id);
  const { data: reviews = [] } = useReviews(novel?.id);
  const { data: libraryItem } = useLibraryItem(novel?.id);
  const toggleLibrary = useToggleLibrary();

  // Query collaborators
  const { data: collaborators = [] } = useNovelCollaborators(novel?.id);

  // Query logged in profile to check role (for admin controls)
  const { data: myProfile } = useMutation({
    mutationFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      return data;
    },
  });

  const [writeOpen, setWriteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Edit chapter states
  const [editOpen, setEditOpen] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<{ id: string; novel_id: string; title: string; content: string; chapter_number: number } | null>(null);

  if (novelLoading) {
    return (
      <div className="min-h-screen">
        <TopNav />
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex animate-pulse space-x-8">
            <div className="h-64 w-44 rounded-md bg-muted" />
            <div className="flex-1 space-y-4">
              <div className="h-8 w-2/3 bg-muted" />
              <div className="h-4 w-1/3 bg-muted" />
              <div className="h-20 w-full bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="min-h-screen">
        <TopNav />
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Novel not found.</p>
        </div>
      </div>
    );
  }

  const isAdmin = (myProfile as any)?.role === "admin";
  const isCoAuthor = collaborators.some(c => c.user_id === user?.id && c.role === "author");
  const canWriteChapter = user && (user.id === novel.author_id || isCoAuthor || isAdmin);

  const firstChapter = chapters[0];
  const totalChapters = chapters.length;
  const nextChapterNumber = chapters.length > 0
    ? Math.max(...chapters.map(c => c.chapter_number)) + 1
    : 1;

  // Format view count
  const formattedReads = novel.view_count >= 1000000 
    ? (novel.view_count / 1000000).toFixed(1) + "M"
    : novel.view_count >= 1000 
      ? (novel.view_count / 1000).toFixed(1) + "K"
      : novel.view_count;

  // Average Rating
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: novel!.title,
        text: novel!.synopsis,
        url,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url).then(() => {
        toast.success("Link copied to clipboard!");
      });
    }
  }

  const handleEditChapterClick = (c: any) => {
    setSelectedChapter(c);
    setEditOpen(true);
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="border-b bg-muted/30">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[220px_1fr]">
          <BookCover title={novel.title} coverUrl={novel.cover_url} coverColor={novel.cover_color} palette={1} className="w-full max-w-[220px]" />
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>{novel.genre}</Badge>
              {novel.tags?.map((t: string) => (
                <Badge key={t} variant="outline">{t}</Badge>
              ))}
              {novel.approval_status !== "approved" && (
                <Badge variant="destructive" className="capitalize">Approval: {novel.approval_status}</Badge>
              )}
            </div>
            <div className="flex items-center gap-4 justify-between">
              <h1 className="font-serif text-4xl font-semibold tracking-tight">{novel.title}</h1>
              {user && (user.id === novel.author_id || isAdmin) && (
                <Button size="icon" variant="ghost" onClick={() => setSettingsOpen(true)}>
                  <Settings className="h-5 w-5" />
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <span>by</span>
              <Link
                to="/profile/$userId"
                params={{ userId: novel.author_id }}
                className="text-foreground font-medium hover:text-primary transition-colors flex items-center gap-1"
              >
                {novel.author?.display_name || "Unknown Author"}
                {novel.author?.is_verified && (
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground" title="Verified Author">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </span>
                )}
              </Link>
            </p>
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-primary text-primary" /> {avgRating} · {reviews.length} reviews
              </span>
              <span className="text-muted-foreground">{totalChapters} chapters</span>
              {novel.status === "completed" ? (
                <Badge className="bg-emerald-500 text-white border-transparent hover:bg-emerald-600 capitalize h-5 px-2">Completed</Badge>
              ) : novel.status === "ongoing" ? (
                <Badge className="bg-purple-500 text-white border-transparent hover:bg-purple-600 capitalize h-5 px-2">Ongoing</Badge>
              ) : (
                <Badge variant="outline" className="capitalize h-5 px-2">{novel.status}</Badge>
              )}
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {novel.synopsis}
            </p>
            <div className="flex flex-wrap gap-2">
              {firstChapter ? (
                <Link to="/read" search={{ novelId: novel.id, chapterId: firstChapter.id }}>
                  <Button size="lg"><BookOpen className="mr-2 h-4 w-4" />Start Reading</Button>
                </Link>
              ) : (
                <Button size="lg" disabled><BookOpen className="mr-2 h-4 w-4" />No Chapters</Button>
              )}
              {canWriteChapter && (
                <Button size="lg" onClick={() => setWriteOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Write Chapter
                </Button>
              )}
              {canWriteChapter && (
                <Link to="/workspace/$novelId" params={{ novelId: novel.id }}>
                  <Button size="lg" variant="secondary" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Workspace
                  </Button>
                </Link>
              )}
              {user ? (
                <Button
                  size="lg"
                  variant={libraryItem ? "secondary" : "outline"}
                  onClick={() => toggleLibrary.mutate({ novelId: novel.id })}
                  disabled={toggleLibrary.isPending}
                >
                  <Bookmark className={`mr-2 h-4 w-4 ${libraryItem ? "fill-primary text-primary" : ""}`} />
                  {libraryItem ? "In Library" : "Add to Library"}
                </Button>
              ) : (
                <Link to="/auth">
                  <Button size="lg" variant="outline"><Bookmark className="mr-2 h-4 w-4" />Add to Library</Button>
                </Link>
              )}
              <Button size="lg" variant="ghost" onClick={handleShare}><Share2 className="mr-2 h-4 w-4" />Share</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Tabs defaultValue="chapters">
          <TabsList>
            <TabsTrigger value="chapters">Chapters</TabsTrigger>
            <TabsTrigger value="credits">Credits & Collabs</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="chapters" className="mt-6">
            {chaptersLoading ? (
              <ChapterListSkeleton />
            ) : chapters.length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">
                No chapters published yet.
              </Card>
            ) : (
              <Card className="divide-y">
                {chapters.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-10 font-mono text-xs text-muted-foreground">#{c.chapter_number}</span>
                      <Link
                        to="/read"
                        search={{ novelId: novel.id, chapterId: c.id }}
                        className="font-serif hover:text-primary transition-colors"
                      >
                        {c.title}
                      </Link>
                      {c.status !== "published" && (
                        <Badge variant={c.status === "rejected" ? "destructive" : "secondary"} className="text-[10px] uppercase h-5">
                          {c.status}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{c.word_count.toLocaleString()} words</span>
                      {user && (user.id === novel.author_id || isCoAuthor || isAdmin) && (
                        <Button
                          variant="ghost"
                          className="h-7 px-2 text-xs flex items-center gap-1 hover:text-primary"
                          onClick={() => handleEditChapterClick(c)}
                        >
                          <Edit className="h-3 w-3" /> Edit
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </Card>
            )}
          </TabsContent>

          <TabsContent value="credits" className="mt-6 space-y-4">
            <Card className="p-5">
              <h3 className="font-serif text-lg font-semibold mb-4">Project Credits</h3>
              <div className="space-y-4">
                <Link
                  to="/profile/$userId"
                  params={{ userId: novel.author_id }}
                  className="flex items-center gap-3 hover:opacity-85 transition-opacity"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{novel.author?.display_name?.slice(0, 2).toUpperCase() || "A"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium hover:text-primary transition-colors">{novel.author?.display_name || "Unknown Author"}</div>
                    <Badge variant="outline" className="text-xs uppercase">Original Author</Badge>
                  </div>
                </Link>

                {collaborators.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic pt-2">No other collaborators are credited on this project yet.</p>
                ) : (
                  collaborators.map((col) => (
                    <Link
                      key={col.id}
                      to="/profile/$userId"
                      params={{ userId: col.user_id }}
                      className="flex items-center gap-3 hover:opacity-85 transition-opacity"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{col.user?.display_name?.slice(0, 2).toUpperCase() || "?"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium hover:text-primary transition-colors">{col.user?.display_name || "Unknown Collaborator"}</div>
                        <Badge variant="secondary" className="text-xs uppercase">{col.role}</Badge>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6 space-y-4">
            {user && <ReviewForm novelId={novel.id} />}
            {reviews.length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">
                No reviews yet. Write the first review!
              </Card>
            ) : (
              reviews.map((r) => (
                <Card key={r.id} className="p-5">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {r.user?.display_name?.slice(0, 2).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <Link to="/profile/$userId" params={{ userId: r.user_id }} className="font-medium hover:text-primary transition-colors">
                          {r.user?.display_name || "Anonymous"}
                        </Link>
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < r.rating ? "fill-primary text-primary" : "text-muted-foreground/20"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{r.content}</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="about" className="mt-6">
            <Card className="p-6 text-sm leading-relaxed text-muted-foreground">
              <p>{novel.synopsis}</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <WriteChapterDialog
        novelId={novel.id}
        novelTitle={novel.title}
        nextChapterNumber={nextChapterNumber}
        open={writeOpen}
        onOpenChange={setWriteOpen}
      />

      <EditChapterDialog
        chapter={selectedChapter}
        novelTitle={novel.title}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <NovelSettingsDialog
        novel={novel}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </div>
  );
}

