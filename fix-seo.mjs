import fs from "fs";

const files = [
  { path: "src/routes/rankings.tsx", route: "/rankings", title: "Novel Rankings | NovelHub", desc: "Top ranked novels on NovelHub. See what's trending and popular right now." },
  { path: "src/routes/search.tsx", route: "/search", title: "Search Novels | NovelHub", desc: "Search for your favorite novels, authors, and genres on NovelHub." }
];

files.forEach(f => {
  let content = fs.readFileSync(f.path, "utf8");
  if (!content.includes("head: () =>")) {
    const searchStr = `export const Route = createFileRoute("${f.route}")({`;
    const replacementStr = `export const Route = createFileRoute("${f.route}")({
  head: () => ({
    meta: [
      { title: "${f.title}" },
      { name: "description", content: "${f.desc}" },
      { property: "og:title", content: "${f.title}" },
      { property: "og:description", content: "${f.desc}" },
    ],
  }),`;
    content = content.replace(searchStr, replacementStr);
    fs.writeFileSync(f.path, content);
    console.log(`Updated SEO for ${f.path}`);
  }
});
