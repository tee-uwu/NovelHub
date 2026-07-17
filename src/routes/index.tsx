import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";
import { BookCover } from "@/components/book-cover";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Flame, BookOpen } from "lucide-react";
import { useNovels } from "@/hooks/use-novels";
import { NovelListSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/")({ component: Discover });

const genres = ["Fantasy", "Sci-Fi", "Romance", "Mystery", "Action", "Drama", "Isekai"];

function Discover() {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const { data: novels = [], isLoading } = useNovels({
    genre: selectedGenre || undefined,
  });

  // Filter approved novels (Supabase RLS handles this, but let's be double safe)
  const approvedNovels = novels.filter(n => n.approval_status === "approved");

  // Editors Choice section (is_editors_choice === true)
  const editorsChoiceNovels = approvedNovels.filter(n => n.is_editors_choice);

  // Trending section (sorted by view_count desc, showing top 6)
  const trendingNovels = [...approvedNovels]
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 6);

  const toggleGenre = (genre: string) => {
    setSelectedGenre(selectedGenre === genre ? null : genre);
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8 sm:px-6">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-24 space-y-6">
            <div>
              <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Genres</h3>
              <div className="flex flex-wrap gap-1.5 px-2">
                {genres.map((g) => (
                  <Badge
                    key={g}
                    variant={selectedGenre === g ? "default" : "secondary"}
                    className="cursor-pointer font-normal hover:bg-accent"
                    onClick={() => toggleGenre(g)}
                  >
                    {g}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 space-y-12">
          {selectedGenre ? (
            <div>
              <div className="mb-6">
                <h1 className="font-serif text-4xl font-semibold tracking-tight">
                  {selectedGenre} Novels
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">Explore all novels under the {selectedGenre} genre.</p>
              </div>

              {isLoading ? (
                <NovelListSkeleton count={3} />
              ) : approvedNovels.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No novels found"
                  description="We couldn't find any novels matching your filters."
                />
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                  {approvedNovels.map((b, idx) => (
                    <Link
                      key={b.id}
                      to="/novel/$novelId"
                      params={{ novelId: b.slug }}
                      className="group flex flex-col"
                    >
                      <BookCover title={b.title} coverUrl={b.cover_url} palette={idx} />
                      <div className="mt-3 space-y-1">
                        <Badge variant="outline" className="text-xs">{b.genre}</Badge>
                        <h3 className="font-serif text-base font-semibold group-hover:text-primary leading-tight truncate">{b.title}</h3>
                        <p className="text-xs text-muted-foreground">by {b.author?.display_name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Editors Choice */}
              {editorsChoiceNovels.length > 0 && (
                <div>
                  <div className="mb-6 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h2 className="font-serif text-3xl font-semibold tracking-tight">Editors Choice</h2>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                    {editorsChoiceNovels.map((b, idx) => (
                      <Link
                        key={b.id}
                        to="/novel/$novelId"
                        params={{ novelId: b.slug }}
                        className="group flex flex-col"
                      >
                        <BookCover title={b.title} coverUrl={b.cover_url} palette={idx + 2} />
                        <div className="mt-3 space-y-1">
                          <Badge variant="outline" className="text-xs">{b.genre}</Badge>
                          <h3 className="font-serif text-base font-semibold group-hover:text-primary leading-tight truncate">{b.title}</h3>
                          <p className="text-xs text-muted-foreground">by {b.author?.display_name}</p>
                          <p className="line-clamp-2 text-xs text-muted-foreground pt-1">{b.synopsis}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending */}
              <div>
                <div className="mb-6 flex items-center gap-2">
                  <Flame className="h-5 w-5 text-primary animate-pulse" />
                  <h2 className="font-serif text-3xl font-semibold tracking-tight">Trending Novels</h2>
                </div>

                {isLoading ? (
                  <NovelListSkeleton count={3} />
                ) : trendingNovels.length === 0 ? (
                  <EmptyState
                    icon={BookOpen}
                    title="No novels found"
                    description="No novels are trending at the moment."
                  />
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                    {trendingNovels.map((b, idx) => {
                      const formattedReads = b.view_count >= 1000000 
                        ? (b.view_count / 1000000).toFixed(1) + "M"
                        : b.view_count >= 1000 
                          ? (b.view_count / 1000).toFixed(1) + "K"
                          : b.view_count;

                      return (
                        <Link
                          key={b.id}
                          to="/novel/$novelId"
                          params={{ novelId: b.slug }}
                          className="group"
                        >
                          <Card className="relative overflow-hidden border-0 bg-transparent p-0 shadow-none transition-transform hover:-translate-y-1">
                            <div className="relative">
                              <BookCover title={b.title} coverUrl={b.cover_url} palette={idx} />
                              <div className="absolute -top-2 -left-2 grid h-10 w-10 place-items-center rounded-full bg-primary font-serif text-lg font-bold text-primary-foreground shadow-lg">
                                {idx + 1}
                              </div>
                            </div>
                            <div className="mt-4 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-xs">{b.genre}</Badge>
                                <span className="text-xs text-muted-foreground font-mono">{formattedReads} views</span>
                              </div>
                              <h3 className="font-serif text-lg font-semibold leading-snug group-hover:text-primary truncate">{b.title}</h3>
                              <p className="text-xs text-muted-foreground">by {b.author?.display_name}</p>
                              <p className="line-clamp-3 pt-1 text-sm text-muted-foreground">{b.synopsis}</p>
                            </div>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
