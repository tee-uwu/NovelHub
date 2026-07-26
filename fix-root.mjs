import fs from "fs";
let content = fs.readFileSync("src/routes/__root.tsx", "utf8");
content = `import "../i18n";\n` + content;
fs.writeFileSync("src/routes/__root.tsx", content);

