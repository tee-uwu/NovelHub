import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useChapters(novelId?: string, options?: { status?: string }) {
  return useQuery({
    queryKey: ["chapters", novelId, options?.status],
    queryFn: async () => {
      let query = supabase
        .from("chapters")
        .select("*")
        .eq("novel_id", novelId)
        .order("chapter_number", { ascending: true });
        
      if (options?.status) {
        query = query.eq("status", options.status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!novelId,
  });
}

export function usePublicChapters(novelId?: string) {
  return useChapters(novelId, { status: "published" });
}

export function useChapter(chapterId?: string) {
  return useQuery({
    queryKey: ["chapter", chapterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapters")
        .select("*")
        .eq("id", chapterId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!chapterId,
  });
}

export function useCreateChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (chapter: {
      novel_id: string;
      chapter_number: number;
      title: string;
      content: string;
      word_count?: number;
      featured_images?: string[];
      status?: string;
    }) => {
      const { data, error } = await supabase.from("chapters").insert(chapter).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chapters", data.novel_id] });
      toast.success(data.status === "draft" ? "Chapter saved as draft!" : "Chapter submitted!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
