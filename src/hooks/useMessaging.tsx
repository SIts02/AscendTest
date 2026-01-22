
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  read: boolean;
  sender_name?: string;
  sender_avatar?: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  lastMessage?: string;
  unreadCount: number;
  lastActivity: Date;
}

export function useMessaging() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Fetch user contacts from database
  const fetchContacts = async () => {
    if (!user?.id) return;
    
    setIsLoadingContacts(true);
    
    try {
      // First get all the contacts
      const { data: contactsData, error } = await supabase
        .from('contacts')
        .select('contact_id, created_at, updated_at, last_message_at')
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      if (contactsData && contactsData.length > 0) {
        // Get the profile information for each contact
        const contactIds = contactsData.map(c => c.contact_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, email, avatar_url')
          .in('id', contactIds);
          
        if (profilesError) throw profilesError;
        
        // Create contacts from profiles
        const contactsWithDetails = await Promise.all(profilesData.map(async (profile) => {
          // Get unread count
          const { count, error: countError } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('sender_id', profile.id)
            .eq('receiver_id', user.id)
            .eq('read', false);
            
          if (countError) console.error("Error getting unread count:", countError);
          
          // Get last message between the user and this contact
          const { data: lastMessageData, error: lastMessageError } = await supabase
            .from('messages')
            .select('content, created_at')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (lastMessageError) console.error("Error getting last message:", lastMessageError);
          
          // Find the contact data for this profile
          const contactData = contactsData.find(c => c.contact_id === profile.id);
          
          return {
            id: profile.id,
            name: profile.name || profile.email.split('@')[0],
            email: profile.email,
            avatar_url: profile.avatar_url,
            lastMessage: lastMessageData && lastMessageData[0] ? lastMessageData[0].content : undefined,
            unreadCount: count || 0,
            lastActivity: new Date(lastMessageData && lastMessageData[0] ? 
              lastMessageData[0].created_at : 
              contactData.last_message_at || contactData.updated_at || contactData.created_at)
          };
        }));
        
        // Sort contacts by last activity
        const sortedContacts = contactsWithDetails.sort((a, b) => 
          b.lastActivity.getTime() - a.lastActivity.getTime()
        );
        
        setContacts(sortedContacts);
      } else {
        setContacts([]);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast.error("Erro ao carregar contatos");
    } finally {
      setIsLoadingContacts(false);
    }
  };
  
  // Load messages for a selected contact
  const loadMessages = async (contactId: string) => {
    if (!user?.id) return;
    
    setIsLoadingMessages(true);
    
    try {
      // Get messages between the user and the selected contact
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      // Get the contact's profile details
      const { data: contactData, error: contactError } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', contactId)
        .single();
        
      if (contactError) throw contactError;
      
      // Get the user's profile details
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .single();
        
      if (userError) throw userError;
      
      // Format messages with sender information
      const formattedMessages = data.map(msg => ({
        ...msg,
        sender_name: msg.sender_id === user.id ? userData?.name || 'Você' : contactData.name || 'Usuário',
        sender_avatar: msg.sender_id === user.id ? userData?.avatar_url : contactData.avatar_url
      }));
      
      setMessages(formattedMessages);
      
      // Mark unread messages as read
      const unreadMessages = data.filter(msg => 
        msg.receiver_id === user.id && !msg.read
      );
      
      if (unreadMessages.length > 0) {
        const unreadIds = unreadMessages.map(msg => msg.id);
        await supabase
          .from('messages')
          .update({ read: true })
          .in('id', unreadIds);
          
        // Update the contacts list to reflect that messages are now read
        setContacts(prev => 
          prev.map(contact => {
            if (contact.id === contactId) {
              return { ...contact, unreadCount: 0 };
            }
            return contact;
          })
        );
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Erro ao carregar mensagens");
    } finally {
      setIsLoadingMessages(false);
    }
  };
  
  // Select a contact and load messages
  const selectContact = (contact: Contact) => {
    setActiveContact(contact);
    loadMessages(contact.id);
  };
  
  // Send message to a contact
  const sendMessage = async (content: string) => {
    if (!content.trim() || !activeContact || !user?.id) return false;
    
    try {
      const newMessage = {
        sender_id: user.id,
        receiver_id: activeContact.id,
        content: content.trim(),
        read: false
      };
      
      const { data, error } = await supabase
        .from('messages')
        .insert(newMessage)
        .select()
        .single();
        
      if (error) throw error;
      
      // Add sender information to the message
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .single();
        
      if (profileError) throw profileError;
      
      const messageWithSender = {
        ...data,
        sender_name: profile?.name || 'Você',
        sender_avatar: profile?.avatar_url
      };
      
      // Update messages list
      setMessages(prev => [...prev, messageWithSender]);
      
      // Update the contact's last activity
      const { error: updateError } = await supabase
        .from('contacts')
        .update({ 
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('contact_id', activeContact.id);
        
      if (updateError) console.error("Error updating contact:", updateError);
      
      // Update contacts list to show the latest message
      setContacts(prev => 
        prev.map(contact => {
          if (contact.id === activeContact.id) {
            return { 
              ...contact, 
              lastMessage: content.trim(),
              lastActivity: new Date()
            };
          }
          return contact;
        }).sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
      );
      
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem");
      return false;
    }
  };
  
  // Search users by email
  const searchUsers = async (email: string) => {
    if (!email.trim() || !user?.id) return [];
    
    try {
      // Search for user with this email
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url')
        .ilike('email', `%${email.trim()}%`)
        .neq('id', user.id) // Don't include the current user
        .limit(5);
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error("Error searching user:", error);
      toast.error("Erro ao buscar usuário");
      return [];
    }
  };
  
  // Add new contact
  const addContact = async (contactId: string) => {
    if (!user?.id) return false;
    
    try {
      // First check if contact already exists
      const { data: existingContact, error: checkError } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', user.id)
        .eq('contact_id', contactId)
        .maybeSingle();
        
      if (checkError) throw checkError;
      
      if (existingContact) {
        toast.info("Contato já adicionado");
        
        // Find and select the existing contact
        const existing = contacts.find(c => c.id === contactId);
        if (existing) {
          selectContact(existing);
        } else {
          await fetchContacts();
          // Need to refetch contacts since this one wasn't in the list
        }
        return true;
      }
      
      // Add new contact
      const { error } = await supabase
        .from('contacts')
        .insert({
          user_id: user.id,
          contact_id: contactId
        });
        
      if (error) throw error;
      
      // Get the contact's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url')
        .eq('id', contactId)
        .single();
        
      if (profileError) throw profileError;
      
      // Update the contacts list
      const newContact: Contact = {
        id: profile.id,
        name: profile.name || profile.email.split('@')[0],
        email: profile.email,
        avatar_url: profile.avatar_url,
        unreadCount: 0,
        lastActivity: new Date()
      };
      
      setContacts(prev => [newContact, ...prev]);
      setActiveContact(newContact);
      setMessages([]);
      
      toast.success("Contato adicionado com sucesso!");
      return true;
    } catch (error) {
      console.error("Error adding contact:", error);
      toast.error("Erro ao adicionar contato");
      return false;
    }
  };

  // Load contacts on initial render
  useEffect(() => {
    if (user?.id) {
      fetchContacts();
    }
  }, [user?.id]);

  // Subscribe to new messages using Supabase realtime
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('messages_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('New message received:', payload);
          
          // Fetch the sender's profile to get name and avatar
          const { data: senderData } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('id', payload.new.sender_id)
            .single();
            
          const newMessage = {
            ...payload.new,
            sender_name: senderData?.name || 'Unknown User',
            sender_avatar: senderData?.avatar_url
          };
          
          // If message belongs to active conversation, add it to the messages list
          if (activeContact && (activeContact.id === payload.new.sender_id)) {
            setMessages(prev => [...prev, newMessage as Message]);
            
            // Mark message as read immediately if it's from the active contact
            await supabase
              .from('messages')
              .update({ read: true })
              .eq('id', payload.new.id);
          } else {
            // Check if sender is in contacts, if not, need to refresh contacts
            if (!contacts.some(contact => contact.id === payload.new.sender_id)) {
              fetchContacts();
            } else {
              // Update unread count for this contact
              setContacts(prev => 
                prev.map(contact => {
                  if (contact.id === payload.new.sender_id) {
                    return {
                      ...contact,
                      lastMessage: payload.new.content,
                      unreadCount: contact.unreadCount + 1,
                      lastActivity: new Date()
                    };
                  }
                  return contact;
                })
              );
            }
            
            // Show notification
            toast("Nova mensagem!", {
              description: `${senderData?.name || 'Unknown User'}: ${payload.new.content.substring(0, 50)}${payload.new.content.length > 50 ? '...' : ''}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, activeContact, contacts]);

  return {
    contacts,
    messages,
    activeContact,
    isLoadingContacts,
    isLoadingMessages,
    fetchContacts,
    selectContact,
    sendMessage,
    searchUsers,
    addContact,
    setActiveContact
  };
}
