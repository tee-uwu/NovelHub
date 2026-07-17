import { createFileRoute, Link } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Briefcase, MessageSquare, Plus, Loader2 } from "lucide-react";
import { useCollabAds, useApplyToAd, useAdApplications, useAcceptCandidate } from "@/hooks/use-collab";
import { useSession } from "@/hooks/use-session";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/empty-state";
import { ChatDialog } from "@/components/chat-dialog";
import { Check } from "lucide-react";

interface ManageApplicationsProps {
  ad: any;
  onChatClick: (userId: string, userName: string) => void;
  novelId: string | null;
}

function ManageApplications({ ad, onChatClick, novelId }: ManageApplicationsProps) {
  const { data: apps = [], isLoading } = useAdApplications(ad.id);
  const acceptCandidate = useAcceptCandidate();

  if (isLoading) return <p className="text-xs text-muted-foreground animate-pulse text-center py-2">Loading candidates...</p>;
  if (apps.length === 0) return <p className="text-xs text-muted-foreground italic text-center py-2 border-t mt-4 pt-4">No candidates applied yet.</p>;

  return (
    <div className="mt-4 space-y-2 border-t pt-4">
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

export const Route = createFileRoute("/collab")({
  component: CollabPage,
});

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

function CollabPage() {
  const { user } = useSession();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Modal states
  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<any | null>(null);

  // DM states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatUserId, setChatUserId] = useState<string | null>(null);
  const [chatUserName, setChatUserName] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const { data: ads = [], isLoading } = useCollabAds({
    role: selectedRole || undefined,
    search: debouncedSearch || undefined,
  });

  const handleApplyClick = (ad: any) => {
    setSelectedAd(ad);
    setApplyOpen(true);
  };

  const handleChatClick = (targetId: string, targetName: string) => {
    setChatUserId(targetId);
    setChatUserName(targetName);
    setChatOpen(true);
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <header className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-primary" />
            <div>
              <h1 className="font-serif text-4xl font-semibold tracking-tight">Collaboration Board</h1>
              <p className="text-sm text-muted-foreground">Find authors looking for co-writers, editors, or illustrators.</p>
            </div>
          </div>
          {user && (
            <Link to="/dashboard">
              <Button className="flex items-center gap-1">
                <Plus className="h-4 w-4" /> Post Ad
              </Button>
            </Link>
          )}
        </header>

        {/* Filters */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search collaborations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto justify-start md:justify-end">
            <Button
              size="sm"
              variant={selectedRole === null ? "default" : "outline"}
              onClick={() => setSelectedRole(null)}
            >
              All Roles
            </Button>
            {["Illustrator", "Editor", "Author"].map((role) => (
              <Button
                key={role}
                size="sm"
                variant={selectedRole === role ? "default" : "outline"}
                onClick={() => setSelectedRole(role)}
              >
                {role === "Author" ? "Co-Author" : role}
              </Button>
            ))}
          </div>
        </div>

        {/* Job Listings */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-6 h-36 animate-pulse bg-muted" />
            ))}
          </div>
        ) : ads.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No listings found"
            description="Try adjusting your filters or search keywords."
          />
        ) : (
          <div className="space-y-4">
            {ads.map((ad) => (
              <Card key={ad.id} className="p-6 flex flex-col justify-between hover:border-primary/40 transition-colors">
                <div>
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <h3 className="font-serif text-xl font-semibold leading-tight">{ad.title}</h3>
                      <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-muted-foreground">
                        <span>by {ad.author?.display_name || "Unknown Author"}</span>
                        <span>·</span>
                        <span>{new Date(ad.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="capitalize text-xs">Role: {ad.role_needed}</Badge>
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold">{ad.payment_amount || "Volunteer"}</Badge>
                    </div>
                  </div>
                  {ad.novel && (
                    <p className="text-xs text-primary font-medium mt-2">
                      Linked Project: <Link to="/novel/$novelId" params={{ novelId: ad.novel.slug }} className="underline">{ad.novel.title}</Link>
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-4 leading-relaxed whitespace-pre-wrap">{ad.description}</p>
                </div>
                {user && user.id !== ad.author_id ? (
                  <div className="mt-6 flex gap-2 border-t pt-4 justify-end">
                    <Button size="sm" variant="outline" className="flex items-center gap-1" onClick={() => handleChatClick(ad.author_id, ad.author?.display_name || "")}>
                      <MessageSquare className="h-3.5 w-3.5" /> Chat with Author
                    </Button>
                    <Button size="sm" onClick={() => handleApplyClick(ad)}>
                      Apply for Collaboration
                    </Button>
                  </div>
                ) : !user ? (
                  <div className="mt-6 border-t pt-4 flex justify-end">
                    <Link to="/auth">
                      <Button size="sm" variant="outline">Sign in to Apply</Button>
                    </Link>
                  </div>
                ) : user.id === ad.author_id ? (
                  <ManageApplications 
                    ad={ad} 
                    onChatClick={handleChatClick} 
                    novelId={ad.novel_id} 
                  />
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </div>

      <ApplyModal
        ad={selectedAd}
        open={applyOpen}
        onOpenChange={setApplyOpen}
      />

      <ChatDialog
        otherUserId={chatUserId}
        otherUserName={chatUserName}
        open={chatOpen}
        onOpenChange={setChatOpen}
      />
    </div>
  );
}
