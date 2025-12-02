"use client";

import * as React from "react";
import { IconSend, IconUser, IconRobot, IconLoader } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  analysisId: string;
  analysisContext?: any; // Contains patterns, work orders, etc.
}

export function AIChat({ analysisId, analysisContext }: AIChatProps) {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your manufacturing intelligence assistant. I've analyzed your production data and identified several cost-saving opportunities. Ask me anything about your analysis results, patterns, or specific work orders.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // TODO: Call AI API endpoint
    // For now, simulate with mock responses
    setTimeout(() => {
      const mockResponses: Record<string, string> = {
        "supplier a": "Based on the analysis, Supplier A shows a consistent 18% cost increase compared to your historical baseline. This affects 24 work orders with a total variance of $15,200. I recommend negotiating new pricing or exploring alternative suppliers for these materials.",
        "assembly line 3": "Assembly Line 3 is showing 15% longer cycle times compared to similar operations. This appears to be a process efficiency issue rather than equipment-related. I suggest reviewing the workflow, training, and tooling setup on this line.",
        "why": "The high material variance from Supplier A is likely due to recent price increases that haven't been reflected in your standard costs. The baseline data shows stable pricing for 90 days before the spike in January.",
        "machine m-401": "Machine M-401's maintenance events correlate with a 22% increase in labor hours on dependent operations. This suggests that preventive maintenance scheduling could be optimized to minimize downstream impact.",
        "save": "Based on the patterns identified, you have approximately $42,000 in savings opportunities across material sourcing optimization ($8,500), labor efficiency improvements ($6,200), better scheduling ($12,000), and equipment maintenance optimization ($11,000). These are conservative estimates with high confidence levels.",
      };

      const lowerInput = userMessage.content.toLowerCase();
      let responseContent =
        "I can help you understand any aspect of your production analysis. Try asking about specific suppliers, work orders, equipment, or cost patterns. For example: 'Why is Supplier A more expensive?' or 'How can we improve Assembly Line 3 efficiency?'";

      // Find matching mock response
      for (const [key, value] of Object.entries(mockResponses)) {
        if (lowerInput.includes(key)) {
          responseContent = value;
          break;
        }
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: responseContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000 + Math.random() * 1000); // Simulate network delay
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-[600px] rounded-lg border bg-card">
      {/* Chat Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <IconRobot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">Manufacturing AI Assistant</h3>
            <p className="text-xs text-muted-foreground">
              Ask questions about your analysis
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" && "flex-row-reverse"
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                  message.role === "assistant"
                    ? "bg-primary"
                    : "bg-muted"
                )}
              >
                {message.role === "assistant" ? (
                  <IconRobot className="h-4 w-4 text-primary-foreground" />
                ) : (
                  <IconUser className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              {/* Message Content */}
              <div
                className={cn(
                  "flex-1 space-y-1 max-w-[80%]",
                  message.role === "user" && "flex flex-col items-end"
                )}
              >
                <div
                  className={cn(
                    "rounded-lg px-4 py-2",
                    message.role === "assistant"
                      ? "bg-muted"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                <span className="text-xs text-muted-foreground px-2">
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <IconRobot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex-1 max-w-[80%]">
                <div className="rounded-lg px-4 py-2 bg-muted">
                  <div className="flex items-center gap-2">
                    <IconLoader className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Thinking...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            placeholder="Ask about suppliers, work orders, patterns, or savings opportunities..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="min-h-[60px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            <IconSend className="h-5 w-5" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
