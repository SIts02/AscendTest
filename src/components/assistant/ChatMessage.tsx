import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bot, Clock, ThumbsDown, ThumbsUp, User } from "lucide-react";
import { type Message } from "@/types/assistant";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  message: Message;
  assistantName: string;
  onFeedback: (positive: boolean) => void;
  onSuggestionClick?: (suggestion: string) => void;
}

const ChatMessage = ({ message, assistantName, onFeedback, onSuggestionClick }: ChatMessageProps) => {
  return (
    <div
      className={cn(
        "flex animate-fade-in",
        message.role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg p-4",
          message.role === "user"
            ? "bg-gradient-to-r from-momoney-600 to-momoney-500 text-white"
            : "bg-muted text-foreground"
        )}
      >
        <div className="flex items-center mb-2">
          {message.role === "assistant" ? (
            <Avatar className="h-6 w-6 mr-2">
              <AvatarFallback className="bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          ) : (
            <Avatar className="h-6 w-6 mr-2">
              <AvatarFallback className="bg-muted-foreground/20 text-muted-foreground">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          )}
          <span className="text-xs">
            {message.role === "assistant" ? assistantName : "Você"}
          </span>
          <span className="text-xs ml-auto flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit"
            })}
          </span>
        </div>
        <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        {message.suggestions && message.suggestions.length > 0 && onSuggestionClick && (
          <div className="mt-3 space-y-2">
            {message.suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="w-full text-left justify-start text-xs h-auto py-2 bg-white/10 hover:bg-white/20 border-white/20"
                onClick={() => onSuggestionClick(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}

        {message.role === "assistant" && (
          <div className="flex justify-end mt-2 space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 hover:bg-white/10"
              onClick={() => onFeedback(true)}
            >
              <ThumbsUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 hover:bg-white/10"
              onClick={() => onFeedback(false)}
            >
              <ThumbsDown className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;