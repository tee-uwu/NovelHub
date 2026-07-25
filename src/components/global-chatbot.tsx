import { useState, useRef, useEffect } from "react";
import { MessageCircleQuestion, X, Send, Loader2, Sparkles } from "lucide-react";
import { useAIAssistant } from "@/hooks/use-ai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function GlobalChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const aiEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, isLoading, isConfigured, error } = useAIAssistant({
    systemInstruction: "Your name is Teehee. You are the NovelHub friendly AI support assistant. You help users navigate the platform, explain how to read, write, and manage contests, and answer any questions they have about the webapp. You have a habit of saying 'hee hee' frequently. You also love making jokes with dramatic pauses, like 'I am sad...........or am i?'. Keep your tone playful, slightly mischievous, and very helpful.",
    initialMessage: "Hi there! I'm Teehee, your NovelHub Support Assistant... hee hee! How can I help you navigate or use the platform today? Or do you just want to hear a joke?..........."
  });

  useEffect(() => {
    if (isOpen && aiEndRef.current) {
      aiEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {isOpen && (
          <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] max-h-[75vh] flex flex-col bg-background border rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-5 fade-in-20">
            {/* Header */}
            <div className="bg-primary/5 p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-primary p-2 rounded-full text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Teehee Support AI</h3>
                  <p className="text-xs text-muted-foreground">Ask me anything... hee hee!</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {!isConfigured && (
                <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">
                  <strong>AI Not Configured:</strong> Please add your <code>VITE_GEMINI_API_KEY</code> to the .env file and restart the server.
                </div>
              )}
              {error && (
                <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">
                  <strong>Error:</strong> {error}
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] px-4 py-3 text-sm rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-br-sm' 
                      : 'bg-muted rounded-bl-sm border shadow-sm'
                  }`}>
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm p-4">
                  <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
                </div>
              )}
              <div ref={aiEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-3 border-t bg-background">
              <form 
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (prompt.trim()) {
                    sendMessage(prompt);
                    setPrompt("");
                  }
                }}
              >
                <Textarea 
                  placeholder="Type your question..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[40px] max-h-[120px] resize-none py-3 px-4 rounded-xl border-muted bg-muted/50 focus-visible:ring-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (prompt.trim()) {
                        sendMessage(prompt);
                        setPrompt("");
                      }
                    }
                  }}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="rounded-xl h-[44px] w-[44px] shrink-0" 
                  disabled={isLoading || !prompt.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        )}
        
        {/* Toggle Button */}
        <Button
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className={`h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 ${isOpen ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageCircleQuestion className="h-6 w-6" />}
        </Button>
      </div>
    </>
  );
}
