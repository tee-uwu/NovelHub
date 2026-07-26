import { createFileRoute, Link } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";
import { BookCover } from "@/components/book-cover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Search as SearchIcon, Eye, Calendar, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNovels } from "@/hooks/use-novels";
import { NovelListSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/search")({
  component: Search,
  head: () => ({ meta: [{ title: "Search Novels — NovelHub" }] }),
});

const suggestions = ["Fantasy", "Isekai", "Sci-Fi", "Romance", "Adventure", "Mystery"];

function Search() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"popularity" | "recent">("popularity");

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQ(q);
    }, 250);

    return () => {
      clearTimeout(handler);
    };
  }, [q]);

  // Fetch all non-draft novels
  const { data: allNovels = [], isLoading } = useNovels();

  // Filter only approved novels for public searching
  const approvedNovels = allNovels.filter(b => b.approval_status === "approved");

  // In-memory filter and search
  const filteredResults = approvedNovels.filter((b) => {
    const queryLower = debouncedQ.toLowerCase().trim();
    
    // Match text query (title, synopsis, genre, author display name)
    const matchesSearch = !queryLower ? true : (
      b.title.toLowerCase().includes(queryLower) ||
      (b.synopsis && b.synopsis.toLowerCase().includes(queryLower)) ||
      (b.genre && b.genre.toLowerCase().includes(queryLower)) ||
      (b.author?.display_name && b.author.display_name.toLowerCase().includes(queryLower))
    );

    // Match genre selector
    const matchesGenre = selectedGenre === "all" ? true : b.genre?.toLowerCase() === selectedGenre.toLowerCase();

    return matchesSearch && matchesGenre;
  });

  // Sort results in-memory
  const sortedResults = [...filteredResults].sort((a, b) => {
    if (sortBy === "popularity") {
      return b.view_count - a.view_count;
    } else {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <header className="mb-8">
          <h1 className="font-serif text-4xl font-semibold tracking-tight">Search NovelHub</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Discover novels, writers, and custom genres.</p>
        </header>

        {/* Search Input */}
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search novels, authors, genres…"
            className="h-14 pl-12 text-lg"
          />
        </div>

        {/* Suggestion Chips */}
        {!q && (
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground mr-1.5">{t("search.suggestions")}</span>
            {suggestions.map((s) => (
              <button key={s} onClick={() => setQ(s)} type="button">
                <Badge variant="secondary" className="cursor-pointer font-normal hover:bg-secondary/80 transition-colors">
                  {s}
                </Badge>
              </button>
            ))}
          </div>
        )}

        {/* Filters Section */}
        <div className="mt-6 flex flex-wrap gap-4 items-center justify-between border-y py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Genre:</span>
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("search.allGenres")}</SelectItem>
                  {["Fantasy", "Sci-Fi", "Romance", "Mystery", "Action", "Drama", "Isekai"].map((g) => (
                    <SelectItem key={g} value={g.toLowerCase()}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sort by:</span>
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Popularity (Views)</SelectItem>
                <SelectItem value="recent">Recent (Newest)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results List */}
        <div className="mt-8">
          <p className="mb-4 text-xs font-medium text-muted-foreground">
            {isLoading ? "Loading library..." : `${sortedResults.length} results found`}
          </p>

          {isLoading ? (
            <NovelListSkeleton count={4} />
          ) : sortedResults.length === 0 ? (
            <EmptyState
              icon={SearchIcon}
              title={t("search.noResults")}
              description="Try adjusting your keywords, selecting different genres, or sorting types."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {sortedResults.map((b, idx) => (
                <Link
                  key={b.id}
                  to="/novel/$novelId"
                  params={{ novelId: b.slug }}
                  className="group flex"
                >
                  <Card className="flex gap-4 p-4 transition-all hover:bg-card/80 hover:border-primary/30 card-hover w-full items-start shadow-sm">
                    <div className="w-16 shrink-0">
                      <BookCover title={b.title} coverUrl={b.cover_url} coverColor={b.cover_color} palette={idx} className="w-full shadow-sm" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap gap-1.5 items-center justify-between">
                        <Badge variant="outline" className="text-[9px] uppercase tracking-wider">{b.genre}</Badge>
                        <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {b.view_count}
                        </span>
                      </div>
                      <h3 className="truncate font-serif font-bold text-base group-hover:text-primary transition-colors">{b.title}</h3>
                      <p className="truncate text-xs text-muted-foreground">by {b.author?.display_name}</p>
                      {b.synopsis && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pt-1">{b.synopsis}</p>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

