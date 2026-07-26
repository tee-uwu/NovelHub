import fs from "fs";
let content = fs.readFileSync("src/routes/contests.tsx", "utf8");
content = content.replace(/function AdminContestDialog\(\) \{/, `function AdminContestDialog() {\n  const { t } = useTranslation();`);
fs.writeFileSync("src/routes/contests.tsx", content);

