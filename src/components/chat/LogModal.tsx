import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type LogEntry = {
  id: string;
  timestamp: string;
  model: string;
  tokensUsed?: number;
  success: boolean;
  error?: string;
  responseTime?: number;
  requestContent: string;
  responseContent: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  log: LogEntry;
};

export const LogModal: React.FC<Props> = ({ isOpen, onClose, log }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">AI Response Log</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="font-medium text-muted-foreground">Model:</label>
                <p className="text-foreground">{log.model}</p>
              </div>
              <div>
                <label className="font-medium text-muted-foreground">Status:</label>
                <p className={log.success ? "text-green-600" : "text-red-600"}>
                  {log.success ? "Success" : "Failed"}
                </p>
              </div>
              <div>
                <label className="font-medium text-muted-foreground">Timestamp:</label>
                <p className="text-foreground">{new Date(log.timestamp).toLocaleString()}</p>
              </div>
              <div>
                <label className="font-medium text-muted-foreground">Response Time:</label>
                <p className="text-foreground">{log.responseTime ? `${log.responseTime}ms` : "N/A"}</p>
              </div>
              {log.tokensUsed && (
                <div>
                  <label className="font-medium text-muted-foreground">Tokens Used:</label>
                  <p className="text-foreground">{log.tokensUsed}</p>
                </div>
              )}
            </div>
            
            {log.error && (
              <div>
                <label className="font-medium text-muted-foreground">Error:</label>
                <p className="text-red-600 text-sm mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  {log.error}
                </p>
              </div>
            )}
            
            <div>
              <label className="font-medium text-muted-foreground">User Input:</label>
              <div className="mt-1 p-3 bg-muted rounded text-sm">
                {log.requestContent}
              </div>
            </div>
            
            <div>
              <label className="font-medium text-muted-foreground">AI Response:</label>
              <div className="mt-1 p-3 bg-muted rounded text-sm">
                {log.responseContent}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};