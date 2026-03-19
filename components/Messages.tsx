import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Language } from '../types';
import { Settings, Search, Send, ArrowLeft, MoreVertical } from 'lucide-react';
import { apiService } from '../services/apiService';

interface MessagesProps {
  lang: Language;
}

interface Conversation {
  partnerId: string;
  partner: {
    id: string;
    profile?: { name?: string; avatarUrl?: string };
  };
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    isRead: boolean;
    senderId: string;
  };
  unreadCount: number;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  senderId: string;
}

export const Messages: React.FC<MessagesProps> = ({ lang }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const t = {
    zh: {
      title: '私信',
      search: '搜索私信',
      noMessages: '暂无私信',
      typeMessage: '输入消息...',
      send: '发送',
      online: '在线',
      offline: '离线',
    },
    en: {
      title: 'Messages',
      search: 'Search messages',
      noMessages: 'No messages yet',
      typeMessage: 'Type a message...',
      send: 'Send',
      online: 'Online',
      offline: 'Offline',
    },
  }[lang];

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const data = await fetch('/api/messages/conversations').then(r => r.json());
      if (data.success && data.data) {
        setConversations(data.data);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load messages when conversation selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.partnerId);
    }
  }, [selectedConversation]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (partnerId: string) => {
    try {
      const data = await fetch(`/api/messages/${partnerId}`).then(r => r.json());
      if (data.success && data.data) {
        setMessages(data.data);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const data = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedConversation.partnerId,
          content: newMessage,
        }),
      }).then(r => r.json());

      if (data.success && data.data) {
        setMessages(prev => [...prev, data.data]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return lang === 'zh' ? '刚刚' : 'Just now';
    if (diffMins < 60) return `${diffMins}${lang === 'zh' ? '分钟前' : 'm ago'}`;
    if (diffHours < 24) return `${diffHours}${lang === 'zh' ? '小时前' : 'h ago'}`;
    if (diffDays < 7) return `${diffDays}${lang === 'zh' ? '天前' : 'd ago'}`;
    return date.toLocaleDateString();
  };

  const getPartnerName = (conv: Conversation) => {
    return conv.partner.profile?.name || 'Unknown User';
  };

  const getPartnerAvatar = (conv: Conversation) => {
    return conv.partner.profile?.avatarUrl || `https://picsum.photos/60/60?random=${conv.partnerId}`;
  };

  // If no conversation selected, show conversation list
  if (!selectedConversation) {
    return (
      <div className="pb-20">
        <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">{t.title}</h1>
          <Settings className="h-5 w-5 text-slate-900 cursor-pointer" />
        </div>

        <div className="px-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder={t.search}
              className="w-full bg-slate-100 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-500">{t.noMessages}</div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.partnerId}
                onClick={() => setSelectedConversation(conv)}
                className="p-4 hover:bg-slate-50 cursor-pointer flex gap-3"
              >
                <img
                  src={getPartnerAvatar(conv)}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${conv.unreadCount > 0 ? 'text-slate-900' : 'text-slate-700'}`}>
                      {getPartnerName(conv)}
                    </span>
                    <span className="text-slate-500 text-sm">
                      {formatTime(conv.lastMessage.createdAt)}
                    </span>
                  </div>
                  <div className={`truncate ${conv.unreadCount > 0 ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
                    {conv.lastMessage.content}
                  </div>
                </div>
                {conv.unreadCount > 0 && (
                  <div className="bg-teal-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {conv.unreadCount}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Show conversation
  return (
    <div className="pb-20 h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <ArrowLeft
            className="h-5 w-5 text-slate-900 cursor-pointer"
            onClick={() => setSelectedConversation(null)}
          />
          <div className="relative">
            <img
              src={getPartnerAvatar(selectedConversation)}
              alt=""
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          </div>
          <div>
            <div className="font-bold text-slate-900">{getPartnerName(selectedConversation)}</div>
            <div className="text-xs text-green-500">{t.online}</div>
          </div>
        </div>
        <MoreVertical className="h-5 w-5 text-slate-900 cursor-pointer" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isOwn = msg.senderId === selectedConversation.partnerId; // Simplified - should check current user
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-3 rounded-2xl ${
                isOwn
                  ? 'bg-teal-500 text-white rounded-br-sm'
                  : 'bg-slate-100 text-slate-900 rounded-bl-sm'
              }`}>
                <p>{msg.content}</p>
                <div className={`text-xs mt-1 ${isOwn ? 'text-teal-100' : 'text-slate-500'}`}>
                  {formatTime(msg.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={t.typeMessage}
            className="flex-1 bg-slate-100 rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="bg-teal-500 text-white p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
