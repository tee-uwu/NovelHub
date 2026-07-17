import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useReviews(novelId?: string) {
  return useQuery({
    queryKey: ["reviews", novelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, user:profiles!user_id(display_name, avatar_url)")
        .eq("novel_id", novelId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!novelId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (review: {
      novel_id: string;
      user_id: string;
      rating: number;
      content: string;
    }) => {
      const { data, error } = await supabase.from("reviews").insert(review).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", data.novel_id] });
      queryClient.invalidateQueries({ queryKey: ["novel", data.novel_id] });
      toast.success("Review posted!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
