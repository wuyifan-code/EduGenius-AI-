import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Sparkles, BookOpen, Brain, PartyPopper, Mic, MicOff } from 'lucide-react';
import { getChatModel } from '../services/geminiService';
import { Chat, GenerateContentResponse } from "@google/genai";
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
  
  const chatRef = useRef<Chat | null>(null);
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
        const c = chunk as GenerateContentResponse;
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
              <Sparkles className="w-3 h-3" /> Gemini 3.0 Flash
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
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-indigo-600' : (mode === 'fun' ? 'bg-amber-500' : 'bg-emerald-600')
            }`}>
              {msg.role === 'user' 
                ? <User className="w-5 h-5 text-white" /> 
                : (mode === 'fun' ? <PartyPopper className="w-4 h-4 text-white" /> : <Brain className="w-5 h-5 text-white" />)
              }
            </div>
            <div className={`max-w-[85%] p-3 px-4 rounded-xl text-sm shadow-sm overflow-hidden border ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white border-indigo-600 rounded-tr-none' 
                : 'bg-white text-slate-800 border-slate-200 rounded-tl-none'
            }`}>
              {/* Markdown and Math Renderer */}
              <div className={`prose ${
                  msg.role === 'user' ? 'prose-invert' : 'prose-slate'
                } max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0 break-words leading-relaxed`}>
                <ReactMarkdown
                  remarkPlugins={[remarkMath, remarkGfm]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    p: ({node, ...props}) => <p className="mb-1 last:mb-0" {...props} />
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm ml-12">
            <Loader2 className="w-4 h-4 animate-spin" />
            AI正在{mode === 'fun' ? '酝酿有趣的回答' : '严谨思考'}...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0 z-20 w-full relative">
        <div className="max-w-4xl mx-auto flex gap-2">
          {/* Voice Input Button */}
          <button
            onClick={toggleVoiceInput}
            className={`p-3 rounded-xl transition-all flex items-center justify-center shadow-sm ${
              isListening 
                ? 'bg-rose-50 text-rose-600 border border-rose-200 animate-pulse ring-2 ring-rose-200' 
                : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 hover:text-slate-700'
            }`}
            title="语音输入"
          >
            {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={
              role === 'teacher' 
               ? (mode === 'academic' ? (isListening ? "正在听您说..." : "输入教学指令（学术模式）...") : (isListening ? "正在听您说..." : "输入教学创意（趣味模式）..."))
               : (mode === 'academic' ? (isListening ? "正在听你说..." : "请教一个学术问题...") : (isListening ? "正在听你说..." : "聊聊有趣的学习话题..."))
            }
            className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`text-white px-6 py-3 rounded-xl transition-colors flex items-center justify-center shadow-md hover:shadow-lg ${
              mode === 'fun' ? 'bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300' : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300'
            }`}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};