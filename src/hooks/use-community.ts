import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";

export function useCommunities() {
  return useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communities")
        .select("*, community_members(count)");
      if (error) throw error;
      return data;
    },
  });
}

export function useCommunityPosts(communityId?: string) {
  return useQuery({
    queryKey: ["community-posts", communityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_posts")
        .select("*, user:profiles!user_id(display_name, avatar_url)")
        .eq("community_id", communityId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!communityId,
  });
}

export function useIsMember(communityId?: string) {
  const { user } = useSession();
  return useQuery({
    queryKey: ["is-member", communityId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_members")
        .select("*")
        .eq("community_id", communityId)
        .eq("user_id", user?.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!communityId && !!user?.id,
  });
}

export function useToggleMembership() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ communityId }: { communityId: string }) => {
      if (!user) throw new Error("Must be logged in");

      const { data: existing } = await supabase
        .from("community_members")
        .select("*")
        .eq("community_id", communityId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("community_members")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
        return { action: "left" as const, communityId };
      } else {
        const { data, error } = await supabase
          .from("community_members")
          .insert({ community_id: communityId, user_id: user.id })
          .select()
          .single();
        if (error) throw error;
        return { action: "joined" as const, data };
      }
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      queryClient.invalidateQueries({ queryKey: ["my-communities"] });
      queryClient.invalidateQueries({ queryKey: ["is-member", res.communityId || (res as any).data?.community_id, user?.id] });
      if (res.action === "joined") {
        toast.success("Joined community!");
      } else {
        toast.success("Left community!");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (post: { community_id: string; user_id: string; content: string; parent_id?: string }) => {
      const { data, error } = await supabase.from("community_posts").insert(post).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["community-posts", data.community_id] });
      toast.success("Post shared!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      const { error } = await supabase.from("community_posts").delete().eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-community-posts"] });
      toast.success("Post deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useCreateCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (community: { name: string; description: string; created_by: string; tags?: string[] }) => {
      // First insert community
      const { data: newComm, error: commError } = await supabase
        .from("communities")
        .insert(community)
        .select()
        .single();
      if (commError) throw commError;

      // Auto-join creator as member
      const { error: joinError } = await supabase
        .from("community_members")
        .insert({ community_id: newComm.id, user_id: community.created_by });
      if (joinError) throw joinError;

      return newComm;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      toast.success("Community created!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useMyCommunities() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["my-communities", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_members")
        .select("community_id, communities(*)")
        .eq("user_id", user?.id);
      
      if (error) throw error;
      
      return data.map((d: any) => d.communities).filter(Boolean);
    },
    enabled: !!user?.id,
  });
}
