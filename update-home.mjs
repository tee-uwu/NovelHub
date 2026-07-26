import fs from "fs";
let content = fs.readFileSync("src/routes/index.tsx", "utf8");

content = `import { useTranslation } from "react-i18next";\n` + content;
content = content.replace(/function Discover\(\) \{/, `function Discover() {\n  const { t } = useTranslation();`);

const translations = [
  { from: `>Welcome back<`, to: `>{t("home.welcome")}<` },
  { from: `>Discover New Worlds<`, to: `>{t("home.discoverTitle")}<` },
  { from: `>Trending Now<`, to: `>{t("home.trending")}<` },
  { from: `>Latest Updates<`, to: `>{t("home.latestUpdates")}<` },
  { from: `>Read Now<`, to: `>{t("home.readNow")}<` },
  { from: `> chapters<`, to: `> {t("home.chapters")}<` },
  { from: `>by `, to: `>{t("home.by")} ` },
  { from: `>No novels found for this genre.<`, to: `>{t("home.noNovels")}<` }
];

translations.forEach(({from, to}) => {
  content = content.split(from).join(to);
});

fs.writeFileSync("src/routes/index.tsx", content);

