import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";

// Fetch pending reports for admin
export function useReports() {
  const { user } = useSession();
  
  return useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select(`
          *,
          reporter:profiles!reports_reporter_id_fkey(display_name, avatar_url, role),
          reported:profiles!reports_reported_id_fkey(display_name, avatar_url, role)
        `)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      return data;
    },
    enabled: !!user, // Admin check is done via RLS and UI
  });
}

// Create a new report
export function useCreateReport() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ reportedId, reason }: { reportedId: string; reason: string }) => {
      const { data, error } = await supabase
        .from("reports")
        .insert({ reported_id: reportedId, reason, reporter_id: (await supabase.auth.getUser()).data.user?.id })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate just in case, though usually only admins see it
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      toast.success("Report submitted successfully. Thank you.");
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error("You already have a pending report for this user.");
      } else {
        toast.error(error.message || "Failed to submit report.");
      }
    },
  });
}

// Update report status (admin only)
export function useUpdateReportStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string; status: 'resolved' | 'dismissed' }) => {
      const { error } = await supabase
        .from("reports")
        .update({ status })
        .eq("id", reportId);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      toast.success("Report status updated.");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update report status.");
    },
  });
}
