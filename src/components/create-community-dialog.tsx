import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCreateCommunity } from "@/hooks/use-community";
import { useSession } from "@/hooks/use-session";

const allTags = ["Fantasy", "Sci-Fi", "Romance", "Mystery", "Action", "Drama", "Isekai", "Slice of Life"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateCommunityDialog({ open, onOpenChange }: Props) {
  const { user } = useSession();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const createCommunity = useCreateCommunity();

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !name.trim()) return;
    createCommunity.mutate(
      { name: name.trim(), description: description.trim(), created_by: user.id, tags },
      {
        onSuccess: () => {
          setName("");
          setDescription("");
          setTags([]);
          onOpenChange(false);
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Create Community</DialogTitle>
          <DialogDescription>Start a community around your favorite genre or novel.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Community Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fantasy Novel Lovers" className="mt-1.5" required />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this community about?" className="mt-1.5" />
          </div>
          <div>
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
          <Button type="submit" className="w-full" disabled={createCommunity.isPending}>
            {createCommunity.isPending ? "Creating…" : "Create Community"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
