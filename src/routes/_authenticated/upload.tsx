import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { TopNav } from "@/components/top-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookCover } from "@/components/book-cover";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Upload, Image as ImageIcon, Check, Lightbulb, Loader2, Bold, Italic, Underline, Heading1, Heading3, Quote, Minus, Plus } from "lucide-react";
import { useCreateNovel } from "@/hooks/use-novels";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/upload")({ component: UploadPage });

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

const allTags = ["Fantasy", "Adventure", "Romance", "Action", "Mystery", "Original", "Sci-Fi", "Drama", "Isekai", "Slice of Life"];

function Section({ n, title, sub, children }: { n: number; title: string; sub: string; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <div className="mb-5 flex items-start gap-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary font-serif font-bold text-primary-foreground">{n}</div>
        <div>
          <h2 className="font-serif text-xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{sub}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}

function UploadPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const createNovel = useCreateNovel();

  const [title, setTitle] = useState("Your Novel Title");
  
  // Custom genre states
  const [selectedGenreOption, setSelectedGenreOption] = useState("Fantasy");
  const [customGenre, setCustomGenre] = useState("");

  const [desc, setDesc] = useState("");
  const [status, setStatus] = useState<"ongoing" | "completed" | "hiatus">("ongoing");
  const [tags, setTags] = useState<string[]>(["Fantasy", "Original"]);
  
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  
  // First Chapter writing state
  const [firstChapterTitle, setFirstChapterTitle] = useState("Chapter 1: The Beginning");
  const [firstChapterContent, setFirstChapterContent] = useState("");
  const [firstChapterImg1, setFirstChapterImg1] = useState("");
  const [firstChapterImg2, setFirstChapterImg2] = useState("");

  // Collaborators
  const [editorUsername, setEditorUsername] = useState("");
  const [illustratorUsername, setIllustratorUsername] = useState("");

  const insertFormat = (prefix: string, suffix: string = "") => {
    const textarea = document.getElementById("first-ch-content") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const replacement = prefix + (selectedText || "text") + suffix;
    const newValue = text.substring(0, start) + replacement + text.substring(end);
    setFirstChapterContent(newValue);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText || "text").length);
    }, 0);
  };

  const [uploading, setUploading] = useState(false);

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  async function handlePublish(isDraft: boolean) {
    if (!title.trim() || title === "Your Novel Title") {
      return toast.error("Please enter a valid title");
    }
    if (!firstChapterContent.trim()) {
      return toast.error("Please write the content of your first chapter");
    }

    const finalGenre = selectedGenreOption === "custom" ? customGenre.trim() : selectedGenreOption;
    if (!finalGenre) {
      return toast.error("Please select or enter a custom genre");
    }

    setUploading(true);
    let coverUrl = null;

    try {
      if (coverFile) {
        const fileExt = coverFile.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("novel-covers")
          .upload(filePath, coverFile);

        if (uploadError) {
          console.warn("Storage upload error, using fallback cover gradient:", uploadError.message);
        } else {
          const { data } = supabase.storage.from("novel-covers").getPublicUrl(filePath);
          coverUrl = data.publicUrl;
        }
      }

      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      createNovel.mutate({
        author_id: user.id,
        title: title.trim(),
        slug,
        synopsis: desc.trim(),
        genre: finalGenre,
        tags,
        status: isDraft ? "draft" : status,
        cover_url: coverUrl,
      }, {
        onSuccess: async (newNovel) => {
          // If first chapter content is provided, create it!
          if (firstChapterContent.trim()) {
            const wordCount = firstChapterContent.trim().split(/\s+/).filter(Boolean).length;
            const images: string[] = [];
            if (firstChapterImg1.trim()) images.push(firstChapterImg1.trim());
            if (firstChapterImg2.trim()) images.push(firstChapterImg2.trim());

            const { error: chError } = await supabase
              .from("chapters")
              .insert({
                novel_id: newNovel.id,
                chapter_number: 1,
                title: firstChapterTitle.trim() || "Chapter 1: The Beginning",
                content: firstChapterContent.trim(),
                word_count: wordCount,
                featured_images: images
              });
            if (chError) {
              console.error("Failed to insert first chapter:", chError.message);
              toast.error("Novel created, but failed to save first chapter. You can write it from the dashboard.");
            }
          }

          // Add Collaborators if any
          const usernames = [
            { name: editorUsername.trim(), role: 'editor' },
            { name: illustratorUsername.trim(), role: 'illustrator' }
          ].filter(c => c.name);

          for (const collab of usernames) {
            const { data: userProfile } = await supabase
              .from("profiles")
              .select("id")
              .ilike("display_name", collab.name)
              .maybeSingle();

            if (userProfile) {
              await supabase.from("collaborations").insert({
                novel_id: newNovel.id,
                user_id: userProfile.id,
                role: collab.role
              });
            } else {
              toast.error(`Could not find a user named "${collab.name}" to add as ${collab.role}. You can add them later in the Workspace.`);
            }
          }

          setUploading(false);
          if (isDraft) {
            navigate({ to: "/dashboard" });
          } else {
            navigate({ to: `/novel/${slug}` });
          }
        },
        onError: () => {
          setUploading(false);
        }
      });
    } catch (err: any) {
      setUploading(false);
      toast.error(err.message || "An unexpected error occurred");
    }
  }

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <header className="mb-8">
          <h1 className="font-serif text-4xl font-semibold tracking-tight">Upload Your Novel</h1>
          <p className="mt-1 text-sm text-muted-foreground">Share your story with the world in just a few simple steps.</p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <Section n={1} title="Basic Information" sub="Enter the essential details about your novel">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Novel Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter your novel title" className="mt-1.5" />
                </div>
                <div>
                  <Label>Author Name</Label>
                  <Input value={user.email?.split("@")[0] || ""} disabled className="mt-1.5 opacity-60" />
                </div>
                <div>
                  <Label>Genre</Label>
                  <Select value={selectedGenreOption} onValueChange={setSelectedGenreOption}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Fantasy", "Sci-Fi", "Romance", "Mystery", "Action", "Drama", "Isekai"].map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                      <SelectItem value="custom">Custom Genre...</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedGenreOption === "custom" && (
                    <div className="mt-2.5">
                      <Label>Custom Genre Name</Label>
                      <Input
                        value={customGenre}
                        onChange={(e) => setCustomGenre(e.target.value)}
                        placeholder="e.g. Xianxia, LitRPG, Cyberpunk..."
                        className="mt-1"
                        required
                      />
                    </div>
                  )}
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="hiatus">Hiatus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Write a compelling description for your novel…" className="mt-1.5 min-h-[110px]" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Tags</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {allTags.map((t) => (
                      <Badge
                        key={t}
                        variant={tags.includes(t) ? "default" : "outline"}
                        className="cursor-pointer px-3 py-1"
                        onClick={() => toggleTag(t)}
                      >
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-1">
                  <Label>Editor Username (Optional)</Label>
                  <Input value={editorUsername} onChange={(e) => setEditorUsername(e.target.value)} placeholder="Username of editor" className="mt-1.5" />
                  <p className="text-[10px] text-muted-foreground mt-1">Leave blank if none. You can also add Co-Authors in the Workspace later.</p>
                </div>
                <div className="sm:col-span-1">
                  <Label>Illustrator Username (Optional)</Label>
                  <Input value={illustratorUsername} onChange={(e) => setIllustratorUsername(e.target.value)} placeholder="Username of illustrator" className="mt-1.5" />
                </div>
              </div>
            </Section>

            <Section n={2} title="Write First Chapter" sub="Draft your introduction or first episode to get approved">
              <div className="space-y-4">
                <div>
                  <Label>Chapter Title</Label>
                  <Input value={firstChapterTitle} onChange={(e) => setFirstChapterTitle(e.target.value)} placeholder="e.g. Chapter 1: The Awakening" className="mt-1.5" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="first-ch-img1">First Chapter Illustration 1 URL (Optional)</Label>
                    <Input
                      id="first-ch-img1"
                      value={firstChapterImg1}
                      onChange={(e) => setFirstChapterImg1(e.target.value)}
                      placeholder="https://example.com/art1.jpg"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="first-ch-img2">First Chapter Illustration 2 URL (Optional)</Label>
                    <Input
                      id="first-ch-img2"
                      value={firstChapterImg2}
                      onChange={(e) => setFirstChapterImg2(e.target.value)}
                      placeholder="https://example.com/art2.jpg"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded border border-border leading-relaxed">
                  💡 <strong>Free Image Hosting Tip:</strong> Need image links? You can upload illustrations for free on sites like <a href="https://postimages.org" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-primary/80 font-medium">Postimages.org</a> or <a href="https://imgur.com" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-primary/80 font-medium">Imgur.com</a>. Make sure to copy and paste the <strong>"Direct Link"</strong> URL option!
                </p>

                <div>
                  <Label htmlFor="first-ch-content">Chapter Content</Label>
                  <div className="flex flex-col mt-1.5">
                    <FormattingToolbar onFormat={insertFormat} />
                    <Textarea
                      id="first-ch-content"
                      value={firstChapterContent}
                      onChange={(e) => setFirstChapterContent(e.target.value)}
                      placeholder="Start writing the story of your first chapter here..."
                      className="min-h-[350px] font-serif text-[16px] leading-relaxed rounded-t-none"
                    />
                  </div>
                  <div className="mt-2 text-right text-xs text-muted-foreground">
                    Word Count: {firstChapterContent.trim().split(/\s+/).filter(Boolean).length.toLocaleString()} words
                  </div>
                </div>
              </div>
            </Section>
          </div>

          {/* Sidebar Preview */}
          <aside className="space-y-6">
            <Card className="p-5">
              <h3 className="mb-3 text-sm font-semibold">Cover Artwork</h3>
              <div className="space-y-4">
                {coverPreview ? (
                  <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md border shadow-sm">
                    <img src={coverPreview} alt="Preview" className="h-full w-full object-cover" />
                    <button
                      onClick={() => {
                        setCoverFile(null);
                        setCoverPreview(null);
                      }}
                      className="absolute top-2 right-2 rounded-full bg-background/80 p-1.5 text-xs font-semibold hover:bg-background"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex aspect-[2/3] w-full flex-col items-center justify-center rounded-md border border-dashed bg-muted/40 p-4 text-center">
                    <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground">Upload JPG or PNG. 2:3 aspect ratio recommended.</p>
                  </div>
                )}
                <div className="relative">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                  <Button variant="outline" className="w-full">
                    <Upload className="mr-2 h-4 w-4" /> Upload Cover Image
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="mb-3 text-sm font-semibold">Publish Checklist</h3>
              <div className="space-y-2.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className={`grid h-4 w-4 place-items-center rounded-full text-white ${title.trim() && title !== "Your Novel Title" ? "bg-emerald-500" : "bg-muted"}`}>
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  <span>Title entered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`grid h-4 w-4 place-items-center rounded-full text-white ${desc.trim() ? "bg-emerald-500" : "bg-muted"}`}>
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  <span>Synopsis provided</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`grid h-4 w-4 place-items-center rounded-full text-white ${firstChapterContent.trim() ? "bg-emerald-500" : "bg-muted"}`}>
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  <span>First chapter written</span>
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <Button onClick={() => handlePublish(false)} className="w-full animate-fade-in" disabled={uploading}>
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Publish to Moderation
                </Button>
                <Button onClick={() => handlePublish(true)} variant="outline" className="w-full text-muted-foreground" disabled={uploading}>
                  Save Draft
                </Button>
              </div>
            </Card>

            <Card className="bg-primary/5 p-4 border border-primary/10">
              <div className="flex gap-2">
                <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-primary">Moderation Rule</p>
                  <p className="leading-relaxed text-muted-foreground">Novels are sent to the admin queue. Once approved, they appear on the discover feed!</p>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
