import { createFileRoute } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useFaqs } from "@/hooks/use-faqs";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/faq")({
  component: FaqPage,
});

function FaqPage() {
  const { data: faqs, isLoading } = useFaqs();

  return (
    <div className="min-h-screen bg-muted/20">
      <TopNav />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl font-bold tracking-tight mb-4">{t("faq.title")}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Welcome to NovelHub! Whether you're a reader looking for your next great story, or an author collaborating with a team, you'll find everything you need to know right here.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-5 h-16 animate-pulse bg-muted" />
            ))}
          </div>
        ) : !faqs || faqs.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No FAQs available right now. Check back later!
          </Card>
        ) : (
          <Card className="p-2 sm:p-6 shadow-md">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id} className="border-b-muted/50 last:border-0">
                  <AccordionTrigger className="text-left font-serif text-lg font-semibold hover:text-primary transition-colors px-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed
                      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                      prose-strong:text-foreground prose-strong:font-semibold">
                      <ReactMarkdown>{faq.answer}</ReactMarkdown>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        )}
      </div>
    </div>
  );
}
