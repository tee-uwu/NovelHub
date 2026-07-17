import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";

export function useLibrary() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["library", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("library_items")
        .select("*, novel:novels!novel_id(*, author:profiles!author_id(display_name))")
        .eq("user_id", user?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useLibraryItem(novelId?: string) {
  const { user } = useSession();
  return useQuery({
    queryKey: ["library-item", novelId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("library_items")
        .select("*")
        .eq("user_id", user?.id)
        .eq("novel_id", novelId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!novelId && !!user?.id,
  });
}

export function useToggleLibrary() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ novelId, status = "saved" }: { novelId: string; status?: "reading" | "saved" | "finished" }) => {
      if (!user) throw new Error("Must be logged in");

      // Check if already in library
      const { data: existing } = await supabase
        .from("library_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("novel_id", novelId)
        .maybeSingle();

      if (existing) {
        // Remove it
        const { error } = await supabase
          .from("library_items")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
        return { action: "removed" as const, novelId };
      } else {
        // Add it
        const { data, error } = await supabase
          .from("library_items")
          .insert({
            user_id: user.id,
            novel_id: novelId,
            status,
            current_chapter: 0,
            progress: 0
          })
          .select()
          .single();
        if (error) throw error;
        return { action: "added" as const, data };
      }
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["library", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["library-item", res.novelId || (res as any).data?.novel_id, user?.id] });
      if (res.action === "added") {
        toast.success("Added to library!");
      } else {
        toast.success("Removed from library!");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateProgress() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ novelId, current_chapter, progress }: { novelId: string; current_chapter: number; progress: number }) => {
      if (!user) throw new Error("Must be logged in");

      const { data, error } = await supabase
        .from("library_items")
        .upsert({
          user_id: user.id,
          novel_id: novelId,
          current_chapter,
          progress,
          status: progress >= 100 ? "finished" : "reading"
        }, { onConflict: "user_id,novel_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["library", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["library-item", data.novel_id, user?.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
