import fs from "fs";

const files = [
  {
    path: "src/routes/index.tsx",
    title: "NovelHub - Discover Amazing Novels",
    desc: "Discover, read, and write amazing novels on NovelHub. Join a community of authors and readers.",
    route: "/"
  },
  {
    path: "src/routes/contests.tsx",
    title: "Writing Contests | NovelHub",
    desc: "Participate in writing contests, win prizes, and get recognized on NovelHub.",
    route: "/contests"
  },
  {
    path: "src/routes/community.tsx",
    title: "Community | NovelHub",
    desc: "Join the NovelHub community. Discuss novels, share ideas, and connect with other readers and authors.",
    route: "/community"
  },
  {
    path: "src/routes/rankings.tsx",
    title: "Novel Rankings | NovelHub",
    desc: "Top ranked novels on NovelHub. See what's trending and popular right now.",
    route: "/rankings"
  },
  {
    path: "src/routes/search.tsx",
    title: "Search Novels | NovelHub",
    desc: "Search for your favorite novels, authors, and genres on NovelHub.",
    route: "/search"
  },
  {
    path: "src/routes/read.tsx",
    title: "Read | NovelHub",
    desc: "Read your favorite novels on NovelHub.",
    route: "/read"
  },
  {
    path: "src/routes/novel.$novelId.tsx",
    title: "Read Novel | NovelHub",
    desc: "Read this amazing novel on NovelHub.",
    route: "/novel/$novelId"
  }
];

files.forEach(file => {
  if (fs.existsSync(file.path)) {
    let content = fs.readFileSync(file.path, "utf8");
    
    // Check if it already has head:
    if (!content.includes("head: () =>")) {
      const searchStr = `export const Route = createFileRoute("${file.route}")({`;
      const replacementStr = `export const Route = createFileRoute("${file.route}")({
  head: () => ({
    meta: [
      { title: "${file.title}" },
      { name: "description", content: "${file.desc}" },
      { property: "og:title", content: "${file.title}" },
      { property: "og:description", content: "${file.desc}" },
    ],
  }),`;
      
      content = content.replace(searchStr, replacementStr);
      fs.writeFileSync(file.path, content);
      console.log(`Updated SEO for ${file.path}`);
    }
  }
});
