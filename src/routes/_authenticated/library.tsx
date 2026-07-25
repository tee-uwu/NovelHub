import { createFileRoute, Link } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";
import { BookCover } from "@/components/book-cover";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookMarked, Clock, CheckCircle2 } from "lucide-react";
import { useLibrary } from "@/hooks/use-library";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_authenticated/library")({
  component: Library,
  head: () => ({ meta: [{ title: "My Library — NovelHub" }] }),
});

function Library() {
  const { data: items = [], isLoading } = useLibrary();

  const reading = items.filter((i) => i.status === "reading");
  const saved = items.filter((i) => i.status === "saved");
  const finished = items.filter((i) => i.status === "finished");

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-serif text-4xl font-semibold tracking-tight">My Library</h1>
        <p className="mt-1 text-sm text-muted-foreground">Everything you're reading, saved for later, or finished.</p>

        {isLoading ? (
          <div className="mt-8 space-y-3 animate-pulse">
            <div className="h-20 bg-muted rounded-md w-full" />
            <div className="h-20 bg-muted rounded-md w-full" />
            <div className="h-20 bg-muted rounded-md w-full" />
          </div>
        ) : (
          <Tabs defaultValue="reading" className="mt-8">
            <TabsList>
              <TabsTrigger value="reading"><Clock className="mr-2 h-4 w-4" />Reading ({reading.length})</TabsTrigger>
              <TabsTrigger value="saved"><BookMarked className="mr-2 h-4 w-4" />Saved ({saved.length})</TabsTrigger>
              <TabsTrigger value="finished"><CheckCircle2 className="mr-2 h-4 w-4" />Finished ({finished.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="reading" className="mt-6 space-y-3">
              {reading.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No novels in progress"
                  description="Start reading novels to track your progress here."
                />
              ) : (
                reading.map((item, idx) => (
                  <Link key={item.id} to="/read" search={{ novelId: item.novel_id }}>
                    <Card className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/40 card-hover">
                      <BookCover title={item.novel?.title || ""} coverUrl={item.novel?.cover_url} coverColor={item.novel?.cover_color} palette={idx} className="w-16 shrink-0" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div>
                          <h3 className="truncate font-serif font-semibold">{item.novel?.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            by {item.novel?.author?.display_name} · Chapter {item.current_chapter}
                          </p>
                        </div>
                        <Progress value={item.progress} className="h-1.5" />
                      </div>
                      <Badge>{item.progress}%</Badge>
                    </Card>
                  </Link>
                ))
              )}
            </TabsContent>

            <TabsContent value="saved" className="mt-6">
              {saved.length === 0 ? (
                <EmptyState
                  icon={BookMarked}
                  title="No saved novels"
                  description="Save novels for later to view them in this tab."
                />
              ) : (
                <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {saved.map((item, idx) => (
                    <Link
                      key={item.id}
                      to="/novel/$novelId"
                      params={{ novelId: item.novel?.slug || "" }}
                      className="group"
                    >
                      <BookCover title={item.novel?.title || ""} coverUrl={item.novel?.cover_url} coverColor={item.novel?.cover_color} palette={idx} />
                      <h3 className="mt-2 truncate font-serif text-sm font-semibold group-hover:text-primary">{item.novel?.title}</h3>
                      <p className="truncate text-xs text-muted-foreground">by {item.novel?.author?.display_name}</p>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="finished" className="mt-6">
              {finished.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="No finished novels"
                  description="Completed novels will automatically appear here."
                />
              ) : (
                <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {finished.map((item, idx) => (
                    <Link
                      key={item.id}
                      to="/novel/$novelId"
                      params={{ novelId: item.novel?.slug || "" }}
                      className="group"
                    >
                      <BookCover title={item.novel?.title || ""} coverUrl={item.novel?.cover_url} coverColor={item.novel?.cover_color} palette={idx} />
                      <h3 className="mt-2 truncate font-serif text-sm font-semibold group-hover:text-primary">{item.novel?.title}</h3>
                      <p className="truncate text-xs text-muted-foreground">by {item.novel?.author?.display_name}</p>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

