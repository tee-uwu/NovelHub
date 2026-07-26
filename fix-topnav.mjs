import fs from "fs";
let content = fs.readFileSync("src/components/top-nav.tsx", "utf8");

const linksBlock = `const links = [
  { to: "/", label: t("nav.discover") },
  { to: "/rankings", label: t("nav.rankings") },
  { to: "/community", label: t("nav.community") },
  { to: "/contests", label: t("nav.contests") },
  { to: "/dashboard", label: "Create" },
  { to: "/faq", label: "FAQ" },
];`;

// Remove the global links block
content = content.replace(linksBlock, "");

// Insert it inside TopNav
content = content.replace(
  `export function TopNav() {
  const { t } = useTranslation();`,
  `export function TopNav() {
  const { t } = useTranslation();
  
  const links = [
    { to: "/", label: t("nav.discover") },
    { to: "/rankings", label: t("nav.rankings") },
    { to: "/community", label: t("nav.community") },
    { to: "/contests", label: t("nav.contests") },
    { to: "/dashboard", label: "Create" },
    { to: "/faq", label: "FAQ" },
  ];`
);

fs.writeFileSync("src/components/top-nav.tsx", content);

