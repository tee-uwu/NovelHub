import fs from "fs";
let content = fs.readFileSync("src/components/top-nav.tsx", "utf8");

content = content.replace(/<div className="ml-auto flex items-center gap-3">\\s*<LanguageSwitcher \/>/, `<div className="ml-auto flex items-center gap-3">`);
content = content.replace(
  `{user ? (`,
  `<LanguageSwitcher />\n          {user ? (`
);

fs.writeFileSync("src/components/top-nav.tsx", content);

