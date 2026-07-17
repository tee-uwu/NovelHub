import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send } from "lucide-react";
import { useChatMessages, useSendMessage, useGetOrCreateRoom } from "@/hooks/use-chat";
import { useSession } from "@/hooks/use-session";

type Props = {
  otherUserId: string;
  otherUserName?: string;
  otherUserAvatar?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ChatDialog({ otherUserId, otherUserName, otherUserAvatar, open, onOpenChange }: Props) {
  const { user } = useSession();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [msgContent, setMsgContent] = useState("");
  const getOrCreateRoom = useGetOrCreateRoom();
  const sendMessage = useSendMessage();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get Room ID when opened
  useEffect(() => {
    if (otherUserId && open) {
      setRoomId(null);
      getOrCreateRoom.mutate(otherUserId, {
        onSuccess: (id) => {
          setRoomId(id);
        },
        onError: () => {
          onOpenChange(false);
        }
      });
    }
  }, [otherUserId, open]);

  const { data: messages = [], isLoading: messagesLoading } = useChatMessages(roomId || undefined);

  // Auto scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, roomId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId || !msgContent.trim()) return;

    sendMessage.mutate(
      { roomId, content: msgContent.trim() },
      {
        onSuccess: () => {
          setMsgContent("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md h-[550px] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-3 font-serif">
            <Avatar className="h-9 w-9">
              {otherUserAvatar ? (
                <img src={otherUserAvatar} alt={otherUserName} className="object-cover" />
              ) : (
                <AvatarFallback>{otherUserName?.slice(0, 2).toUpperCase() || "DM"}</AvatarFallback>
              )}
            </Avatar>
            <span>Chat with {otherUserName}</span>
          </DialogTitle>
          <DialogDescription className="hidden">Direct messages workspace chat channel</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 relative">
          {!roomId ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ScrollArea className="h-[380px] p-4">
              <div className="space-y-4">
                {messages.map((m) => {
                  const isMe = m.sender_id === user?.id;
                  const initials = m.sender?.display_name?.slice(0, 2).toUpperCase() || "?";

                  return (
                    <div key={m.id} className={`flex items-start gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className={`flex flex-col max-w-[70%] ${isMe ? "items-end" : ""}`}>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-semibold">{m.sender?.display_name || "Anonymous"}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div
                          className={`mt-1 rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                            isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted text-foreground rounded-tl-none"
                          }`}
                        >
                          {m.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}
        </div>

        <form onSubmit={handleSend} className="p-3 border-t flex gap-2">
          <Input
            value={msgContent}
            onChange={(e) => setMsgContent(e.target.value)}
            placeholder="Type your message..."
            disabled={!roomId}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!roomId || !msgContent.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
