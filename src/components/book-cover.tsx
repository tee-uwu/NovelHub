type Props = {
  title: string;
  palette?: number;
  coverUrl?: string | null;
  className?: string;
};

const palettes = [
  "from-orange-500 via-amber-600 to-rose-700",
  "from-slate-800 via-slate-900 to-black",
  "from-indigo-600 via-purple-700 to-pink-600",
  "from-emerald-600 via-teal-700 to-cyan-800",
  "from-rose-500 via-red-600 to-orange-700",
  "from-sky-600 via-blue-700 to-indigo-900",
  "from-amber-400 via-orange-600 to-red-800",
  "from-fuchsia-600 via-purple-800 to-slate-900",
];

export function BookCover({ title, palette = 0, coverUrl, className = "" }: Props) {
  const p = palettes[palette % palettes.length];

  if (coverUrl) {
    return (
      <div className={`relative aspect-[2/3] w-full overflow-hidden rounded-md shadow-md book-hover ${className}`}>
        <img src={coverUrl} alt={title} className="h-full w-full object-cover" loading="lazy" />
      </div>
    );
  }

  return (
    <div
      className={`relative flex aspect-[2/3] w-full items-end overflow-hidden rounded-md bg-gradient-to-br shadow-md book-hover ${p} ${className}`}
    >
      <div className="absolute inset-0 opacity-20 mix-blend-overlay [background-image:radial-gradient(circle_at_30%_20%,white,transparent_60%)]" />
      <div className="relative z-10 p-3">
        <p className="font-serif text-sm leading-tight text-white drop-shadow">{title}</p>
      </div>
    </div>
  );
}
