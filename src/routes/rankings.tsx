import { createFileRoute, Link } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";
import { BookCover } from "@/components/book-cover";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Medal, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NovelListSkeleton } from "@/components/loading-skeleton";

export const Route = createFileRoute("/rankings")({
  component: Rankings,
  head: () => ({ meta: [{ title: "Weekly Rankings — NovelHub" }] }),
});

function Rankings() {
  const { data: novels = [], isLoading } = useQuery({
    queryKey: ["rankings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("novels")
        .select("*, author:profiles!author_id(display_name)")
        .eq("approval_status", "approved")
        .order("view_count", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const topThree = novels.slice(0, 3);
  const remainder = novels.slice(3);

  const book1 = topThree[0];
  const book2 = topThree[1];
  const book3 = topThree[2];

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <header className="mb-12 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <Trophy className="h-6 w-6 animate-bounce" />
          </div>
          <div>
            <h1 className="font-serif text-4xl font-semibold tracking-tight">Weekly Rankings</h1>
            <p className="text-sm text-muted-foreground">The most read and trending novels on NovelHub this week.</p>
          </div>
        </header>

        {isLoading ? (
          <NovelListSkeleton count={4} />
        ) : novels.length === 0 ? (
          <Card className="p-12 text-center text-sm text-muted-foreground">
            No ranked novels found.
          </Card>
        ) : (
          <div className="space-y-16">
            {/* Physical Podium (Top 3) */}
            {topThree.length > 0 && (
              <div className="flex flex-col sm:flex-row items-end justify-center gap-6 pt-6 pb-2 border-b">
                {/* 2nd Place (Left) */}
                {book2 && (
                  <Link
                    to="/novel/$novelId"
                    params={{ novelId: book2.slug }}
                    className="group flex flex-col items-center w-full sm:w-44 text-center order-2 sm:order-1 transition-transform hover:-translate-y-1"
                  >
                    <div className="relative mb-3">
                      <BookCover
                        title={book2.title}
                        coverUrl={book2.cover_url} coverColor={book2.cover_color}
                        palette={2}
                        className="w-28 shadow-lg rounded-lg border-2 border-slate-300"
                      />
                      <div className="absolute -top-3 -left-3 grid h-8 w-8 place-items-center rounded-full bg-slate-400 font-serif text-sm font-bold shadow border text-white">
                        2
                      </div>
                    </div>
                    <div className="space-y-1 px-2 mb-4">
                      <h3 className="font-serif font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-1">
                        {book2.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">by {book2.author?.display_name}</p>
                      <div className="flex items-center gap-1 justify-center pt-1 text-[10px] text-muted-foreground font-mono">
                        <TrendingUp className="h-3 w-3" />
                        <span>{(book2.view_count >= 1000 ? (book2.view_count / 1000).toFixed(1) + "K" : book2.view_count)} views</span>
                      </div>
                    </div>
                    <div className="hidden sm:flex flex-col items-center justify-center w-full h-16 bg-card border border-b-0 rounded-t-lg shadow-sm">
                      <Medal className="h-5 w-5 text-slate-400 mb-0.5" />
                      <span className="font-serif text-[10px] font-bold text-muted-foreground">Runner Up</span>
                    </div>
                  </Link>
                )}

                {/* 1st Place (Center) */}
                {book1 && (
                  <Link
                    to="/novel/$novelId"
                    params={{ novelId: book1.slug }}
                    className="group flex flex-col items-center w-full sm:w-48 text-center order-1 sm:order-2 sm:-translate-y-4 transition-transform hover:-translate-y-5"
                  >
                    <div className="relative mb-3">
                      <BookCover
                        title={book1.title}
                        coverUrl={book1.cover_url} coverColor={book1.cover_color}
                        palette={1}
                        className="w-32 shadow-2xl rounded-lg border-2 border-amber-400"
                      />
                      <div className="absolute -top-4 -left-4 grid h-10 w-10 place-items-center rounded-full bg-amber-400 font-serif text-base font-bold shadow-lg border-2 border-amber-300 text-white animate-pulse">
                        1
                      </div>
                    </div>
                    <div className="space-y-1 px-2 mb-4">
                      <h3 className="font-serif font-bold text-base leading-snug group-hover:text-primary transition-colors line-clamp-1">
                        {book1.title}
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium">by {book1.author?.display_name}</p>
                      <div className="flex items-center gap-1 justify-center pt-1 text-xs text-primary font-mono font-semibold">
                        <Trophy className="h-3.5 w-3.5 fill-primary/10" />
                        <span>{(book1.view_count >= 1000 ? (book1.view_count / 1000).toFixed(1) + "K" : book1.view_count)} views</span>
                      </div>
                    </div>
                    <div className="hidden sm:flex flex-col items-center justify-center w-full h-24 bg-primary/10 border border-primary/20 border-b-0 rounded-t-lg shadow-md">
                      <Trophy className="h-6 w-6 text-amber-500 mb-1 animate-bounce" />
                      <span className="font-serif text-xs font-bold text-primary">Leader</span>
                    </div>
                  </Link>
                )}

                {/* 3rd Place (Right) */}
                {book3 && (
                  <Link
                    to="/novel/$novelId"
                    params={{ novelId: book3.slug }}
                    className="group flex flex-col items-center w-full sm:w-44 text-center order-3 transition-transform hover:-translate-y-1"
                  >
                    <div className="relative mb-3">
                      <BookCover
                        title={book3.title}
                        coverUrl={book3.cover_url} coverColor={book3.cover_color}
                        palette={3}
                        className="w-28 shadow-lg rounded-lg border-2 border-amber-700"
                      />
                      <div className="absolute -top-3 -left-3 grid h-8 w-8 place-items-center rounded-full bg-amber-700 font-serif text-sm font-bold shadow border text-white">
                        3
                      </div>
                    </div>
                    <div className="space-y-1 px-2 mb-4">
                      <h3 className="font-serif font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-1">
                        {book3.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">by {book3.author?.display_name}</p>
                      <div className="flex items-center gap-1 justify-center pt-1 text-[10px] text-muted-foreground font-mono">
                        <TrendingUp className="h-3 w-3" />
                        <span>{(book3.view_count >= 1000 ? (book3.view_count / 1000).toFixed(1) + "K" : book3.view_count)} views</span>
                      </div>
                    </div>
                    <div className="hidden sm:flex flex-col items-center justify-center w-full h-12 bg-card border border-b-0 rounded-t-lg shadow-sm">
                      <Medal className="h-4 w-4 text-amber-700 mb-0.5" />
                      <span className="font-serif text-[10px] font-bold text-muted-foreground">3rd Place</span>
                    </div>
                  </Link>
                )}
              </div>
            )}

            {/* Remaining Leaderboard */}
            {remainder.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-serif font-semibold text-foreground border-b pb-2">Leaderboard</h2>
                <div className="grid gap-3">
                  {remainder.map((b, i) => {
                    const rankNum = i + 4;
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
                        className="flex items-center gap-4 p-4 rounded-xl border bg-card/50 transition-all hover:bg-card hover:border-primary/30 shadow-sm"
                      >
                        <div className="font-serif text-sm font-semibold text-muted-foreground w-6 text-center">
                          {rankNum}
                        </div>
                        <div className="w-11 shrink-0">
                          <BookCover title={b.title} coverUrl={b.cover_url} coverColor={b.cover_color} palette={rankNum} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-serif text-base font-semibold hover:text-primary transition-colors">{b.title}</h3>
                          <p className="truncate text-xs text-muted-foreground">by {b.author?.display_name}</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs shrink-0">
                          <span className="flex items-center gap-1.5 text-muted-foreground font-mono bg-muted/40 px-2 py-1 rounded-md">
                            <TrendingUp className="h-3 w-3 text-primary" /> {formattedReads} views
                          </span>
                          <Badge variant="secondary" className="hidden sm:inline-flex text-[10px] h-5 justify-center px-1.5">
                            {b.genre}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

