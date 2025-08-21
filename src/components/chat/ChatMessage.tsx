import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Terminal } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LogModal, type LogEntry } from "./LogModal";

type Props = {
  role: "user" | "assistant" | "system";
  content: string;
  model?: string;
  log?: LogEntry;
};

export const ChatMessage: React.FC<Props> = ({ role, content, model, log }) => {
  const isUser = role === "user";
  const [logModalOpen, setLogModalOpen] = useState(false);

  return (
    <TooltipProvider>
      <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-4`}>
        <div
          className={`
            max-w-[65%] rounded-2xl p-4 shadow-sm
            ${isUser 
              ? "bg-primary text-primary-foreground ml-auto" 
              : "bg-card border text-card-foreground"
            }
          `}
        >
          <div className={`text-xs uppercase tracking-wide mb-2 ${isUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            {isUser ? "You" : role === "assistant" ? (model ? `AI (${model})` : "AI") : "System"}
          </div>
          <div className={`prose max-w-none prose-pre:bg-muted prose-pre:p-3 prose-code:before:content-[''] prose-code:after:content-[''] ${isUser ? "prose-invert" : "prose-neutral dark:prose-invert"}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
          
          {/* Terminal icon for AI responses with log */}
          {!isUser && log && (
            <div className="flex justify-start mt-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setLogModalOpen(true)}
                    className="p-1 rounded-md hover:bg-muted/50 transition-colors duration-200 group"
                    aria-label="View AI response log"
                  >
                    <Terminal className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>See AI response log</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </div>
      
      {/* Log Modal */}
      {log && (
        <LogModal
          isOpen={logModalOpen}
          onClose={() => setLogModalOpen(false)}
          log={log}
        />
      )}
    </TooltipProvider>
  );
};