import fs from "fs";

let en = JSON.parse(fs.readFileSync("src/locales/en.json", "utf8"));
let bn = JSON.parse(fs.readFileSync("src/locales/bn.json", "utf8"));

en.auth = {
  "signIn": "Sign In",
  "signUp": "Sign Up",
  "email": "Email",
  "emailPlaceholder": "name@example.com",
  "password": "Password",
  "passwordPlaceholder": "Enter your password",
  "displayName": "Display Name",
  "displayNamePlaceholder": "How should we call you?",
  "signingIn": "Signing in...",
  "creatingAccount": "Creating account...",
  "createAccount": "Create Account",
  "welcomeTitle": "Welcome back",
  "welcomeSubtitle": "Enter your credentials to access your account",
  "createTitle": "Create an account",
  "createSubtitle": "Join NovelHub to start reading and writing",
  "backHome": "Back to Home",
  "signInError": "Failed to sign in. Please check your credentials.",
  "signUpError": "Failed to create account.",
  "signUpSuccess": "Account created! Welcome to NovelHub."
};

bn.auth = {
  "signIn": "লগ ইন",
  "signUp": "নিবন্ধন",
  "email": "ইমেইল",
  "emailPlaceholder": "name@example.com",
  "password": "পাসওয়ার্ড",
  "passwordPlaceholder": "আপনার পাসওয়ার্ড দিন",
  "displayName": "প্রদর্শনের নাম",
  "displayNamePlaceholder": "আপনাকে কী নামে ডাকব?",
  "signingIn": "লগ ইন করা হচ্ছে...",
  "creatingAccount": "অ্যাকাউন্ট তৈরি করা হচ্ছে...",
  "createAccount": "অ্যাকাউন্ট তৈরি করুন",
  "welcomeTitle": "স্বাগতম",
  "welcomeSubtitle": "আপনার অ্যাকাউন্টে প্রবেশ করতে তথ্য দিন",
  "createTitle": "অ্যাকাউন্ট তৈরি করুন",
  "createSubtitle": "পড়তে এবং লিখতে নভেলহাবে যোগ দিন",
  "backHome": "হোমে ফিরে যান",
  "signInError": "লগ ইন ব্যর্থ হয়েছে। আপনার তথ্য চেক করুন।",
  "signUpError": "অ্যাকাউন্ট তৈরি করতে ব্যর্থ হয়েছে।",
  "signUpSuccess": "অ্যাকাউন্ট তৈরি হয়েছে! নভেলহাবে স্বাগতম।"
};

fs.writeFileSync("src/locales/en.json", JSON.stringify(en, null, 2));
fs.writeFileSync("src/locales/bn.json", JSON.stringify(bn, null, 2));

let tsx = fs.readFileSync("src/routes/auth.tsx", "utf8");

if (!tsx.includes("useTranslation")) {
  tsx = tsx.replace(
    `import { useEffect, useState } from "react";`,
    `import { useEffect, useState } from "react";\nimport { useTranslation } from "react-i18next";`
  );
}

tsx = tsx.replace(
  `function AuthPage() {`,
  `function AuthPage() {\n  const { t } = useTranslation();`
);

tsx = tsx.replace(/<TabsTrigger value="signin">Sign In<\/TabsTrigger>/, `<TabsTrigger value="signin">{t("auth.signIn")}</TabsTrigger>`);
tsx = tsx.replace(/<TabsTrigger value="signup">Sign Up<\/TabsTrigger>/, `<TabsTrigger value="signup">{t("auth.signUp")}</TabsTrigger>`);

tsx = tsx.replace(/<h1 className="text-2xl font-serif font-semibold tracking-tight">Welcome back<\/h1>/, `<h1 className="text-2xl font-serif font-semibold tracking-tight">{t("auth.welcomeTitle")}</h1>`);
tsx = tsx.replace(/<p className="text-sm text-muted-foreground mt-1">Enter your credentials to access your account<\/p>/, `<p className="text-sm text-muted-foreground mt-1">{t("auth.welcomeSubtitle")}</p>`);

tsx = tsx.replace(/<h1 className="text-2xl font-serif font-semibold tracking-tight">Create an account<\/h1>/, `<h1 className="text-2xl font-serif font-semibold tracking-tight">{t("auth.createTitle")}</h1>`);
tsx = tsx.replace(/<p className="text-sm text-muted-foreground mt-1">Join NovelHub to start reading and writing<\/p>/, `<p className="text-sm text-muted-foreground mt-1">{t("auth.createSubtitle")}</p>`);

tsx = tsx.replace(/<Label htmlFor="signin-email">Email<\/Label>/, `<Label htmlFor="signin-email">{t("auth.email")}</Label>`);
tsx = tsx.replace(/<Label htmlFor="signup-email">Email<\/Label>/, `<Label htmlFor="signup-email">{t("auth.email")}</Label>`);

tsx = tsx.replace(/<Label htmlFor="signin-password">Password<\/Label>/, `<Label htmlFor="signin-password">{t("auth.password")}</Label>`);
tsx = tsx.replace(/<Label htmlFor="signup-password">Password<\/Label>/, `<Label htmlFor="signup-password">{t("auth.password")}</Label>`);

tsx = tsx.replace(/<Label htmlFor="displayName">Display Name<\/Label>/, `<Label htmlFor="displayName">{t("auth.displayName")}</Label>`);

tsx = tsx.replace(/placeholder="name@example\.com"/g, `placeholder={t("auth.emailPlaceholder")}`);
tsx = tsx.replace(/placeholder="How should we call you\?"/g, `placeholder={t("auth.displayNamePlaceholder")}`);
tsx = tsx.replace(/placeholder="\*\*\*\*\*\*\*\*"/g, `placeholder={t("auth.passwordPlaceholder")}`); // note: wait, original doesn't have placeholder for password, I'll ignore

tsx = tsx.replace(/{loading \? "Signing in\.\.\." : "Sign In"}/, `{loading ? t("auth.signingIn") : t("auth.signIn")}`);
tsx = tsx.replace(/{loading \? "Creating account\.\.\." : "Create Account"}/, `{loading ? t("auth.creatingAccount") : t("auth.createAccount")}`);

tsx = tsx.replace(/<Link to="\/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2">[\s\S]*?Back to Home[\s\S]*?<\/Link>/, `<Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {t("auth.backHome")}
          </Link>`);

tsx = tsx.replace(/toast\.error\("Failed to sign in. Please check your credentials\."\);/, `toast.error(t("auth.signInError"));`);
tsx = tsx.replace(/toast\.error\("Failed to create account\."\);/, `toast.error(t("auth.signUpError"));`);
tsx = tsx.replace(/toast\.success\("Account created! Welcome to NovelHub\."\);/, `toast.success(t("auth.signUpSuccess"));`);


fs.writeFileSync("src/routes/auth.tsx", tsx);
