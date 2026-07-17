import { createFileRoute, Link } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, BookOpen, Heart, MessageCircle, UserPlus, CheckCheck, Loader2 } from "lucide-react";
import { useNotifications, useMarkRead, useMarkAllRead } from "@/hooks/use-notifications";
import { useUpdateCollaboratorStatus } from "@/hooks/use-workspace";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: Notifications,
  head: () => ({ meta: [{ title: "Notifications — NovelHub" }] }),
});

function Notifications() {
  const { data: items = [], isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const updateStatus = useUpdateCollaboratorStatus();
  const { user } = Route.useRouteContext();

  const getIcon = (type: string) => {
    switch (type) {
      case "chapter":
        return BookOpen;
      case "like":
        return Heart;
      case "comment":
        return MessageCircle;
      case "follow":
        return UserPlus;
      default:
        return Bell;
    }
  };

  const getTint = (type: string) => {
    switch (type) {
      case "chapter":
        return "bg-primary/15 text-primary";
      case "like":
        return "bg-rose-100 dark:bg-rose-950/30 text-rose-600";
      case "comment":
        return "bg-sky-100 dark:bg-sky-950/30 text-sky-600";
      case "follow":
        return "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Bell className="h-7 w-7 text-primary" />
            <h1 className="font-serif text-4xl font-semibold tracking-tight">Notifications</h1>
          </div>
          {items.some((n) => !n.is_read) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-16 bg-muted rounded-md w-full" />
            <div className="h-16 bg-muted rounded-md w-full" />
            <div className="h-16 bg-muted rounded-md w-full" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="All caught up"
            description="You don't have any notifications right now."
          />
        ) : (
          <Card className="divide-y">
            {items.map((n) => {
              const Icon = getIcon(n.type);
              const tint = getTint(n.type);
              const initials = n.actor?.display_name?.slice(0, 2).toUpperCase() || "?";

              return (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.is_read) markRead.mutate({ id: n.id });
                  }}
                  className={`flex items-start gap-3 p-4 transition-colors cursor-pointer ${
                    !n.is_read ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/30"
                  }`}
                >
                  <div className="relative">
                    <Avatar>
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <span className={`absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full ring-2 ring-background ${tint}`}>
                      <Icon className="h-3 w-3" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{n.actor?.display_name || "System"}</span>{" "}
                      <span className="text-muted-foreground">
                        {n.message?.replace(/^Someone /, "")}
                      </span>{" "}
                      {n.link && (
                        <>
                          <span className="text-muted-foreground/40 mx-2">||</span>
                          <Link to={n.link} className="font-serif font-medium hover:underline text-primary">
                            {n.title}
                          </Link>
                        </>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleDateString()}
                    </p>
                    {n.type === "workspace_invite" && !n.message?.includes("accepted") && !n.message?.includes("declined") && (
                      <div className="mt-3 flex items-center gap-2">
                        <Button 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (user) {
                              updateStatus.mutate({ novel_id: n.link?.replace("/workspace/", "") || "", user_id: user.id, status: "accepted", notification_id: n.id });
                            }
                          }}
                        >
                          Accept Invite
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (user) {
                              updateStatus.mutate({ novel_id: n.link?.replace("/workspace/", "") || "", user_id: user.id, status: "declined", notification_id: n.id });
                            }
                          }}
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                  {!n.is_read && <Badge variant="default" className="h-2 w-2 rounded-full p-0" />}
                </div>
              );
            })}
          </Card>
        )}
      </div>
    </div>
  );
}
