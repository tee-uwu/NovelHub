import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";

export function useCollabAds(options?: { role?: string; search?: string }) {
  return useQuery({
    queryKey: ["collab-ads", options],
    queryFn: async () => {
      let query = supabase
        .from("collab_ads")
        .select("*, author:profiles!author_id(display_name, avatar_url), novel:novels(title, slug)")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (options?.role && options.role !== "Trending") {
        query = query.eq("role_needed", options.role.toLowerCase());
      }
      if (options?.search) {
        query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useMyAds() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["my-collab-ads", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collab_ads")
        .select("*, novel:novels(title, slug)")
        .eq("author_id", user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useAdApplications(adId?: string) {
  return useQuery({
    queryKey: ["ad-applications", adId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collab_applications")
        .select("*, user:profiles!user_id(display_name, avatar_url, role)")
        .eq("ad_id", adId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!adId,
  });
}

export function useApplyToAd() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (application: { ad_id: string; message: string }) => {
      if (!user) throw new Error("Must be logged in");

      const { data, error } = await supabase
        .from("collab_applications")
        .insert({
          ad_id: application.ad_id,
          user_id: user.id,
          message: application.message,
          status: "pending",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ad-applications", data.ad_id] });
      toast.success("Application submitted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to apply");
    },
  });
}

export function useCreateCollabAd() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ad: {
      novel_id: string | null;
      title: string;
      description: string;
      role_needed: "author" | "illustrator" | "editor";
      payment_type: string;
      payment_amount: string | null;
    }) => {
      if (!user) throw new Error("Must be logged in");

      const { data, error } = await supabase
        .from("collab_ads")
        .insert({
          author_id: user.id,
          novel_id: ad.novel_id,
          title: ad.title,
          description: ad.description,
          role_needed: ad.role_needed,
          payment_type: ad.payment_type,
          payment_amount: ad.payment_amount,
          status: "open",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collab-ads"] });
      queryClient.invalidateQueries({ queryKey: ["my-collab-ads", user?.id] });
      toast.success("Collaboration ad posted!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateCollabAd() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ad: {
      id: string;
      title?: string;
      description?: string;
      role_needed?: "author" | "illustrator" | "editor";
      payment_type?: string;
      payment_amount?: string | null;
      status?: string;
    }) => {
      const { data, error } = await supabase
        .from("collab_ads")
        .update(ad)
        .eq("id", ad.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collab-ads"] });
      queryClient.invalidateQueries({ queryKey: ["my-collab-ads", user?.id] });
      toast.success("Ad updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useAcceptCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ adId, userId, novelId, role }: { adId: string; userId: string; novelId: string; role: "reader" | "author" | "illustrator" | "editor" | "admin" }) => {
      // 1. Add user as collaborator
      const { error: collabError } = await supabase
        .from("collaborations")
        .insert({
          novel_id: novelId,
          user_id: userId,
          role,
        });
      if (collabError) throw collabError;

      // 2. Set application status to accepted
      const { error: appError } = await supabase
        .from("collab_applications")
        .update({ status: "accepted" })
        .eq("ad_id", adId)
        .eq("user_id", userId);
      if (appError) throw appError;

      // 3. Mark ad as filled
      const { error: adError } = await supabase
        .from("collab_ads")
        .update({ status: "filled" })
        .eq("id", adId);
      if (adError) throw adError;

      return { adId, novelId };
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["ad-applications", res.adId] });
      queryClient.invalidateQueries({ queryKey: ["collab-ads"] });
      queryClient.invalidateQueries({ queryKey: ["novel-collaborators", res.novelId] });
      toast.success("Collaborator added to project!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to accept candidate");
    },
  });
}

export function useNovelCollaborators(novelId?: string) {
  return useQuery({
    queryKey: ["novel-collaborators", novelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collaborations")
        .select("*, user:profiles!user_id(display_name, avatar_url)")
        .eq("novel_id", novelId);
      if (error) throw error;
      return data;
    },
    enabled: !!novelId,
  });
}
