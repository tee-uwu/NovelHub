import fs from "fs";

let en = JSON.parse(fs.readFileSync("src/locales/en.json", "utf8"));
let bn = JSON.parse(fs.readFileSync("src/locales/bn.json", "utf8"));

en.novelDetails = {
  "readNovel": "Read Novel",
  "share": "Share",
  "copied": "Copied to clipboard!",
  "addToLibrary": "Add to Library",
  "inLibrary": "In Library",
  "startReading": "Start Reading",
  "continueReading": "Continue Reading",
  "readNow": "Read Now",
  "about": "About this novel",
  "chapters": "Chapters",
  "reviews": "Reviews",
  "leaveReview": "Leave a Review",
  "editNovel": "Edit Novel",
  "settings": "Settings",
  "addChapter": "Add Chapter",
  "statusDraft": "Draft",
  "statusApproved": "Approved",
  "synopsis": "Synopsis",
  "published": "Published",
  "views": "views",
  "readChapter": "Read chapter",
  "chapter": "Chapter",
  "rating": "Rating",
  "noChapters": "No chapters published yet.",
  "noReviews": "No reviews yet. Be the first to review!",
  "author": "Author",
  "genre": "Genre",
  "loginToReview": "Please log in to leave a review."
};

bn.novelDetails = {
  "readNovel": "উপন্যাস পড়ুন",
  "share": "শেয়ার করুন",
  "copied": "ক্লিপবোর্ডে কপি করা হয়েছে!",
  "addToLibrary": "লাইব্রেরিতে যুক্ত করুন",
  "inLibrary": "লাইব্রেরিতে আছে",
  "startReading": "পড়া শুরু করুন",
  "continueReading": "পড়া চালিয়ে যান",
  "readNow": "এখনই পড়ুন",
  "about": "এই উপন্যাস সম্পর্কে",
  "chapters": "অধ্যায়",
  "reviews": "রিভিউ",
  "leaveReview": "রিভিউ দিন",
  "editNovel": "উপন্যাস সম্পাদনা করুন",
  "settings": "সেটিংস",
  "addChapter": "অধ্যায় যোগ করুন",
  "statusDraft": "খসড়া",
  "statusApproved": "অনুমোদিত",
  "synopsis": "সারাংশ",
  "published": "প্রকাশিত",
  "views": "ভিউ",
  "readChapter": "অধ্যায় পড়ুন",
  "chapter": "অধ্যায়",
  "rating": "রেটিং",
  "noChapters": "এখনও কোনো অধ্যায় প্রকাশিত হয়নি।",
  "noReviews": "এখনও কোনো রিভিউ নেই। প্রথম রিভিউকারী হোন!",
  "author": "লেখক",
  "genre": "জেনার",
  "loginToReview": "রিভিউ দিতে অনুগ্রহ করে লগ ইন করুন।"
};

fs.writeFileSync("src/locales/en.json", JSON.stringify(en, null, 2));
fs.writeFileSync("src/locales/bn.json", JSON.stringify(bn, null, 2));

let tsx = fs.readFileSync("src/routes/novel.$novelId.tsx", "utf8");

if (!tsx.includes("useTranslation")) {
  tsx = tsx.replace(
    `import { useState, useEffect } from "react";`,
    `import { useState, useEffect } from "react";\nimport { useTranslation } from "react-i18next";`
  );
}

tsx = tsx.replace(
  `function NovelDetail() {`,
  `function NovelDetail() {\n  const { t } = useTranslation();`
);

tsx = tsx.replace(/>Share</g, `>{t("novelDetails.share")}<`);
tsx = tsx.replace(/"Copied to clipboard!"/g, `t("novelDetails.copied")`);
tsx = tsx.replace(/>Add to Library</g, `>{t("novelDetails.addToLibrary")}<`);
tsx = tsx.replace(/>In Library</g, `>{t("novelDetails.inLibrary")}<`);
tsx = tsx.replace(/>Start Reading</g, `>{t("novelDetails.startReading")}<`);
tsx = tsx.replace(/>Continue Reading</g, `>{t("novelDetails.continueReading")}<`);
tsx = tsx.replace(/>Read Now</g, `>{t("novelDetails.readNow")}<`);
tsx = tsx.replace(/>About this novel</g, `>{t("novelDetails.about")}<`);
tsx = tsx.replace(/>Chapters</g, `>{t("novelDetails.chapters")}<`);
tsx = tsx.replace(/>Reviews</g, `>{t("novelDetails.reviews")}<`);
tsx = tsx.replace(/>Leave a Review</g, `>{t("novelDetails.leaveReview")}<`);
tsx = tsx.replace(/>Edit Novel</g, `>{t("novelDetails.editNovel")}<`);
tsx = tsx.replace(/>Settings</g, `>{t("novelDetails.settings")}<`);
tsx = tsx.replace(/>Add Chapter</g, `>{t("novelDetails.addChapter")}<`);
tsx = tsx.replace(/>Synopsis</g, `>{t("novelDetails.synopsis")}<`);
tsx = tsx.replace(/<p className="text-sm text-muted-foreground mt-4">No chapters published yet\.<\/p>/, `<p className="text-sm text-muted-foreground mt-4">{t("novelDetails.noChapters")}</p>`);
tsx = tsx.replace(/<p className="text-sm text-muted-foreground py-8 text-center">No reviews yet\. Be the first to review!<\/p>/, `<p className="text-sm text-muted-foreground py-8 text-center">{t("novelDetails.noReviews")}</p>`);
tsx = tsx.replace(/<span className="text-muted-foreground">views<\/span>/g, `<span className="text-muted-foreground">{t("novelDetails.views")}</span>`);
tsx = tsx.replace(/<span className="text-muted-foreground">chapters<\/span>/g, `<span className="text-muted-foreground">{t("novelDetails.chapters")}</span>`);
tsx = tsx.replace(/Please log in to leave a review\./, `{t("novelDetails.loginToReview")}`);

fs.writeFileSync("src/routes/novel.$novelId.tsx", tsx);
