import fs from "fs";

let en = JSON.parse(fs.readFileSync("src/locales/en.json", "utf8"));
let bn = JSON.parse(fs.readFileSync("src/locales/bn.json", "utf8"));

en.rankings = {
  "pageTitle": "Weekly Rankings",
  "pageSubtitle": "The most popular novels of the week.",
  "noNovels": "No novels found.",
  "by": "by",
  "views": "views",
  "runnerUp": "Runner Up",
  "leader": "Leader",
  "thirdPlace": "3rd Place",
  "leaderboard": "Leaderboard"
};

bn.rankings = {
  "pageTitle": "????????? ??????????",
  "pageSubtitle": "???????? ??????? ???????? ????????????",
  "noNovels": "???? ??????? ?????? ???????",
  "by": "???????",
  "views": "???",
  "runnerUp": "????? ??",
  "leader": "?????????????",
  "thirdPlace": "??? ?????",
  "leaderboard": "??????????"
};

fs.writeFileSync("src/locales/en.json", JSON.stringify(en, null, 2));
fs.writeFileSync("src/locales/bn.json", JSON.stringify(bn, null, 2));

let tsx = fs.readFileSync("src/routes/rankings.tsx", "utf8");

// Add useTranslation
if (!tsx.includes("useTranslation")) {
  tsx = tsx.replace(
    `import { useQuery }`,
    `import { useQuery } from "@tanstack/react-query";\nimport { useTranslation } from "react-i18next";`
  );
}

tsx = tsx.replace(
  `function Rankings() {`,
  `function Rankings() {\n  const { t } = useTranslation();`
);

tsx = tsx.replace(`"Weekly Rankings - NovelHub"`, `t("rankings.pageTitle") + " - NovelHub"`);
tsx = tsx.replace(/<h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">Weekly Rankings<\/h1>/, `<h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">{t("rankings.pageTitle")}</h1>`);
tsx = tsx.replace(/<p className="mt-2 text-muted-foreground font-medium">The most popular novels of the week.<\/p>/, `<p className="mt-2 text-muted-foreground font-medium">{t("rankings.pageSubtitle")}</p>`);
tsx = tsx.replace(/<p className="text-muted-foreground">No novels found.<\/p>/, `<p className="text-muted-foreground">{t("rankings.noNovels")}</p>`);

// Replaces multiple instances of "by" and "views"
tsx = tsx.replace(/by {book2.author\?.display_name}/g, `{t("rankings.by")} {book2.author?.display_name}`);
tsx = tsx.replace(/by {book1.author\?.display_name}/g, `{t("rankings.by")} {book1.author?.display_name}`);
tsx = tsx.replace(/by {book3.author\?.display_name}/g, `{t("rankings.by")} {book3.author?.display_name}`);
tsx = tsx.replace(/by {b.author\?.display_name}/g, `{t("rankings.by")} {b.author?.display_name}`);

tsx = tsx.replace(/<span>{\(book2\.view_count.*?\) views<\/span>/, `<span>{(book2.view_count >= 1000 ? (book2.view_count / 1000).toFixed(1) + "K" : book2.view_count)} {t("rankings.views")}</span>`);
tsx = tsx.replace(/<span>{\(book1\.view_count.*?\) views<\/span>/, `<span>{(book1.view_count >= 1000 ? (book1.view_count / 1000).toFixed(1) + "K" : book1.view_count)} {t("rankings.views")}</span>`);
tsx = tsx.replace(/<span>{\(book3\.view_count.*?\) views<\/span>/, `<span>{(book3.view_count >= 1000 ? (book3.view_count / 1000).toFixed(1) + "K" : book3.view_count)} {t("rankings.views")}</span>`);
tsx = tsx.replace(/} views\\n.*?<\/span>/s, `} {t("rankings.views")}\n                          </span>`);

tsx = tsx.replace(/>Runner Up</g, `>{t("rankings.runnerUp")}<`);
tsx = tsx.replace(/>Leader</g, `>{t("rankings.leader")}<`);
tsx = tsx.replace(/>3rd Place</g, `>{t("rankings.thirdPlace")}<`);
tsx = tsx.replace(/>Leaderboard</g, `>{t("rankings.leaderboard")}<`);

fs.writeFileSync("src/routes/rankings.tsx", tsx);

