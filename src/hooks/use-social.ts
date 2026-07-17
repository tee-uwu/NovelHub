import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";

export function useToggleLike() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ likeableType, likeableId }: { likeableType: "review" | "comment" | "post"; likeableId: string }) => {
      if (!user) throw new Error("Must be logged in");

      const { data: existing } = await supabase
        .from("likes")
        .select("*")
        .eq("user_id", user.id)
        .eq("likeable_type", likeableType)
        .eq("likeable_id", likeableId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from("likes").delete().eq("id", existing.id);
        if (error) throw error;
        return { action: "unliked" as const, likeableType, likeableId };
      } else {
        const { data, error } = await supabase
          .from("likes")
          .insert({ user_id: user.id, likeable_type: likeableType, likeable_id: likeableId })
          .select()
          .single();
        if (error) throw error;
        return { action: "liked" as const, data };
      }
    },
    onSuccess: (res) => {
      const id = res.likeableId || (res as any).data?.likeable_id;
      const type = res.likeableType || (res as any).data?.likeable_type;
      queryClient.invalidateQueries({ queryKey: ["like-count", type, id] });
      queryClient.invalidateQueries({ queryKey: ["is-liked", type, id, user?.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useLikeCount(type: "review" | "comment" | "post", id?: string) {
  return useQuery({
    queryKey: ["like-count", type, id],
    queryFn: async () => {
      const count = await supabase.rpc("get_like_count", { p_type: type, p_id: id! });
      return count.data ?? 0;
    },
    enabled: !!id,
  });
}

export function useIsLiked(type: "review" | "comment" | "post", id?: string) {
  const { user } = useSession();
  return useQuery({
    queryKey: ["is-liked", type, id, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("likes")
        .select("*")
        .eq("user_id", user?.id)
        .eq("likeable_type", type)
        .eq("likeable_id", id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!id && !!user?.id,
  });
}

export function useToggleFollow() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ followingId }: { followingId: string }) => {
      if (!user) throw new Error("Must be logged in");

      const { data: existing } = await supabase
        .from("follows")
        .select("*")
        .eq("follower_id", user.id)
        .eq("following_id", followingId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from("follows").delete().eq("id", existing.id);
        if (error) throw error;
        return { action: "unfollowed" as const, followingId };
      } else {
        const { data, error } = await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: followingId })
          .select()
          .single();
        if (error) throw error;
        return { action: "followed" as const, data };
      }
    },
    onSuccess: (res) => {
      const id = res.followingId || (res as any).data?.following_id;
      queryClient.invalidateQueries({ queryKey: ["is-following", id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["follower-count", id] });
      queryClient.invalidateQueries({ queryKey: ["following-count", user?.id] });
      if (res.action === "followed") {
        toast.success("Following user");
      } else {
        toast.success("Unfollowed user");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useIsFollowing(userId?: string) {
  const { user } = useSession();
  return useQuery({
    queryKey: ["is-following", userId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("*")
        .eq("follower_id", user?.id)
        .eq("following_id", userId)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!userId && !!user?.id,
  });
}

export function useFollowerCount(userId?: string) {
  return useQuery({
    queryKey: ["follower-count", userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!userId,
  });
}

export function useFollowingCount(userId?: string) {
  return useQuery({
    queryKey: ["following-count", userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!userId,
  });
}

export function useProfile(userId?: string) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
