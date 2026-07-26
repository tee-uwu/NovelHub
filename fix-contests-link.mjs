import fs from "fs";
let content = fs.readFileSync("src/routes/contests.tsx", "utf8");

content = content.replace(
  /<Link to={\`\/novel\/\\$\\{entry\.novel\?\.slug\\}\`} className="font-medium text-primary hover:underline" onClick=\{\(\) => setDetailsOpen\(false\)\}>/g,
  `<Link to="/novel/$novelId" params={{ novelId: entry.novel?.slug || "" }} className="font-medium text-primary hover:underline" onClick={() => setDetailsOpen(false)}>`
);

content = content.replace(
  /<Link to={\`\/novel\/\\$\\{entry\.novel\?\.slug\\}\`} onClick=\{\(\) => setDetailsOpen\(false\)\}>/g,
  `<Link to="/novel/$novelId" params={{ novelId: entry.novel?.slug || "" }} onClick={() => setDetailsOpen(false)}>`
);

fs.writeFileSync("src/routes/contests.tsx", content);

