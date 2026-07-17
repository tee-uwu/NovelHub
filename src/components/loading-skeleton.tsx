import { Skeleton } from "@/components/ui/skeleton";

export function NovelCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-[2/3] w-full rounded-md" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function NovelListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <NovelCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChapterListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="divide-y rounded-lg border">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full rounded-lg" />
      <div className="flex gap-6 px-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
    </div>
  );
}
