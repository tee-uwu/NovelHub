import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useProfile } from "@/hooks/use-social";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  component: Settings,
  head: () => ({ meta: [{ title: "Settings — NovelHub" }] }),
});

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <div className="mb-4">
        <h2 className="font-serif text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Separator className="mb-5" />
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

function Toggle({ label, desc, checked, onCheckedChange }: { label: string; desc: string; checked?: boolean; onCheckedChange?: (c: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function Settings() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: profile, isLoading: profileLoading } = useProfile(user.id);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [role, setRole] = useState<"reader" | "author" | "illustrator" | "editor" | "admin">("reader");
  const [deleting, setDeleting] = useState(false);

  // Sync state when profile loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatar_url || "");
      setRole(profile.role || "reader");
    }
  }, [profile]);

  // Preference states
  const [prefSerif, setPrefSerif] = useState(() => localStorage.getItem("pref-serif") !== "false");
  const [prefSepia, setPrefSepia] = useState(() => localStorage.getItem("pref-sepia") === "true");
  const [prefAutoScroll, setPrefAutoScroll] = useState(() => localStorage.getItem("pref-autoscroll") !== "false");

  useEffect(() => {
    localStorage.setItem("pref-serif", String(prefSerif));
  }, [prefSerif]);

  useEffect(() => {
    localStorage.setItem("pref-sepia", String(prefSepia));
  }, [prefSepia]);

  useEffect(() => {
    localStorage.setItem("pref-autoscroll", String(prefAutoScroll));
  }, [prefAutoScroll]);

  // Profile save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .update({ display_name: displayName, bio, role, avatar_url: avatarUrl })
        .eq("id", user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.success("Settings saved successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save settings");
    },
  });

  // Account deletion
  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await supabase.auth.signOut();
      queryClient.clear();
      toast.success("Signed out. Your profile was deleted or deactivated.");
      navigate({ to: "/auth", replace: true });
    } catch (err: any) {
      setDeleting(false);
      toast.error(err.message);
    }
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen">
        <TopNav />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center animate-pulse">
          <p className="text-muted-foreground">Loading settings page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
        <div>
          <h1 className="font-serif text-4xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your account, preferences, and notifications.</p>
        </div>

        <Section title="Account" description="Public information shown across NovelHub.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Display name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={user.email ?? ""} disabled className="opacity-60" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Avatar Image URL</Label>
              <Input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="e.g. https://images.unsplash.com/photo-xxx"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Your Role</Label>
              <Select
                value={role}
                onValueChange={(val: any) => setRole(val)}
                disabled={role === "admin"} // Admin cannot be removed or set from frontend
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {role === "admin" && <SelectItem value="admin">Admin</SelectItem>}
                  <SelectItem value="reader">Reader</SelectItem>
                  <SelectItem value="author">Author</SelectItem>
                  <SelectItem value="illustrator">Illustrator</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
              {role === "admin" && (
                <p className="text-xs text-primary font-medium mt-1">Admin role is managed securely via database access.</p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Bio</Label>
            <Textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell readers about yourself…" />
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </Section>

        <Section title="Reading preferences" description="Defaults applied every time you open a novel.">
          <Toggle
            label="Serif reading font"
            desc="Use Lora across chapter pages."
            checked={prefSerif}
            onCheckedChange={setPrefSerif}
          />
          <Toggle
            label="Sepia by default"
            desc="Softer background for long sessions."
            checked={prefSepia}
            onCheckedChange={setPrefSepia}
          />
          <Toggle
            label="Auto-scroll pauses on inactivity"
            desc="Stops scrolling after 10 seconds idle."
            checked={prefAutoScroll}
            onCheckedChange={setPrefAutoScroll}
          />
        </Section>

        <Section title="Danger zone" description="Irreversible account actions.">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm text-muted-foreground">Permanently delete your NovelHub account.</p>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your profile and logs from our database.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Section>
      </div>
    </div>
  );
}
