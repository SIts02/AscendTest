
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type Assistant } from "@/types/assistant";

interface AssistantSelectProps {
  assistants: Assistant[];
  activeAssistant: Assistant;
  onSelectAssistant: (assistant: Assistant) => void;
}

const AssistantSelect = ({ assistants, activeAssistant, onSelectAssistant }: AssistantSelectProps) => {
  return (
    <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[calc(100vh-20rem)]">
      {assistants.map((assistant) => (
        <Button
          key={assistant.id}
          variant={activeAssistant.id === assistant.id ? "default" : "outline"}
          className={cn(
            "w-full justify-start h-auto py-3 transition-all duration-300 whitespace-normal text-left",
            activeAssistant.id === assistant.id 
              ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md" 
              : `border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20`
          )}
          onClick={() => onSelectAssistant(assistant)}
        >
          <div className="mr-2 flex-shrink-0 p-1.5 bg-white/20 rounded-lg">
            {assistant.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{assistant.name}</p>
            <p className="text-xs text-white/80 dark:text-gray-400 line-clamp-2 break-words">
              {assistant.description}
            </p>
          </div>
        </Button>
      ))}
    </div>
  );
};

export default AssistantSelect;
