import fs from "fs";
let content = fs.readFileSync("src/routes/__root.tsx", "utf8");

if (!content.includes("I18nextProvider")) {
  content = content.replace(
    `import "../i18n";`,
    `import i18n from "../i18n";\nimport { I18nextProvider } from "react-i18next";`
  );
  
  content = content.replace(
    `<QueryClientProvider client={queryClient}>`,
    `<I18nextProvider i18n={i18n}>\n    <QueryClientProvider client={queryClient}>`
  );
  
  content = content.replace(
    `</QueryClientProvider>`,
    `</QueryClientProvider>\n    </I18nextProvider>`
  );

  fs.writeFileSync("src/routes/__root.tsx", content);
}

