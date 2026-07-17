import { createFileRoute } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Loader2, ArrowLeft } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useChatRooms, useChatMessages, useSendMessage } from "@/hooks/use-chat";
import { useSession } from "@/hooks/use-session";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_authenticated/inbox")({
  component: InboxPage,
  head: () => ({ meta: [{ title: "Inbox Messages — NovelHub" }] }),
});

function InboxPage() {
  const { user } = useSession();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<{ id: string; display_name: string; avatar_url?: string } | null>(null);
  const [msgContent, setMsgContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: rooms = [], isLoading: roomsLoading } = useChatRooms();
  const { data: messages = [], isLoading: messagesLoading } = useChatMessages(selectedRoomId || undefined);
  const sendMessage = useSendMessage();

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedRoomId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId || !msgContent.trim()) return;

    sendMessage.mutate(
      { roomId: selectedRoomId, content: msgContent.trim() },
      {
        onSuccess: () => {
          setMsgContent("");
        },
      }
    );
  };

  const handleSelectRoom = (roomId: string, otherUser: any) => {
    setSelectedRoomId(roomId);
    setSelectedUser(otherUser);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav />
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6 h-[calc(100vh-4rem)] min-h-0">
        
        {/* Conversations List sidebar */}
        <aside className={`w-full md:w-80 shrink-0 flex flex-col border rounded-xl bg-card overflow-hidden shadow-sm ${selectedRoomId ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b">
            <h2 className="font-serif text-xl font-bold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" /> Conversations
            </h2>
          </div>
          <ScrollArea className="flex-1">
            {roomsLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : rooms.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center p-8">No ongoing conversations.</p>
            ) : (
              <div className="p-2 space-y-1">
                {rooms.map((room) => {
                  const otherUser: any = room.user;
                  if (!otherUser) return null;
                  const isSelected = selectedRoomId === room.room_id;
                  const initials = otherUser.display_name?.slice(0, 2).toUpperCase() || "?";

                  return (
                    <button
                      key={room.room_id}
                      onClick={() => handleSelectRoom(room.room_id, otherUser)}
                      className={`flex items-center gap-3 w-full p-3 rounded-lg text-left transition-colors ${
                        isSelected 
                          ? "bg-primary/10 text-primary font-medium" 
                          : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Avatar className="h-10 w-10 border shadow-sm">
                        {otherUser.avatar_url ? (
                          <img src={otherUser.avatar_url} alt={otherUser.display_name} className="object-cover h-full w-full" />
                        ) : (
                          <AvatarFallback>{initials}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-foreground">{otherUser.display_name}</div>
                        <div className="text-xs text-muted-foreground truncate">Click to write a message</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </aside>

        {/* Chat Workspace pane */}
        <main className={`flex-1 flex flex-col border rounded-xl bg-card overflow-hidden shadow-sm ${!selectedRoomId ? "hidden md:flex" : "flex"}`}>
          {selectedRoomId && selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center gap-3 bg-muted/20">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden" 
                  onClick={() => { setSelectedRoomId(null); setSelectedUser(null); }}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-9 w-9 border shadow-sm">
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} alt={selectedUser.display_name} className="object-cover h-full w-full" />
                  ) : (
                    <AvatarFallback>{selectedUser.display_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h3 className="font-serif font-semibold text-sm leading-none text-foreground">{selectedUser.display_name}</h3>
                  <span className="text-[10px] text-muted-foreground">Direct Message Workspace Channel</span>
                </div>
              </div>

              {/* Chat Messages scroll area */}
              <div className="flex-1 min-h-0 relative">
                {messagesLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <ScrollArea className="h-full p-4">
                    <div className="space-y-4">
                      {messages.map((m) => {
                        const isMe = m.sender_id === user?.id;
                        const initials = m.sender?.display_name?.slice(0, 2).toUpperCase() || "?";

                        return (
                          <div key={m.id} className={`flex items-start gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
                            <Avatar className="h-8 w-8 border shadow-sm">
                              {m.sender?.avatar_url ? (
                                <img src={m.sender.avatar_url} alt={m.sender.display_name} className="object-cover h-full w-full" />
                              ) : (
                                <AvatarFallback>{initials}</AvatarFallback>
                              )}
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
                                  isMe 
                                    ? "bg-primary text-primary-foreground rounded-tr-none" 
                                    : "bg-muted text-foreground rounded-tl-none"
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

              {/* Input Area footer */}
              <form onSubmit={handleSend} className="p-4 border-t flex gap-2 bg-muted/20">
                <Input
                  value={msgContent}
                  onChange={(e) => setMsgContent(e.target.value)}
                  placeholder={`Write a message to ${selectedUser.display_name}...`}
                  disabled={!selectedRoomId}
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!selectedRoomId || !msgContent.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <EmptyState 
                icon={MessageSquare}
                title="Your Message Inbox"
                description="Select an ongoing conversation from the sidebar list to check messages or reply to collaborators."
              />
            </div>
          )}
        </main>

      </div>
    </div>
  );
}
