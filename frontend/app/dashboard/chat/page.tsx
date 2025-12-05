'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApiClient } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IconSend, IconLoader2, IconSparkles, IconChartBar } from '@tabler/icons-react';
import { toast } from 'sonner';
import { ChatMessageSkeleton, PageLoader } from '@/components/loading-skeleton';
import { NoChatHistoryEmptyState } from '@/components/empty-state';
import { ErrorBoundary } from '@/components/error-boundary';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

function ChatPageContent() {
  const api = useApiClient();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | undefined>(
    searchParams.get('analysis_id') || undefined
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load available analyses on mount
  useEffect(() => {
    loadAnalyses();
  }, []);

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadAnalyses = async () => {
    try {
      const data = await api.analyses.list();
      setAnalyses(data.analyses || []);
    } catch (error) {
      console.error('Failed to load analyses:', error);
      // Non-critical error, continue without analyses
    }
  };

  const loadChatHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await api.chat.getHistory();

      // Convert API response to Message format
      const historyMessages: Message[] = response.messages.map((msg: any) => [
        {
          id: msg.id,
          role: 'user' as const,
          content: msg.message,
          created_at: msg.created_at,
        },
        {
          id: `${msg.id}-response`,
          role: 'assistant' as const,
          content: msg.response,
          created_at: msg.created_at,
        },
      ]).flat();

      setMessages(historyMessages);
    } catch (error) {
      console.error('Failed to load chat history:', error);
      toast.error('Failed to load chat history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
    };

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Send to API with selected analysis context
      const response = await api.chat.sendMessage({
        message: input,
        analysis_id: selectedAnalysisId,
      });

      // Add AI response
      const aiMessage: Message = {
        id: response.id,
        role: 'assistant',
        content: response.response,
        created_at: response.created_at,
      };

      setMessages((prev) => [...prev, aiMessage]);

      toast.success('Message sent');
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to send message. Please try again.');

      // Remove user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoadingHistory) {
    return <PageLoader />;
  }

  return (
    <ErrorBoundary>
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        {/* Header */}
        <div className="border-b bg-background p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <IconSparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">AI Manufacturing Assistant</h1>
                <p className="text-sm text-muted-foreground">
                  Ask questions about your production data and get instant insights
                </p>
              </div>
            </div>

            {/* Analysis Context Selector */}
            {analyses.length > 0 && (
              <div className="flex items-center gap-2">
                <IconChartBar className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={selectedAnalysisId || 'none'}
                  onValueChange={(value) =>
                    setSelectedAnalysisId(value === 'none' ? undefined : value)
                  }
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select analysis..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No context</SelectItem>
                    {analyses.map((analysis) => (
                      <SelectItem key={analysis.id} value={analysis.id}>
                        {analysis.summary || `Analysis ${analysis.batch_id?.slice(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <NoChatHistoryEmptyState />
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.map((message, index) => (
                <div
                  key={message.id || index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <Card
                    className={`max-w-[80%] p-4 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    {message.created_at && (
                      <p className="mt-2 text-xs opacity-70">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    )}
                  </Card>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <Card className="max-w-[80%] bg-muted p-4">
                    <div className="flex items-center gap-2">
                      <IconLoader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="border-t bg-background p-4">
          <div className="mx-auto max-w-3xl">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about your production data..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                size="icon"
              >
                {isLoading ? (
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <IconSend className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ChatPageContent />
    </Suspense>
  );
}
