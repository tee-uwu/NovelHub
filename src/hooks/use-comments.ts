import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useComments(chapterId?: string) {
  return useQuery({
    queryKey: ["comments", chapterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*, user:profiles!user_id(display_name, avatar_url)")
        .eq("chapter_id", chapterId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!chapterId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (comment: {
      chapter_id: string;
      user_id: string;
      content: string;
      parent_id?: string;
    }) => {
      const { data, error } = await supabase.from("comments").insert(comment).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["comments", data.chapter_id] });
      toast.success("Comment posted!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
