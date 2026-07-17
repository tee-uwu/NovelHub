import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";
import { useSession } from "@/hooks/use-session";
import { useNovelById } from "@/hooks/use-novels";
import { useChapters } from "@/hooks/use-chapters";
import { WriteChapterDialog, EditChapterDialog } from "../novel.$novelId";
import { 
  useWorkspaceTasks, 
  useCreateWorkspaceTask, 
  useUpdateWorkspaceTask, 
  useWorkspaceMessages, 
  useSendWorkspaceMessage,
  useCollaborators,
  useAddCollaborator,
  useRemoveCollaborator,
  useUpdateCollaboratorStatus
} from "@/hooks/use-workspace";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Send, MoreVertical, X, LayoutDashboard, MessageSquare, BookOpen, Edit, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/workspace/$novelId")({
  component: WorkspacePage,
});

function WorkspacePage() {
  const { novelId } = Route.useParams();
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  
  const { data: novel, isLoading: novelLoading } = useNovelById(novelId);
  const actualNovelId = novel?.id || novelId;

  const { data: tasks } = useWorkspaceTasks(actualNovelId);
  const { data: messages } = useWorkspaceMessages(actualNovelId);
  const { data: collabs } = useCollaborators(actualNovelId);

  const createTask = useCreateWorkspaceTask();
  const updateTask = useUpdateWorkspaceTask();
  const sendMessage = useSendWorkspaceMessage();
  const addCollab = useAddCollaborator();
  const removeCollab = useRemoveCollaborator();
  const updateStatus = useUpdateCollaboratorStatus();

  const [activeTab, setActiveTab] = useState<"kanban" | "chat" | "team" | "chapters">("kanban");
  
  // Task State
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>("unassigned");

  // Chat State
  const [msgContent, setMsgContent] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Collab State
  const [newCollabName, setNewCollabName] = useState("");
  const [newCollabRole, setNewCollabRole] = useState("editor");

  // Chapter State
  const { data: chapters, isLoading: chaptersLoading } = useChapters(novelId);
  const [showWriteDialog, setShowWriteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<any>(null);

  useEffect(() => {
    if (activeTab === "chat" && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  if (novelLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!novel || !actualNovelId) {
    return <div className="p-8 text-center">Novel not found</div>;
  }

  const isAuthor = novel.author_id === user?.id;
  const myCollab = collabs?.find(c => c.user_id === user?.id);
  const isAcceptedCollab = myCollab?.status === 'accepted';
  const isPendingCollab = myCollab?.status === 'pending';

  if (!isAuthor && !isAcceptedCollab) {
    if (isPendingCollab) {
      return (
        <div className="min-h-screen flex flex-col bg-muted/20">
          <TopNav />
          <div className="flex-1 flex items-center justify-center p-8">
            <Card className="max-w-md w-full p-6 text-center space-y-6">
              <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-bold tracking-tight">Workspace Invitation</h2>
                <p className="text-muted-foreground mt-2">
                  You have been invited to collaborate on <span className="font-semibold text-foreground">{novel.title}</span> as a <span className="capitalize font-semibold text-foreground">{myCollab.role}</span>.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button 
                  size="lg" 
                  disabled={updateStatus.isPending}
                  onClick={() => updateStatus.mutate({ novel_id: actualNovelId, user_id: user!.id, status: 'accepted' })}
                >
                  {updateStatus.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Accept Invitation
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  disabled={updateStatus.isPending}
                  onClick={() => {
                    updateStatus.mutate({ novel_id: actualNovelId, user_id: user!.id, status: 'declined' }, {
                      onSuccess: () => navigate({ to: "/" })
                    })
                  }}
                >
                  Decline
                </Button>
              </div>
            </Card>
          </div>
        </div>
      );
    }
    return <div className="p-8 text-center">You do not have access to this workspace.</div>;
  }

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    createTask.mutate({
      novel_id: actualNovelId,
      title: newTaskTitle.trim(),
      creator_id: user.id,
      assignee_id: newTaskAssignee === "unassigned" ? undefined : newTaskAssignee,
    }, {
      onSuccess: () => {
        setNewTaskTitle("");
        setNewTaskAssignee("unassigned");
      }
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgContent.trim()) return;
    sendMessage.mutate({
      novel_id: actualNovelId,
      sender_id: user.id,
      content: msgContent.trim()
    }, {
      onSuccess: () => setMsgContent("")
    });
  };

  const handleAddCollab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollabName.trim()) return;
    
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("id")
      .ilike("display_name", newCollabName.trim())
      .maybeSingle();

    if (!userProfile) {
      toast.error("User not found");
      return;
    }

    addCollab.mutate({
      novel_id: actualNovelId,
      user_id: userProfile.id,
      role: newCollabRole
    }, {
      onSuccess: () => setNewCollabName("")
    });
  };

  const pendingTasks = tasks?.filter(t => t.status === "pending") || [];
  const inProgressTasks = tasks?.filter(t => t.status === "in_progress") || [];
  const completedTasks = tasks?.filter(t => t.status === "completed") || [];

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <TopNav />
      
      <div className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 grid grid-cols-3 items-center">
          <div className="flex items-center gap-4">
            <Link to={`/novel/${novel.slug}`} className="font-serif font-bold text-xl hover:text-primary transition-colors truncate">
              {novel.title}
            </Link>
            <Badge variant="outline">Workspace</Badge>
          </div>
          <div className="flex bg-muted p-1 rounded-md justify-self-center">
            <button
              onClick={() => setActiveTab("kanban")}
              className={`px-3 py-1 text-sm font-medium rounded-sm transition-colors ${activeTab === "kanban" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Tasks
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-3 py-1 text-sm font-medium rounded-sm transition-colors ${activeTab === "chat" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Team Chat
            </button>
            <button
              onClick={() => setActiveTab("team")}
              className={`px-3 py-1 text-sm font-medium rounded-sm transition-colors ${activeTab === "team" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Team
            </button>
            <button
              onClick={() => setActiveTab("chapters")}
              className={`px-3 py-1 text-sm font-medium rounded-sm transition-colors ${activeTab === "chapters" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Chapters
            </button>
          </div>
          <div className="flex justify-end">
            {!isAuthor && isAcceptedCollab && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground" 
                onClick={() => {
                  if (confirm("Are you sure you want to leave this workspace?")) {
                    updateStatus.mutate({ novel_id: actualNovelId, user_id: user!.id, status: 'declined' }, {
                      onSuccess: () => navigate({ to: "/" })
                    });
                  }
                }}
              >
                <LogOut className="h-4 w-4 mr-2" /> Leave
              </Button>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-full py-6">
          
          {activeTab === "kanban" && (
            <div className="h-full flex flex-col gap-6">
              <form onSubmit={handleCreateTask} className="flex gap-3 bg-background p-4 rounded-lg border shadow-sm">
                <Input 
                  placeholder="What needs to be done?" 
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  className="flex-1"
                />
                <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    <SelectItem value={novel.author_id}>Author (You)</SelectItem>
                    {collabs?.map(c => (
                      <SelectItem key={c.user_id} value={c.user_id}>{c.user.display_name || 'Anonymous'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={createTask.isPending}>
                  {createTask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Add Task
                </Button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 items-start">
                {/* Pending Column */}
                <div className="bg-muted/50 rounded-lg p-4 flex flex-col gap-3 min-h-[500px]">
                  <h3 className="font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400" /> Pending ({pendingTasks.length})
                  </h3>
                  {pendingTasks.map(t => (
                    <Card key={t.id} className="p-3 shadow-sm hover:shadow-md transition-shadow">
                      <p className="font-medium text-sm">{t.title}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px]">{t.assignee?.display_name || "Unassigned"}</Badge>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => updateTask.mutate({ id: t.id, novel_id: actualNovelId, status: "in_progress" })}>
                          Start &rarr;
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* In Progress Column */}
                <div className="bg-muted/50 rounded-lg p-4 flex flex-col gap-3 min-h-[500px]">
                  <h3 className="font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> In Progress ({inProgressTasks.length})
                  </h3>
                  {inProgressTasks.map(t => (
                    <Card key={t.id} className="p-3 shadow-sm hover:shadow-md transition-shadow border-blue-200">
                      <p className="font-medium text-sm">{t.title}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px]">{t.assignee?.display_name || "Unassigned"}</Badge>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-green-600" onClick={() => updateTask.mutate({ id: t.id, novel_id: actualNovelId, status: "completed" })}>
                          Complete &rarr;
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Completed Column */}
                <div className="bg-muted/50 rounded-lg p-4 flex flex-col gap-3 min-h-[500px]">
                  <h3 className="font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" /> Completed ({completedTasks.length})
                  </h3>
                  {completedTasks.map(t => (
                    <Card key={t.id} className="p-3 shadow-sm opacity-60 bg-muted">
                      <p className="font-medium text-sm line-through text-muted-foreground">{t.title}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px]">{t.assignee?.display_name || "Unassigned"}</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "chat" && (
            <Card className="h-[calc(100vh-140px)] flex flex-col">
              <div className="p-4 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Team Chat
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages?.map(m => {
                  const isMe = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{m.sender?.display_name?.slice(0,2).toUpperCase() || "?"}</AvatarFallback>
                      </Avatar>
                      <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-xs font-semibold">{m.sender?.display_name || "Anonymous"}</span>
                          <span className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleTimeString()}</span>
                        </div>
                        <div className={`px-4 py-2 rounded-2xl ${isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm"}`}>
                          <p className="text-sm">{m.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
              <div className="p-4 border-t bg-muted/10">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <Input 
                    placeholder="Type a message to the team..." 
                    value={msgContent}
                    onChange={e => setMsgContent(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={sendMessage.isPending || !msgContent.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </Card>
          )}

          {activeTab === "team" && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{novel.author?.display_name || "Author"}</h3>
                    <Badge className="mt-2">Author (Owner)</Badge>
                  </div>
                </div>
              </Card>

              {collabs?.map(c => (
                <Card key={c.id} className="p-6 relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{c.user?.display_name || "Anonymous"}</h3>
                      <Badge variant="outline" className="mt-2 capitalize">{c.role}</Badge>
                    </div>
                    {isAuthor && (
                      <Button variant="ghost" size="icon" onClick={() => { if(confirm("Remove this collaborator?")) removeCollab.mutate({ novel_id: actualNovelId, user_id: c.user_id, author_id: novel.author_id, is_leaving: false })}}>
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                    {!isAuthor && c.user_id === user?.id && (
                      <Button variant="outline" size="sm" className="mt-2 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => { 
                        if(confirm("Are you sure you want to leave this workspace?")) {
                          removeCollab.mutate({ novel_id: actualNovelId, user_id: c.user_id, author_id: novel.author_id, is_leaving: true }, {
                            onSuccess: () => navigate({ to: "/" })
                          });
                        }
                      }}>
                        <LogOut className="h-3 w-3 mr-1" /> Leave
                      </Button>
                    )}
                  </div>
                </Card>
              ))}

              {isAuthor && (
                <Card className="p-6 border-dashed border-2 bg-transparent">
                  <form onSubmit={handleAddCollab} className="flex flex-col gap-3">
                    <h3 className="font-semibold text-sm">Add Team Member</h3>
                    <Input 
                      placeholder="Exact Username" 
                      value={newCollabName}
                      onChange={e => setNewCollabName(e.target.value)}
                    />
                    <Select value={newCollabRole} onValueChange={setNewCollabRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="illustrator">Illustrator</SelectItem>
                        <SelectItem value="author">Co-Author</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="submit" disabled={addCollab.isPending || !newCollabName.trim()}>
                      {addCollab.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Invite User"}
                    </Button>
                  </form>
                </Card>
              )}
            </div>
          )}
            {activeTab === "chapters" && (
              <div className="h-full flex flex-col gap-6 overflow-y-auto pr-2 pb-10">
                <div className="flex justify-between items-center bg-background p-4 rounded-lg border shadow-sm">
                  <div>
                    <h3 className="font-semibold text-lg">Novel Chapters</h3>
                    <p className="text-sm text-muted-foreground">Manage and edit your chapters in real-time.</p>
                  </div>
                  <Button onClick={() => setShowWriteDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New Chapter
                  </Button>
                </div>
                
                {chaptersLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : chapters?.length === 0 ? (
                  <div className="text-center p-12 bg-background border rounded-lg shadow-sm">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium">No chapters yet</h3>
                    <p className="text-muted-foreground mb-4">Start writing your novel!</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {chapters?.map((chapter) => (
                      <Card key={chapter.id} className="p-4 flex items-center justify-between hover:border-primary/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            {chapter.chapter_number}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-serif font-medium">{chapter.title}</h4>
                              {chapter.status !== "published" && (
                                <Badge variant={chapter.status === "rejected" ? "destructive" : "secondary"} className="text-[10px] uppercase h-5">
                                  {chapter.status}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {chapter.word_count || 0} words • Published {new Date(chapter.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedChapter(chapter);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </Button>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
        </div>
      </main>

      <WriteChapterDialog
        novelId={actualNovelId}
        novelTitle={novel.title}
        nextChapterNumber={(chapters?.length || 0) + 1}
        open={showWriteDialog}
        onOpenChange={setShowWriteDialog}
      />

      {selectedChapter && (
        <EditChapterDialog
          chapter={selectedChapter}
          novelTitle={novel.title}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        />
      )}
    </div>
  );
}
