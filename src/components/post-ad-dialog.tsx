import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useCreateCollabAd, useUpdateCollabAd } from "@/hooks/use-collab";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adToEdit?: any | null; // Optional ad to edit
};

export function PostAdDialog({ open, onOpenChange, adToEdit }: Props) {
  const { user } = useSession();
  const createAd = useCreateCollabAd();
  const updateAd = useUpdateCollabAd();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [roleNeeded, setRoleNeeded] = useState<"author" | "illustrator" | "editor">("illustrator");
  const [selectedNovelId, setSelectedNovelId] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<string>("volunteer");
  const [paymentAmount, setPaymentAmount] = useState("");

  // Sync state if editing
  useEffect(() => {
    if (adToEdit && open) {
      setTitle(adToEdit.title);
      setDescription(adToEdit.description);
      setRoleNeeded(adToEdit.role_needed);
      setSelectedNovelId(adToEdit.novel_id);
      setPaymentType(adToEdit.payment_type || "volunteer");
      setPaymentAmount(adToEdit.payment_amount || "");
    } else if (open) {
      setTitle("");
      setDescription("");
      setRoleNeeded("illustrator");
      setSelectedNovelId(null);
      setPaymentType("volunteer");
      setPaymentAmount("");
    }
  }, [adToEdit, open]);

  // Fetch author's novels
  const { data: novels = [] } = useQuery({
    queryKey: ["my-novels-select", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("novels")
        .select("id, title")
        .eq("author_id", user?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && open,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const amount = paymentType === "volunteer" ? "Free / Volunteer" : paymentAmount.trim();

    if (adToEdit) {
      updateAd.mutate(
        {
          id: adToEdit.id,
          title: title.trim(),
          description: description.trim(),
          role_needed: roleNeeded,
          novel_id: selectedNovelId,
          payment_type: paymentType,
          payment_amount: amount,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    } else {
      createAd.mutate(
        {
          novel_id: selectedNovelId,
          title: title.trim(),
          description: description.trim(),
          role_needed: roleNeeded,
          payment_type: paymentType,
          payment_amount: amount,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">{adToEdit ? "Edit Collaboration Ad" : "Post Collaboration Ad"}</DialogTitle>
          <DialogDescription>Find creative partners (co-authors, editors, or artists) for your project.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Ad Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Looking for fantasy cover illustrator"
              required
            />
          </div>
          <div>
            <Label>Description & Requirements</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the style, rate, timelines, and expected contributions..."
              className="min-h-[100px]"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Role Needed</Label>
              <Select value={roleNeeded} onValueChange={(val: any) => setRoleNeeded(val)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="illustrator">Illustrator</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="author">Co-Author (Author)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Link to novel (optional)</Label>
              <Select
                value={selectedNovelId || "none"}
                onValueChange={(val) => setSelectedNovelId(val === "none" ? null : val)}
              >
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General project</SelectItem>
                  {novels.map((n) => (
                    <SelectItem key={n.id} value={n.id}>{n.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Payment Type</Label>
              <Select value={paymentType} onValueChange={setPaymentType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="volunteer">Free / Volunteer</SelectItem>
                  <SelectItem value="hourly">Hourly Rate</SelectItem>
                  <SelectItem value="one-time">One-time Budget</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {paymentType !== "volunteer" && (
              <div>
                <Label>Payment Amount</Label>
                <Input
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={paymentType === "hourly" ? "e.g. $20/hr" : "e.g. $150 total"}
                  required
                />
              </div>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={createAd.isPending || updateAd.isPending}>
            {(createAd.isPending || updateAd.isPending) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : adToEdit ? (
              "Save Changes"
            ) : (
              "Post Advertisement"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
