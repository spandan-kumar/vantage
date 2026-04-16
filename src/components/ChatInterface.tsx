import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { Message, Task, AssessmentMode, LocaleCode, ScoringProfileId } from '../types';
import { cn } from '../lib/utils';
import { chatWithExecutiveLLM } from '../services/gemini';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';

interface ChatInterfaceProps {
  task: Task;
  assessmentMode: AssessmentMode;
  locale: LocaleCode;
  userId: string;
  sessionId: string;
  scoringProfileId: ScoringProfileId;
  onComplete: (messages: Message[]) => void;
}

export default function ChatInterface({
  task,
  assessmentMode,
  locale,
  userId,
  sessionId,
  scoringProfileId,
  onComplete,
}: ChatInterfaceProps) {
  const typingDotDelayClasses = ['animate-delay-0', 'animate-delay-150', 'animate-delay-300'] as const;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toChatErrorMessage = (error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const normalized = message.toLowerCase();
    if (normalized.includes('failed to fetch')) {
      return 'Cannot reach the API server. Start both frontend and backend with `npm run dev`.';
    }
    if (normalized.includes('gemini_api_key')) {
      return 'Server is missing GEMINI_API_KEY. Add it in `.env` and restart the server.';
    }
    return `Failed to connect to AI teammates: ${message}`;
  };

  // Initial AI message
  useEffect(() => {
    const initChat = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const initialMessages = await chatWithExecutiveLLM([], task, assessmentMode, {
          locale,
          userId,
          sessionId,
          scoringProfileId,
        });
        setMessages(initialMessages);
      } catch (err) {
        console.error("Failed to initialize chat:", err);
        setError(toChatErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };
    initChat();
  }, [task, assessmentMode, locale, userId, sessionId, scoringProfileId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'User',
      text: input.trim(),
      isUser: true,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const aiResponses = await chatWithExecutiveLLM(newMessages, task, assessmentMode, {
        locale,
        userId,
        sessionId,
        scoringProfileId,
      });
      setMessages([...newMessages, ...aiResponses]);
    } catch (err) {
      console.error("Failed to get AI response:", err);
      setError(toChatErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const userTurnCount = messages.filter((message) => message.isUser).length;
  const minimumEvidenceMet = userTurnCount >= 4;
  const canEvaluate = assessmentMode === 'practice' || minimumEvidenceMet;

  return (
    <Card className="flex flex-col h-[600px] overflow-hidden">
      <div className="p-4 border-b border-theme-border bg-theme-bg flex justify-between items-center">
        <div>
          <h2 className="font-semibold text-theme-text-main">{task.title}</h2>
          <p className="text-sm text-theme-text-muted">Teammates: {task.teammates.join(', ')}</p>
        </div>
        <Button
          onClick={() => onComplete(messages)}
          disabled={!canEvaluate}
          className="px-6 py-2.5"
        >
          End & Evaluate
        </Button>
      </div>
      {!canEvaluate && (
        <div className="px-4 py-2 text-xs text-theme-text-muted border-b border-theme-border bg-theme-bg">
          Add at least {4 - userTurnCount} more user turn(s) to unlock a stable assessment.
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-theme-text-muted mt-10">Starting conversation...</div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 max-w-[80%]",
              msg.isUser ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              msg.isUser ? "bg-theme-accent/10 text-theme-accent" : "bg-theme-bg text-theme-text-muted"
            )}>
              {msg.isUser ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={cn(
              "flex flex-col",
              msg.isUser ? "items-end" : "items-start"
            )}>
              <span className="text-xs text-theme-text-muted mb-1 px-1">{msg.sender}</span>
              <div className={cn(
                "px-4 py-3 rounded-lg border",
                msg.isUser 
                  ? "bg-theme-accent text-white border-theme-accent" 
                  : "bg-theme-surface text-theme-text-main border-theme-border"
              )}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {error && (
          <div className="text-center text-red-500 mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
            {error}
          </div>
        )}
        {isLoading && (
          <div className="flex gap-3 max-w-[80%]">
            <div className="w-8 h-8 rounded-full bg-theme-bg text-theme-text-muted flex items-center justify-center shrink-0">
              <Loader2 size={16} className="animate-spin" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xs text-theme-text-muted mb-1 px-1">Teammates typing...</span>
              <div className="px-4 py-3 rounded-lg border bg-theme-surface text-theme-text-main border-theme-border flex items-center gap-1 h-[46px]">
                {typingDotDelayClasses.map((delayClass) => (
                  <div key={delayClass} className={cn('w-2 h-2 bg-theme-text-muted rounded-full animate-bounce', delayClass)} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-theme-border bg-theme-surface">
        <div className="flex gap-2">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 border-theme-border bg-theme-surface px-4"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2"
          >
            <Send size={20} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
