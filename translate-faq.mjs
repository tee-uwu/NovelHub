import fs from "fs";

let en = JSON.parse(fs.readFileSync("src/locales/en.json", "utf8"));
let bn = JSON.parse(fs.readFileSync("src/locales/bn.json", "utf8"));

en.faq = {
  "title": "Frequently Asked Questions",
  "subtitle": "Everything you need to know about NovelHub.",
  "searchPlaceholder": "Search FAQ...",
  "q1": "What is NovelHub?",
  "a1": "NovelHub is a platform for readers and writers to discover, read, and publish original web novels and fiction. Authors can build audiences, and readers can follow their favorite stories chapter by chapter.",
  "q2": "Is NovelHub free to use?",
  "a2": "Yes! Reading and publishing novels on NovelHub is completely free. In the future, we may introduce premium features to help authors monetize their work, but the core experience will remain free.",
  "q3": "How do I publish my own novel?",
  "a3": "First, create an account. Then, click the 'Publish' button in the top navigation bar. You can set up your novel's title, cover, and synopsis. Once the novel is created, you can start adding chapters. All new novels require admin approval before they appear publicly.",
  "q4": "What formats are supported for covers?",
  "a4": "We recommend uploading 2:3 aspect ratio images (e.g., 600x900px) in JPG, PNG, or WebP format. Maximum file size is 2MB.",
  "q5": "Who owns the rights to the novels I publish?",
  "a5": "You do! You retain 100% of the copyrights to any original work you publish on NovelHub. We only ask for the right to display it on our platform.",
  "q6": "How does the ranking system work?",
  "a6": "The weekly rankings are based on a combination of view counts, bookmarks, and reader engagement over the past 7 days. Updating regularly is the best way to climb the ranks!",
  "q7": "Can I edit a chapter after publishing it?",
  "a7": "Yes, authors can edit their chapters at any time from their Dashboard. Changes will be instantly visible to your readers.",
  "q8": "How do communities work?",
  "a8": "Communities are spaces where readers and writers can discuss specific genres, novels, or writing tips. You can join existing communities or create your own if you can't find one for your niche.",
  "noResults": "No results found for your search."
};

