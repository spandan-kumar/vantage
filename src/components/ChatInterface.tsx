import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { Message, Task } from '../types';
import { cn } from '../lib/utils';
import { chatWithExecutiveLLM } from '../services/gemini';

interface ChatInterfaceProps {
  task: Task;
  onComplete: (messages: Message[]) => void;
}

export default function ChatInterface({ task, onComplete }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial AI message
  useEffect(() => {
    const initChat = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const initialMessages = await chatWithExecutiveLLM([], task);
        setMessages(initialMessages);
      } catch (err) {
        console.error("Failed to initialize chat:", err);
        setError("Failed to connect to AI teammates. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    initChat();
  }, [task]);

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
      const aiResponses = await chatWithExecutiveLLM(newMessages, task);
      setMessages([...newMessages, ...aiResponses]);
    } catch (err) {
      console.error("Failed to get AI response:", err);
      setError("Failed to get a response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-theme-surface rounded-lg shadow-sm border border-theme-border overflow-hidden">
      <div className="p-4 border-b border-theme-border bg-theme-bg flex justify-between items-center">
        <div>
          <h2 className="font-semibold text-theme-text-main">{task.title}</h2>
          <p className="text-sm text-theme-text-muted">Teammates: {task.teammates.join(', ')}</p>
        </div>
        <button
          onClick={() => onComplete(messages)}
          className="px-6 py-2.5 bg-theme-accent text-white text-sm font-semibold rounded-md hover:opacity-90 transition-colors border-none"
        >
          End & Evaluate
        </button>
      </div>

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
                <div className="w-2 h-2 bg-theme-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-theme-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-theme-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-theme-border bg-theme-surface">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-theme-border rounded-md focus:outline-none focus:border-theme-accent bg-theme-surface text-theme-text-main"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-theme-accent text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-none"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
