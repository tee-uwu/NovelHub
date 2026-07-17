import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateReview } from "@/hooks/use-reviews";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";

type Props = {
  novelId: string;
  onSubmit?: () => void;
};

export function ReviewForm({ novelId, onSubmit }: Props) {
  const { user } = useSession();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [content, setContent] = useState("");
  const createReview = useCreateReview();

  if (!user) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return toast.error("Please select a rating");
    createReview.mutate(
      { novel_id: novelId, user_id: user!.id, rating, content },
      {
        onSuccess: () => {
          setRating(0);
          setContent("");
          onSubmit?.();
        },
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-5">
      <div>
        <p className="mb-2 text-sm font-medium">Your rating</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`h-6 w-6 ${
                  star <= (hover || rating)
                    ? "fill-primary text-primary"
                    : "text-muted-foreground/30"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your thoughts about this novel…"
        className="min-h-[80px]"
      />
      <Button type="submit" disabled={createReview.isPending}>
        {createReview.isPending ? "Posting…" : "Post Review"}
      </Button>
    </form>
  );
}
