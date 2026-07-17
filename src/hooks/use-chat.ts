import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";

export function useChatRooms() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["chat-rooms", user?.id],
    queryFn: async () => {
      // Get all room IDs we participate in
      const { data: myParticipations, error: partError } = await supabase
        .from("chat_room_participants")
        .select("room_id")
        .eq("user_id", user?.id);
      if (partError) throw partError;

      const roomIds = myParticipations.map(p => p.room_id);
      if (roomIds.length === 0) return [];

      // Get participants for all these rooms
      const { data: rooms, error: roomError } = await supabase
        .from("chat_room_participants")
        .select("room_id, user:profiles(id, display_name, avatar_url)")
        .in("room_id", roomIds)
        .neq("user_id", user?.id); // Get the OTHER person
      
      if (roomError) {
        console.error("useChatRooms roomError:", roomError);
        throw roomError;
      }

      return rooms;
    },
    enabled: !!user?.id,
  });
}

export function useChatMessages(roomId?: string) {
  return useQuery({
    queryKey: ["chat-messages", roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*, sender:profiles!sender_id(display_name, avatar_url)")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!roomId,
    refetchInterval: 2000, // Poll every 2 seconds for mock realtime chat updates
  });
}

export function useSendMessage() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, content }: { roomId: string; content: string }) => {
      if (!user) throw new Error("Must be logged in");

      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          room_id: roomId,
          sender_id: user.id,
          content,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", data.room_id] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send message");
    },
  });
}

export function useGetOrCreateRoom() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user) throw new Error("Must be logged in");

      const { data: roomId, error } = await supabase
        .rpc("get_or_create_chat_room", { other_user_id: otherUserId });

      if (error) throw error;
      return roomId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-rooms", user?.id] });
    },
    onError: (err: any) => {
      console.error("Failed to create room:", err);
      toast.error("Failed to start chat: " + err.message);
    }
  });
}