bn.faq = {
  "title": "সচরাচর জিজ্ঞাস্য",
  "subtitle": "নভেলহাব সম্পর্কে আপনার যা কিছু জানা দরকার।",
  "searchPlaceholder": "FAQ খুঁজুন...",
  "q1": "নভেলহাব কী?",
  "a1": "নভেলহাব হল পাঠক এবং লেখকদের জন্য মূল ওয়েব উপন্যাস এবং ফিকশন আবিষ্কার, পড়া এবং প্রকাশ করার একটি প্ল্যাটফর্ম। লেখকরা তাদের পাঠক তৈরি করতে পারেন, এবং পাঠকরা অধ্যায় অনুসারে তাদের প্রিয় গল্পগুলো অনুসরণ করতে পারেন।",
  "q2": "নভেলহাব কি ব্যবহারের জন্য বিনামূল্যে?",
  "a2": "হ্যাঁ! নভেলহাবে উপন্যাস পড়া এবং প্রকাশ করা সম্পূর্ণ বিনামূল্যে। ভবিষ্যতে, আমরা লেখকদের তাদের কাজ থেকে অর্থ উপার্জনের জন্য প্রিমিয়াম বৈশিষ্ট্য চালু করতে পারি, তবে মূল অভিজ্ঞতা বিনামূল্যে থাকবে।",
  "q3": "আমি কীভাবে আমার নিজের উপন্যাস প্রকাশ করব?",
  "a3": "প্রথমে একটি অ্যাকাউন্ট তৈরি করুন। তারপর, শীর্ষ নেভিগেশন বারে 'প্রকাশ করুন' বোতামে ক্লিক করুন। আপনি আপনার উপন্যাসের শিরোনাম, প্রচ্ছদ এবং সারাংশ সেট আপ করতে পারেন। উপন্যাস তৈরি হয়ে গেলে আপনি অধ্যায় যোগ করা শুরু করতে পারেন। সমস্ত নতুন উপন্যাস সর্বজনীনভাবে উপস্থিত হওয়ার আগে অ্যাডমিন অনুমোদনের প্রয়োজন।",
  "q4": "কভারের জন্য কোন ফরম্যাট সমর্থিত?",
  "a4": "আমরা JPG, PNG বা WebP ফরম্যাটে 2:3 আকৃতির অনুপাতের ছবি (যেমন, 600x900px) আপলোড করার পরামর্শ দিই। ফাইলের সর্বোচ্চ আকার 2MB।",
  "q5": "আমি যে উপন্যাসগুলো প্রকাশ করি তার স্বত্ব কার?",
  "a5": "আপনার! আপনি নভেলহাবে প্রকাশ করা যেকোনো মূল কাজের 100% কপিরাইট বজায় রাখেন। আমরা শুধুমাত্র এটি আমাদের প্ল্যাটফর্মে প্রদর্শন করার অধিকার চাই।",
  "q6": "র‍্যাঙ্কিং সিস্টেম কীভাবে কাজ করে?",
  "a6": "সাপ্তাহিক র‍্যাঙ্কিং গত 7 দিনে ভিউ সংখ্যা, বুকমার্ক এবং পাঠকের সম্পৃক্ততার সংমিশ্রণের উপর ভিত্তি করে। নিয়মিত আপডেট করা র‍্যাঙ্কে আরোহণের সেরা উপায়!",
  "q7": "আমি কি প্রকাশের পর একটি অধ্যায় সম্পাদনা করতে পারি?",
  "a7": "হ্যাঁ, লেখকরা যেকোনো সময় তাদের ড্যাশবোর্ড থেকে তাদের অধ্যায়গুলো সম্পাদনা করতে পারেন। পরিবর্তনগুলো আপনার পাঠকদের কাছে তাৎক্ষণিকভাবে দৃশ্যমান হবে।",
  "q8": "কমিউনিটিগুলো কীভাবে কাজ করে?",
  "a8": "কমিউনিটি হলো এমন স্থান যেখানে পাঠক এবং লেখকরা নির্দিষ্ট জেনার, উপন্যাস বা লেখার টিপস নিয়ে আলোচনা করতে পারেন। আপনি বিদ্যমান কমিউনিটিতে যোগ দিতে পারেন বা আপনার নির্দিষ্ট পছন্দের জন্য একটি না পেলে নিজের তৈরি করতে পারেন।",
  "noResults": "আপনার অনুসন্ধানের জন্য কোনো ফলাফল পাওয়া যায়নি।"
};

fs.writeFileSync("src/locales/en.json", JSON.stringify(en, null, 2));
fs.writeFileSync("src/locales/bn.json", JSON.stringify(bn, null, 2));

let tsx = fs.readFileSync("src/routes/faq.tsx", "utf8");

if (!tsx.includes("useTranslation")) {
  tsx = tsx.replace(
    `import { Input } from "@/components/ui/input";`,
    `import { Input } from "@/components/ui/input";\nimport { useTranslation } from "react-i18next";`
  );
}

tsx = tsx.replace(
  `function FAQ() {`,
  `function FAQ() {\n  const { t } = useTranslation();`
);

tsx = tsx.replace(/const faqs = \\[[\\s\\S]*?\\];/, `const faqs = [
  {
    question: t("faq.q1"),
    answer: t("faq.a1"),
    category: "general"
  },
  {
    question: t("faq.q2"),
    answer: t("faq.a2"),
    category: "general"
  },
  {
    question: t("faq.q3"),
    answer: t("faq.a3"),
    category: "authors"
  },
  {
    question: t("faq.q4"),
    answer: t("faq.a4"),
    category: "authors"
  },
  {
    question: t("faq.q5"),
    answer: t("faq.a5"),
    category: "authors"
  },
  {
    question: t("faq.q6"),
    answer: t("faq.a6"),
    category: "readers"
  },
  {
    question: t("faq.q7"),
    answer: t("faq.a7"),
    category: "authors"
  },
  {
    question: t("faq.q8"),
    answer: t("faq.a8"),
    category: "community"
  }
];`);

tsx = tsx.replace(/>Frequently Asked Questions</, `>{t("faq.title")}<`);
tsx = tsx.replace(/>Everything you need to know about NovelHub.</, `>{t("faq.subtitle")}<`);
tsx = tsx.replace(/placeholder="Search FAQ..."/, `placeholder={t("faq.searchPlaceholder")}`);
tsx = tsx.replace(/>No results found for your search.</, `>{t("faq.noResults")}<`);

fs.writeFileSync("src/routes/faq.tsx", tsx);
