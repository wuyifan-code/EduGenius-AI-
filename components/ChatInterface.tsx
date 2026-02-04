import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Sparkles, BookOpen, Brain, PartyPopper, Mic, MicOff } from 'lucide-react';
import { getChatModel, ChatModel, ChatChunk } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { ChatMode } from '../types';

interface ChatInterfaceProps {
  role: 'teacher' | 'student';
  title: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ role, title }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: role === 'teacher' 
        ? "您好，我是您的教学助手。请问今天需要帮忙准备什么教案或分析吗？" 
        : "嗨！我是你的AI导师。学习上遇到什么困难了吗？随时问我！"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ChatMode>('academic');
  const [isListening, setIsListening] = useState(false);
  
  const chatRef = useRef<ChatModel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize chat session once
  useEffect(() => {
    if (!chatRef.current) {
      chatRef.current = getChatModel(role);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'zh-CN';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        // Loop through results to handle interim vs final
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setInput((prev) => prev + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("您的浏览器不支持语音输入功能，请使用 Chrome 或 Edge 浏览器。");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatRef.current) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Inject mode instruction invisibly to the user
      const modeInstruction = mode === 'academic' 
        ? " [系统提示：请使用'学术模式'回答（正式、严谨、教学导向），并务必使用中文。]" 
        : " [系统提示：请使用'趣味模式'回答（幽默、互动、使用emoji），并务必使用中文。]";
      
      const messagePayload = userMsg.text + modeInstruction;

      const resultStream = await chatRef.current.sendMessageStream({ message: messagePayload });
      
      let fullResponse = '';
      const botMsgId = (Date.now() + 1).toString();
      
      // Add initial empty bot message
      setMessages(prev => [...prev, { id: botMsgId, role: 'model', text: '' }]);

      for await (const chunk of resultStream) {
        const c = chunk as ChatChunk;
        if (c.text) {
          fullResponse += c.text;
          setMessages(prev => 
            prev.map(msg => msg.id === botMsgId ? { ...msg, text: fullResponse } : msg)
          );
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "抱歉，我遇到了一些连接问题，请稍后再试。" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden relative">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${role === 'teacher' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{title}</h3>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> 通义千问
            </span>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="bg-slate-200 p-1 rounded-xl flex text-sm font-medium">
          <button
            onClick={() => setMode('academic')}
            className={`px-4 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
              mode === 'academic' 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {mode === 'academic' ? <BookOpen className="w-4 h-4 text-indigo-500" /> : <BookOpen className="w-4 h-4" />}
            学术
          </button>
          <button
            onClick={() => setMode('fun')}
            className={`px-4 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
              mode === 'fun' 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {mode === 'fun' ? <PartyPopper className="w-4 h-4 text-amber-500" /> : <PartyPopper className="w-4 h-4" />}
            趣味
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/30 min-h-0">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
          >
            {msg.role === 'model' && (
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                role === 'teacher' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
              }`}>
                <Bot className="w-5 h-5" />
              </div>
            )}
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-tr-none'
                : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
            }`}>
              <ReactMarkdown
                className="prose prose-sm max-w-none dark:prose-invert"
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex]}
              >
                {msg.text}
              </ReactMarkdown>
            </div>
            {msg.role === 'user' && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleVoiceInput}
            className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            title={isListening ? "停止录音" : "语音输入"}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="输入您的问题..."
              className="w-full p-3 pr-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={isLoading}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full ${
                isLoading ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
