import fs from "fs";

let en = JSON.parse(fs.readFileSync("src/locales/en.json", "utf8"));
let bn = JSON.parse(fs.readFileSync("src/locales/bn.json", "utf8"));

en.search = {
  "pageTitle": "Search",
  "searchPlaceholder": "Search novels, authors, or genres...",
  "filterGenre": "Filter by Genre",
  "allGenres": "All Genres",
  "sortBy": "Sort By",
  "popularity": "Popularity",
  "recent": "Recently Updated",
  "suggestions": "Suggestions:",
  "noResults": "No results found.",
  "noResultsDesc": "We couldn't find any novels matching your search.",
  "views": "views",
  "chapters": "chapters"
};

bn.search = {
  "pageTitle": "অনুসন্ধান",
  "searchPlaceholder": "উপন্যাস, লেখক বা জেনার খুঁজুন...",
  "filterGenre": "জেনার ফিল্টার",
  "allGenres": "সব জেনার",
  "sortBy": "সাজান",
  "popularity": "জনপ্রিয়তা",
  "recent": "সম্প্রতি আপডেট করা",
  "suggestions": "পরামর্শ:",
  "noResults": "কোনো ফলাফল পাওয়া যায়নি।",
  "noResultsDesc": "আপনার অনুসন্ধানের সাথে মেলে এমন কোনো উপন্যাস আমরা খুঁজে পাইনি।",
  "views": "ভিউ",
  "chapters": "অধ্যায়"
};

fs.writeFileSync("src/locales/en.json", JSON.stringify(en, null, 2));
fs.writeFileSync("src/locales/bn.json", JSON.stringify(bn, null, 2));

let tsx = fs.readFileSync("src/routes/search.tsx", "utf8");

if (!tsx.includes("useTranslation")) {
  tsx = tsx.replace(
    `import { useState, useEffect } from "react";`,
    `import { useState, useEffect } from "react";\nimport { useTranslation } from "react-i18next";`
  );
}

tsx = tsx.replace(
  `function Search() {`,
  `function Search() {\n  const { t } = useTranslation();`
);

tsx = tsx.replace(`placeholder="Search novels, authors, or genres..."`, `placeholder={t("search.searchPlaceholder")}`);
tsx = tsx.replace(`>Search<`, `>{t("search.pageTitle")}<`);
tsx = tsx.replace(`>Filter by Genre<`, `>{t("search.filterGenre")}<`);
tsx = tsx.replace(`>All Genres<`, `>{t("search.allGenres")}<`);
tsx = tsx.replace(`>Sort By<`, `>{t("search.sortBy")}<`);
tsx = tsx.replace(/>Popularity</, `>{t("search.popularity")}<`);
tsx = tsx.replace(/>Recently Updated</, `>{t("search.recent")}<`);
tsx = tsx.replace(`>Suggestions:<`, `>{t("search.suggestions")}<`);
tsx = tsx.replace(`title="No results found"`, `title={t("search.noResults")}`);
tsx = tsx.replace(`description="We couldn't find any novels matching your search."`, `description={t("search.noResultsDesc")}`);
tsx = tsx.replace(/<span className="truncate">{b\.view_count} views<\/span>/, `<span className="truncate">{b.view_count} {t("search.views")}</span>`);
tsx = tsx.replace(/<span className="truncate">{b\.chapters\?\.length \|\| 0} chapters<\/span>/, `<span className="truncate">{b.chapters?.length || 0} {t("search.chapters")}</span>`);


fs.writeFileSync("src/routes/search.tsx", tsx);
