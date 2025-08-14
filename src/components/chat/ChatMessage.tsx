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
    <div
      className={
        "rounded-lg border bg-card text-card-foreground shadow-sm p-4" +
        (isUser ? "" : "")
      }
      style={{ boxShadow: "var(--shadow-soft)" as any }}
    >
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
        {isUser ? "You" : role === "assistant" ? (model ? `AI (${model})` : "AI") : "System"}
      </div>
      <div className="prose prose-neutral dark:prose-invert max-w-none prose-pre:bg-muted prose-pre:p-3 prose-code:before:content-[''] prose-code:after:content-['']">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
};
