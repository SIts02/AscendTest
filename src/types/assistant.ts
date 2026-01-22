
export interface Assistant {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  suggestions?: string[];
}

export interface ConversationHistory {
  id: string;
  title: string;
  date: Date;
  assistantId: string;
  preview: string;
}
