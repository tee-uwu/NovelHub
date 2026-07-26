import fs from "fs";
let content = fs.readFileSync("src/components/top-nav.tsx", "utf8");

content = `import { useTranslation } from "react-i18next";\nimport { LanguageSwitcher } from "./language-switcher";\n` + content;

content = content.replace(/export function TopNav\(\) \{/, `export function TopNav() {\n  const { t } = useTranslation();`);

const translations = [
  { from: `"Discover"`, to: `t("nav.discover")` },
  { from: `"Contests"`, to: `t("nav.contests")` },
  { from: `"Rankings"`, to: `t("nav.rankings")` },
  { from: `"Community"`, to: `t("nav.community")` },
  { from: `"Dashboard"`, to: `t("nav.dashboard")` },
  { from: `"Profile"`, to: `t("nav.profile")` },
  { from: `"Admin"`, to: `t("nav.admin")` },
  { from: `"Logout"`, to: `t("nav.logout")` },
  { from: `"Login / Sign up"`, to: `t("nav.login")` },
  { from: `placeholder="Search novels, authors..."`, to: `placeholder={t("nav.search") + "..."}` }
];

translations.forEach(({from, to}) => {
  content = content.split(from).join(to);
});

content = content.replace(
  /<div className="flex items-center gap-4">/,
  `<div className="flex items-center gap-4">\n          <LanguageSwitcher />`
);

fs.writeFileSync("src/components/top-nav.tsx", content);

