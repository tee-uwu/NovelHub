import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";

export function useWorkspaceTasks(novelId: string) {
  return useQuery({
    queryKey: ["workspace-tasks", novelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspace_tasks")
        .select(`
          *,
          assignee:profiles!assignee_id(display_name, avatar_url),
          creator:profiles!creator_id(display_name, avatar_url)
        `)
        .eq("novel_id", novelId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!novelId,
  });
}

export function useCreateWorkspaceTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (task: { novel_id: string; assignee_id?: string; title: string; description?: string; creator_id: string }) => {
      const { data, error } = await supabase.from("workspace_tasks").insert(task).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["workspace-tasks", data.novel_id] });
      toast.success("Task created!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateWorkspaceTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, novel_id, status }: { id: string; novel_id: string; status: "pending" | "in_progress" | "completed" }) => {
      const { data, error } = await supabase.from("workspace_tasks").update({ status }).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["workspace-tasks", data.novel_id] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useWorkspaceMessages(novelId: string) {
  return useQuery({
    queryKey: ["workspace-messages", novelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspace_messages")
        .select(`
          *,
          sender:profiles!sender_id(display_name, avatar_url, role)
        `)
        .eq("novel_id", novelId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!novelId,
  });
}

export function useSendWorkspaceMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (msg: { novel_id: string; sender_id: string; content: string }) => {
      const { data, error } = await supabase.from("workspace_messages").insert(msg).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["workspace-messages", data.novel_id] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useCollaborators(novelId: string) {
  return useQuery({
    queryKey: ["collaborators", novelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collaborations")
        .select(`
          *,
          user:profiles!user_id(display_name, avatar_url, role)
        `)
        .eq("novel_id", novelId);

      if (error) throw error;
      return data;
    },
    enabled: !!novelId,
  });
}

export function useAddCollaborator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (collab: { novel_id: string; user_id: string; role: string }) => {
      const { data, error } = await supabase.from("collaborations").insert(collab).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["collaborators", data.novel_id] });
      toast.success("Collaborator added!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useRemoveCollaborator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ novel_id, user_id, author_id, is_leaving }: { novel_id: string; user_id: string; author_id?: string; is_leaving?: boolean }) => {
      const { error } = await supabase.from("collaborations").delete().match({ novel_id, user_id });
      if (error) throw error;
      
      if (!is_leaving && author_id) {
         const { data: n } = await supabase.from("novels").select("title").eq("id", novel_id).single();
         await supabase.from("notifications").insert({
           user_id: user_id,
           type: 'system',
           title: 'Workspace Access Revoked',
           message: `You have been removed from the workspace for "${n?.title || 'Unknown Novel'}".`,
           actor_id: author_id
         });
      } else if (is_leaving && author_id) {
         const { data: n } = await supabase.from("novels").select("title").eq("id", novel_id).single();
         await supabase.from("notifications").insert({
           user_id: author_id,
           type: 'system',
           title: 'Collaborator Left',
           message: `A team member has left the workspace for "${n?.title || 'Unknown Novel'}".`,
           actor_id: user_id
         });
      }

      return novel_id;
    },
    onSuccess: (novelId) => {
      queryClient.invalidateQueries({ queryKey: ["collaborators", novelId] });
      toast.success("Collaborator removed.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateCollaboratorStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ novel_id, user_id, status, notification_id }: { novel_id: string; user_id: string; status: 'accepted' | 'declined'; notification_id?: string }) => {
      if (status === 'declined') {
        const { error } = await supabase.from("collaborations").delete().match({ novel_id, user_id });
        if (error) throw error;
        if (notification_id) {
          await supabase.from("notifications").update({ message: "You have declined the invitation.", is_read: true }).eq("id", notification_id);
        }
      } else {
        const { error } = await supabase.from("collaborations").update({ status }).match({ novel_id, user_id });
        if (error) throw error;
        if (notification_id) {
          await supabase.from("notifications").update({ message: "You have accepted the invitation.", is_read: true }).eq("id", notification_id);
        }
      }
      return novel_id;
    },
    onSuccess: (novelId) => {
      queryClient.invalidateQueries({ queryKey: ["collaborators", novelId] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
