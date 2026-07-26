import fs from "fs";
let content = fs.readFileSync("src/components/top-nav.tsx", "utf8");

if (!content.includes("<LanguageSwitcher />")) {
  content = content.replace(
    /<div className="ml-auto flex items-center gap-3">/,
    `<div className="ml-auto flex items-center gap-3">\n          <LanguageSwitcher />`
  );
  fs.writeFileSync("src/components/top-nav.tsx", content);
}

