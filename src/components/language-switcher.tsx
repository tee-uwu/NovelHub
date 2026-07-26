import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
  };

  return (
    <Select value={i18n.resolvedLanguage || 'en'} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[100px] h-8 text-xs">
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="bn">বাংলা (BN)</SelectItem>
      </SelectContent>
    </Select>
  );
}
