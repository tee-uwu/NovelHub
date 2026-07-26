import fs from "fs";

let en = JSON.parse(fs.readFileSync("src/locales/en.json", "utf8"));
let bn = JSON.parse(fs.readFileSync("src/locales/bn.json", "utf8"));

en.read = {
  "loadingChapter": "Loading chapter...",
  "chapterNotFound": "Chapter not found",
  "backToNovel": "Back to Novel",
  "readingProgress": "Reading Progress",
  "textOptions": "Text Options",
  "fontSize": "Font Size",
  "small": "Small",
  "medium": "Medium",
  "large": "Large",
  "previousChapter": "Previous Chapter",
  "nextChapter": "Next Chapter",
  "chapter": "Chapter",
  "play": "Play",
  "pause": "Pause",
  "stop": "Stop",
  "audioReading": "Audio Reading",
  "addToLibrary": "Add to Library",
  "inLibrary": "In Library",
  "comments": "Comments",
  "commentsCount": "comments",
  "writeComment": "Write a comment...",
  "signInToComment": "Sign in to comment",
  "post": "Post",
  "posting": "Posting..."
};

bn.read = {
  "loadingChapter": "অধ্যায় লোড হচ্ছে...",
  "chapterNotFound": "অধ্যায় পাওয়া যায়নি",
  "backToNovel": "উপন্যাসে ফিরে যান",
  "readingProgress": "পড়ার অগ্রগতি",
  "textOptions": "টেক্সট বিকল্প",
  "fontSize": "ফন্টের আকার",
  "small": "ছোট",
  "medium": "মাঝারি",
  "large": "বড়",
  "previousChapter": "পূর্ববর্তী অধ্যায়",
  "nextChapter": "পরবর্তী অধ্যায়",
  "chapter": "অধ্যায়",
  "play": "শুনুন",
  "pause": "বিরতি",
  "stop": "থামান",
  "audioReading": "অডিও পাঠ",
  "addToLibrary": "লাইব্রেরিতে যুক্ত করুন",
  "inLibrary": "লাইব্রেরিতে আছে",
  "comments": "মন্তব্য",
  "commentsCount": "টি মন্তব্য",
  "writeComment": "একটি মন্তব্য লিখুন...",
  "signInToComment": "মন্তব্য করতে সাইন ইন করুন",
  "post": "পোস্ট করুন",
  "posting": "পোস্ট করা হচ্ছে..."
};

fs.writeFileSync("src/locales/en.json", JSON.stringify(en, null, 2));
fs.writeFileSync("src/locales/bn.json", JSON.stringify(bn, null, 2));

let tsx = fs.readFileSync("src/routes/read.tsx", "utf8");

if (!tsx.includes("useTranslation")) {
  tsx = tsx.replace(
    `import { useState, useEffect } from "react";`,
    `import { useState, useEffect } from "react";\nimport { useTranslation } from "react-i18next";`
  );
}

tsx = tsx.replace(
  `function ReadPage() {`,
  `function ReadPage() {\n  const { t } = useTranslation();`
);

tsx = tsx.replace(/>Loading chapter...</, `>{t("read.loadingChapter")}<`);
tsx = tsx.replace(/>Chapter not found</, `>{t("read.chapterNotFound")}<`);
tsx = tsx.replace(/>Back to Novel</g, `>{t("read.backToNovel")}<`);
tsx = tsx.replace(/>Text Options</, `>{t("read.textOptions")}<`);
tsx = tsx.replace(/>Font Size</, `>{t("read.fontSize")}<`);
tsx = tsx.replace(/>Small</, `>{t("read.small")}<`);
tsx = tsx.replace(/>Medium</, `>{t("read.medium")}<`);
tsx = tsx.replace(/>Large</, `>{t("read.large")}<`);
tsx = tsx.replace(/<span className="sr-only">Previous Chapter<\/span>/, `<span className="sr-only">{t("read.previousChapter")}</span>`);
tsx = tsx.replace(/<span className="hidden sm:inline">Previous Chapter<\/span>/, `<span className="hidden sm:inline">{t("read.previousChapter")}</span>`);
tsx = tsx.replace(/<span className="sr-only">Next Chapter<\/span>/, `<span className="sr-only">{t("read.nextChapter")}</span>`);
tsx = tsx.replace(/<span className="hidden sm:inline">Next Chapter<\/span>/, `<span className="hidden sm:inline">{t("read.nextChapter")}</span>`);
tsx = tsx.replace(/Chapter {chapter\.chapter_number}/g, `{t("read.chapter")} {chapter.chapter_number}`);

tsx = tsx.replace(/>Audio Reading</, `>{t("read.audioReading")}<`);
tsx = tsx.replace(/>Play</, `>{t("read.play")}<`);
tsx = tsx.replace(/>Pause</, `>{t("read.pause")}<`);
tsx = tsx.replace(/>Stop</, `>{t("read.stop")}<`);

tsx = tsx.replace(/>In Library</, `>{t("read.inLibrary")}<`);
tsx = tsx.replace(/>Add to Library</, `>{t("read.addToLibrary")}<`);
tsx = tsx.replace(/>Comments</, `>{t("read.comments")}<`);
tsx = tsx.replace(/<span className="text-muted-foreground">{comments.length} comments<\/span>/, `<span className="text-muted-foreground">{comments.length} {t("read.commentsCount")}</span>`);
tsx = tsx.replace(/placeholder="Write a comment..."/, `placeholder={t("read.writeComment")}`);
tsx = tsx.replace(/>Sign in to comment</, `>{t("read.signInToComment")}<`);
tsx = tsx.replace(/{createComment\.isPending \? "Posting..." : "Post"}/, `{createComment.isPending ? t("read.posting") : t("read.post")}`);

fs.writeFileSync("src/routes/read.tsx", tsx);
