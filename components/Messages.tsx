import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Language } from '../types';
import { Settings, Search, Send, ArrowLeft, MoreVertical, Image as ImageIcon, X, ChevronLeft } from 'lucide-react';
import { apiService } from '../services/apiService';
import { wsService } from '../services/websocketService';

interface MessagesProps {
  lang: Language;
  initialPartnerId?: string | null;
}

type MessageType = 'TEXT' | 'IMAGE' | 'ORDER' | 'SYSTEM';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  senderId: string;
  receiverId: string;
  type: MessageType;
  imageUrl?: string;
  orderId?: string;
  sender?: {
    id: string;
    email: string;
    profile?: {
      name?: string;
      avatarUrl?: string;
    };
  };
}

interface Conversation {
  partnerId: string;
  partner: {
    id: string;
    email: string;
    profile: {
      name: string | null;
      avatarUrl: string | null;
    } | null;
  };
  lastMessage: {
    id: string;
    content: string;
    type: MessageType;
    imageUrl: string | null;
    createdAt: string;
    isRead: boolean;
    senderId: string;
  };
  unreadCount: number;
  updatedAt: string;
}

export const Messages: React.FC<MessagesProps> = ({ lang, initialPartnerId }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const t = {
    zh: {
      title: '私信',
      search: '搜索私信',
      noMessages: '暂无私信',
      typeMessage: '输入消息...',
      send: '发送',
      online: '在线',
      offline: '离线',
      typing: '正在输入...',
      image: '图片',
      order: '订单',
      system: '系统',
      cancel: '取消',
      confirm: '确定',
      delete: '删除',
      searchResults: '搜索结果',
      noSearchResults: '未找到相关消息',
      loadMore: '加载更多',
      failedToLoad: '加载失败',
      failedToSend: '发送失败',
    },
    en: {
      title: 'Messages',
      search: 'Search messages',
      noMessages: 'No messages yet',
      typeMessage: 'Type a message...',
      send: 'Send',
      online: 'Online',
      offline: 'Offline',
      typing: 'Typing...',
      image: 'Image',
      order: 'Order',
      system: 'System',
      cancel: 'Cancel',
      confirm: 'Confirm',
      delete: 'Delete',
      searchResults: 'Search Results',
      noSearchResults: 'No messages found',
      loadMore: 'Load More',
      failedToLoad: 'Failed to load',
      failedToSend: 'Failed to send',
    },
  }[lang];

  // Get current user ID
  useEffect(() => {
    const user = apiService.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  }, []);

  // Handle initial partner - select conversation when component mounts
  useEffect(() => {
    const selectPartner = () => {
      if (initialPartnerId && conversations.length > 0) {
        const conv = conversations.find(c => c.partnerId === initialPartnerId);
        if (conv) {
          setSelectedConversation(conv);
        }
      }
    };
    // Use setTimeout to avoid synchronous setState within effect
    const timeout = setTimeout(selectPartner, 0);
    return () => clearTimeout(timeout);
  }, [initialPartnerId, conversations]);

  // Connect WebSocket
  useEffect(() => {
    if (apiService.isLoggedIn()) {
      wsService.connect();

      // Listen for incoming messages
      const unsubscribeMessage = wsService.onMessage((message) => {
        // Update conversations
        loadConversations();

        // If in active conversation with sender, add message
        if (selectedConversation?.partnerId === message.senderId) {
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === message.id)) return prev;
            return [...prev, message];
          });

          // Mark as read via WebSocket
          wsService.markAsRead([message.id], message.senderId);
        }
      });

      // Listen for typing indicators
      const unsubscribeTyping = wsService.onTyping((data) => {
        if (selectedConversation?.partnerId === data.senderId) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            if (data.isTyping) {
              newSet.add(data.senderId);
            } else {
              newSet.delete(data.senderId);
            }
            return newSet;
          });
        }
      });

      // Listen for read receipts
      const unsubscribeRead = wsService.onMessageRead((data) => {
        setMessages(prev =>
          prev.map(msg =>
            data.messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
          )
        );
      });

      return () => {
        unsubscribeMessage();
        unsubscribeTyping();
        unsubscribeRead();
      };
    }
  }, [selectedConversation]);

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const data = await apiService.getConversations();
      setConversations(data);
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
      const data = await apiService.getConversationMessages(partnerId);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUserId) return;

    const content = newMessage.trim();
    setNewMessage('');

    // Send via WebSocket
    if (wsService.isConnected()) {
      wsService.sendMessage(selectedConversation.partnerId, content);
    } else {
      // Fallback to HTTP
      try {
        const message = await apiService.sendMessage({
          receiverId: selectedConversation.partnerId,
          content,
        });
        setMessages(prev => [...prev, message]);
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  };

  const handleTyping = () => {
    if (!selectedConversation) return;

    // Send typing indicator
    if (wsService.isConnected()) {
      wsService.sendTyping(selectedConversation.partnerId, true);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds
      typingTimeoutRef.current = setTimeout(() => {
        wsService.sendTyping(selectedConversation.partnerId, false);
      }, 2000);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedConversation) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { url } = await apiService.uploadImage(formData);

      // Send image message via WebSocket
      if (wsService.isConnected()) {
        wsService.sendMessage(
          selectedConversation.partnerId,
          t.image,
          undefined,
          'IMAGE',
          url
        );
      } else {
        // Fallback to HTTP
        const message = await apiService.sendMessage({
          receiverId: selectedConversation.partnerId,
          content: t.image,
          type: 'IMAGE',
          imageUrl: url,
        });
        setMessages(prev => [...prev, message]);
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await apiService.searchMessages(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search messages:', error);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    setSearchResults([]);
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
    return conv.partner.profile?.name || conv.partner.email || 'Unknown User';
  };

  const getPartnerAvatar = (conv: Conversation) => {
    return conv.partner.profile?.avatarUrl || `https://picsum.photos/60/60?random=${conv.partnerId}`;
  };

  const getMessagePreview = (conv: Conversation) => {
    if (conv.lastMessage.type === 'IMAGE') {
      return `[${t.image}]`;
    }
    return conv.lastMessage.content;
  };

  // Search results view
  if (isSearching) {
    return (
      <div className="pb-20">
        <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md px-4 py-3 flex items-center gap-3">
          <ChevronLeft
            className="h-5 w-5 text-slate-900 cursor-pointer"
            onClick={clearSearch}
          />
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={t.search}
              className="w-full bg-slate-100 rounded-full py-2 pl-10 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            {searchQuery && (
              <X
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 cursor-pointer"
                onClick={clearSearch}
              />
            )}
          </div>
        </div>

        <div className="px-4 py-2 bg-slate-50">
          <span className="text-sm text-slate-600">{t.searchResults}: "{searchQuery}"</span>
        </div>

        <div className="divide-y divide-slate-100">
          {searchResults.length === 0 ? (
            <div className="p-8 text-center text-slate-500">{t.noSearchResults}</div>
          ) : (
            searchResults.map((msg) => (
              <div
                key={msg.id}
                onClick={() => {
                  const conv = conversations.find(c => c.partnerId === msg.senderId || c.partnerId === msg.receiverId);
                  if (conv) {
                    setSelectedConversation(conv);
                    clearSearch();
                  }
                }}
                className="p-4 hover:bg-slate-50 cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={msg.sender?.profile?.avatarUrl || `https://picsum.photos/40/40?random=${msg.senderId}`}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="font-medium text-slate-900">
                    {msg.sender?.profile?.name || msg.sender?.email}
                  </span>
                  <span className="text-slate-400 text-sm">{formatTime(msg.createdAt)}</span>
                </div>
                <div className="pl-11">
                  {msg.type === 'IMAGE' ? (
                    <span className="text-teal-600">[{t.image}]</span>
                  ) : (
                    <p className="text-slate-700">{msg.content}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
                    {getMessagePreview(conv)}
                  </div>
                </div>
                {conv.unreadCount > 0 && (
                  <div className="bg-teal-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                    {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
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
            <div className="text-xs text-green-500">
              {typingUsers.has(selectedConversation.partnerId) ? t.typing : t.online}
            </div>
          </div>
        </div>
        <MoreVertical className="h-5 w-5 text-slate-900 cursor-pointer" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isOwn = msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                {/* Sender name for received messages */}
                {!isOwn && msg.sender?.profile?.name && (
                  <div className="text-xs text-slate-500 mb-1 ml-1">{msg.sender.profile.name}</div>
                )}

                <div className={`p-3 rounded-2xl ${
                  isOwn
                    ? 'bg-teal-500 text-white rounded-br-sm'
                    : 'bg-slate-100 text-slate-900 rounded-bl-sm'
                }`}>
                  {msg.type === 'IMAGE' && msg.imageUrl ? (
                    <img
                      src={msg.imageUrl}
                      alt="Message"
                      className="max-w-full rounded-lg cursor-pointer"
                      onClick={() => setSelectedImage(msg.imageUrl!)}
                    />
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>

                <div className={`flex items-center gap-1 text-xs mt-1 ${isOwn ? 'text-slate-400 justify-end' : 'text-slate-400'}`}>
                  <span>{formatTime(msg.createdAt)}</span>
                  {isOwn && (
                    <span>{msg.isRead ? '✓✓' : '✓'}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 p-4 bg-white">
        <div className="flex gap-2 items-center">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2 text-slate-500 hover:text-teal-500 transition-colors"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={t.typeMessage}
            className="flex-1 bg-slate-100 rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isUploading}
            className="bg-teal-500 text-white p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-600 transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
          />
          <button
            className="absolute top-4 right-4 text-white p-2"
            onClick={() => setSelectedImage(null)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>
  );
};
