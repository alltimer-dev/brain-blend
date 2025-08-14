import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  role: "user" | "assistant" | "system";
  content: string;
  model?: string;
};

export const ChatMessage: React.FC<Props> = ({ role, content, model }) => {
  const isUser = role === "user";
  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`
          max-w-[70%] rounded-2xl p-4 shadow-sm
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
      </div>
    </div>
  );
};
