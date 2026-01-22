
import { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { MessageSquare, Send, Search, Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Textarea } from "@/components/ui/textarea";
import { useMessaging, Contact } from "@/hooks/useMessaging";

const Mensagens = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showContactSheet, setShowContactSheet] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [input, setInput] = useState("");

  const {
    contacts,
    messages,
    activeContact,
    isLoadingContacts,
    isLoadingMessages,
    selectContact,
    sendMessage,
    searchUsers,
    addContact,
    setActiveContact
  } = useMessaging();

  // Scroll to bottom of messages when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Set page title
  useEffect(() => {
    document.title = "MoMoney | Mensagens";
  }, []);

  // Handle sending a message
  const handleSendMessage = () => {
    if (input.trim() && sendMessage(input)) {
      setInput("");
    }
  };

  // Handle search user by email
  const handleSearchUser = async () => {
    if (!searchEmail.trim()) return;
    
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      const results = await searchUsers(searchEmail);
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  };

  // Helper function to get initials from a name
  const getInitials = (name: string = "") => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Format time from a date object
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date in a user-friendly way
  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Hoje";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ontem";
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <DashboardLayout activePage="Mensagens">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
        {/* Contacts Sidebar */}
        <div className="md:col-span-1">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Mensagens</CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowContactSheet(true)}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="relative mt-2">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Buscar conversas" 
                  className="pl-8" 
                />
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto pt-0">
              {isLoadingContacts ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : contacts.length > 0 ? (
                <div className="space-y-1">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${
                        activeContact?.id === contact.id
                          ? "bg-blue-50 dark:bg-blue-900/30"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => selectContact(contact)}
                    >
                      <Avatar className="h-10 w-10">
                        {contact.avatar_url ? (
                          <AvatarImage src={contact.avatar_url} alt={contact.name} />
                        ) : (
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {getInitials(contact.name)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate">{contact.name}</span>
                          <span className="text-xs text-gray-500">
                            {formatDate(contact.lastActivity)}
                          </span>
                        </div>
                        {contact.lastMessage && (
                          <p className="text-sm text-gray-500 truncate">
                            {contact.lastMessage}
                          </p>
                        )}
                      </div>
                      {contact.unreadCount > 0 && (
                        <Badge className="ml-auto bg-blue-500">{contact.unreadCount}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <MessageSquare className="h-12 w-12 text-gray-300 mb-2" />
                  <h3 className="text-lg font-medium">Nenhum contato ainda</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Adicione contatos para iniciar conversas
                  </p>
                  <Button 
                    onClick={() => setShowContactSheet(true)}
                    className="mt-4"
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Adicionar Contato
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Chat Area */}
        <div className="md:col-span-3">
          {activeContact ? (
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center">
                  <Avatar className="h-9 w-9 mr-2">
                    {activeContact.avatar_url ? (
                      <AvatarImage src={activeContact.avatar_url} alt={activeContact.name} />
                    ) : (
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {getInitials(activeContact.name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{activeContact.name}</CardTitle>
                    <CardDescription className="text-xs">{activeContact.email}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoadingMessages ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_id === user?.id ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg p-3 ${
                          message.sender_id === user?.id
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        <p>{message.content}</p>
                        <div className="flex justify-end mt-1">
                          <span className="text-xs opacity-70">
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <MessageSquare className="h-12 w-12 text-gray-300 mb-2" />
                    <h3 className="text-lg font-medium">Nenhuma mensagem</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Envie a primeira mensagem para iniciar a conversa
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </CardContent>
              
              <CardFooter className="border-t p-3">
                <form
                  className="flex w-full items-center space-x-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                >
                  <Textarea
                    placeholder="Digite sua mensagem..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button type="submit" size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardFooter>
            </Card>
          ) : (
            <Card className="h-full flex flex-col items-center justify-center">
              <div className="text-center p-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium">Nenhuma conversa selecionada</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Selecione um contato para começar a conversar
                </p>
                <Button 
                  onClick={() => setShowContactSheet(true)}
                  className="mt-4"
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" /> Adicionar Contato
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Add Contact Sheet */}
      <Sheet open={showContactSheet} onOpenChange={setShowContactSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Adicionar Contato</SheetTitle>
            <SheetDescription>
              Busque um usuário pelo email para iniciar uma conversa.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <div className="space-y-2">
              <form 
                className="flex gap-2" 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearchUser();
                }}
              >
                <Input
                  placeholder="Buscar por email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={isSearching}>
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </form>
            </div>

            <div className="mt-4">
              {searchResults.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium mb-2">Resultados da Busca</h4>
                  {searchResults.map((user) => (
                    <div 
                      key={user.id} 
                      className="flex items-center justify-between p-2 border rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-10 w-10">
                          {user.avatar_url ? (
                            <AvatarImage src={user.avatar_url} alt={user.name || user.email} />
                          ) : (
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {getInitials(user.name || user.email)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name || user.email.split('@')[0]}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => addContact(user.id)}
                      >
                        Adicionar
                      </Button>
                    </div>
                  ))}
                </div>
              ) : searchEmail && !isSearching ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">Nenhum usuário encontrado com este email.</p>
                </div>
              ) : null}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default Mensagens;
