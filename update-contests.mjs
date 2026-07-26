import fs from "fs";
let content = fs.readFileSync("src/routes/contests.tsx", "utf8");

content = `import { useTranslation } from "react-i18next";\n` + content;
content = content.replace(/function ContestsPage\(\) \{/, `function ContestsPage() {\n  const { t } = useTranslation();`);
content = content.replace(/function ContestCard\(\{ contest, isPast = false \}: \{ contest: any, isPast\?: boolean \}\) \{/, `function ContestCard({ contest, isPast = false }: { contest: any, isPast?: boolean }) {\n  const { t } = useTranslation();`);

const translations = [
  { from: `>Writing Contests<`, to: `>{t("contests.title")}<` },
  { from: `>Join our official writing contests to win exciting prizes, gain exposure, and challenge your creativity.<`, to: `>{t("contests.description")}<` },
  { from: `>Active Contests<`, to: `>{t("contests.activeTitle")}<` },
  { from: `>Current contests you can participate in.<`, to: `>{t("contests.activeDesc")}<` },
  { from: `>Past Contests<`, to: `>{t("contests.pastTitle")}<` },
  { from: `>Previous contests and their winners.<`, to: `>{t("contests.pastDesc")}<` },
  { from: `> Ends: `, to: `> {t("contests.ends")}: ` },
  { from: `> Prize: `, to: `> {t("contests.prize")}: ` },
  { from: `> Participants: `, to: `> {t("contests.participants")}: ` },
  { from: `>View Details<`, to: `>{t("contests.viewDetails")}<` },
  { from: `>Enter Contest<`, to: `>{t("contests.enterContest")}<` },
  { from: `>Contest Ended<`, to: `>{t("contests.contestEnded")}<` },
  { from: `>Description & Rules<`, to: `>{t("contests.descriptionRules")}<` },
  { from: `>No active contests at the moment. Check back later!<`, to: `>{t("contests.noActive")}<` },
  { from: `>No past contests found.<`, to: `>{t("contests.noPast")}<` },
  { from: `>No one has entered this contest yet. Be the first!<`, to: `>{t("contests.beTheFirst")}<` },
  { from: `>Read Novel<`, to: `>{t("contests.readNovel")}<` },
  { from: `>Select Novel<`, to: `>{t("contests.selectNovel")}<` },
  { from: `>Submit Entry<`, to: `>{t("contests.submitEntry")}<` },
  { from: `>Entering...<`, to: `>{t("contests.entering")}<` },
  { from: `>Cancel<`, to: `>{t("contests.cancel")}<` },
  { from: `"Please login to participate."`, to: `t("contests.loginToParticipate")` },
  { from: `"You need an approved novel to enter."`, to: `t("contests.needApprovedNovel")` },
  { from: `> Participants (`, to: `> {t("contests.participants")} (` }
];

translations.forEach(({from, to}) => {
  content = content.split(from).join(to);
});

fs.writeFileSync("src/routes/contests.tsx", content);

