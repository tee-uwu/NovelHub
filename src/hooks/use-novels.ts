import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useNovels(options?: { genre?: string; featured?: boolean; certified?: boolean; search?: string }) {
  return useQuery({
    queryKey: ["novels", options],
    queryFn: async () => {
      let query = supabase
        .from("novels")
        .select("*, author:profiles!author_id(display_name, avatar_url)")
        .neq("status", "draft")
        .order("view_count", { ascending: false });

      if (options?.genre) query = query.eq("genre", options.genre);
      if (options?.featured) query = query.eq("is_featured", true);
      if (options?.certified) query = query.eq("is_certified", true);
      if (options?.search) query = query.or(`title.ilike.%${options.search}%,synopsis.ilike.%${options.search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useNovel(slug: string) {
  return useQuery({
    queryKey: ["novel", "slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("novels")
        .select("*, author:profiles!author_id(display_name, avatar_url, bio, is_verified)")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      
      // Increment view count in background once per session/browser (using localStorage to prevent refresh abuse)
      if (typeof window !== "undefined") {
        const viewedKey = `viewed-${data.id}`;
        if (!localStorage.getItem(viewedKey)) {
          localStorage.setItem(viewedKey, "true");
          supabase.rpc("increment_view_count", { novel_uuid: data.id }).then();
        }
      }
      
      return data;
    },
    enabled: !!slug,
  });
}

export function useNovelById(id: string) {
  return useQuery({
    queryKey: ["novel", "id", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("novels")
        .select("*, author:profiles!author_id(display_name, avatar_url, bio, is_verified)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateNovel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (novel: {
      author_id: string;
      title: string;
      slug: string;
      synopsis?: string;
      genre?: string;
      tags?: string[];
      status: Database["public"]["Enums"]["novel_status"];
      cover_url?: string | null;
      cover_color?: string | null;
    }) => {
      const { data, error } = await supabase.from("novels").insert(novel).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["novels"] });
      toast.success("Novel submitted for admin approval!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateNovel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; synopsis?: string; genre?: string; tags?: string[]; status?: string; cover_url?: string | null; cover_color?: string | null }) => {
      const { data, error } = await supabase.from("novels").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["novels"] });
      queryClient.invalidateQueries({ queryKey: ["novel", data.slug] });
      toast.success("Novel updated!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
