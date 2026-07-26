import fs from "fs";
let content = fs.readFileSync("src/components/top-nav.tsx", "utf8");

const regex = /const links = \[\s*\{\s*to:\s*"\/",\s*label:\s*t\("nav\.discover"\)\s*\},[\s\S]*?\];/;
content = content.replace(regex, "");

fs.writeFileSync("src/components/top-nav.tsx", content);

