import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, Bot, User, Loader, FileText } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { api, type RecommendedLawyer } from '../lib/api';
import { RecommendedLawyers } from './RecommendedLawyers';

interface Message {
  id: number;
  type: 'user' | 'bot';
  text: string;
  timestamp: Date;
  isFallback?: boolean;
  recommendedLawyers?: RecommendedLawyer[];
}

interface TextBotProps {
  onClose: () => void;
}

export function TextBot({ onClose }: TextBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'bot',
      text: 'السلام علیکم! میں Voice2Law کا قانونی معاون ہوں۔ آپ اپنے قانونی سوالات اردو یا انگریزی میں پوچھ سکتے ہیں۔',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    const question = inputText.trim();
    if (question === '') return;

    const userMessage: Message = {
      id: messages.length + 1,
      type: 'user',
      text: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await api.askText({ question });
      const isFallback = response.confidence < 70 || response.answer.includes('AI service is not configured');

      if (isFallback) {
        toast.warning(
          'The legal answer service may be temporarily unavailable — please try again shortly.',
          { duration: 5000 }
        );
      }

      const botMessage: Message = {
        id: userMessage.id + 1,
        type: 'bot',
        text: response.answer,
        timestamp: new Date(),
        isFallback,
        recommendedLawyers: response.recommendedLawyers,
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      toast.error(`Could not get an answer: ${message}`);
      const errorMessage: Message = {
        id: userMessage.id + 1,
        type: 'bot',
        text: 'معذرت، اس وقت جواب حاصل نہیں ہو سکا۔ براہ کرم دوبارہ کوشش کریں۔ (Sorry, the answer could not be retrieved. Please try again.)',
        timestamp: new Date(),
        isFallback: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    'طلاق کا طریقہ کار کیا ہے؟',
    'کرایہ دار کے کیا حقوق ہیں؟',
    'وراثت کی تقسیم کیسے ہوتی ہے؟',
    'نکاح نامہ کی اہمیت'
  ];

  return (
    <div className="fixed inset-0 bg-[#0B3D2E]/95 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="assistant-modal-panel max-w-5xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl animate-scale-in">
        <div className="bg-gradient-to-r from-[#0B3D2E] to-[#1FAA59] px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl text-white">Text Assistant</h2>
              <p className="text-white/80 text-sm urdu-text">متن میں سوال لکھیں</p>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="assistant-modal-body p-3 sm:p-6 pb-10 bg-[#F8F9FA]">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-fade-in-up`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.type === 'user' 
                    ? 'bg-gradient-to-br from-[#C5A253] to-[#D4B76E]' 
                    : 'bg-gradient-to-br from-[#1FAA59] to-[#0B3D2E]'
                }`}>
                  {message.type === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </div>

                <div className={`flex-1 max-w-2xl ${message.type === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`rounded-2xl px-6 py-4 shadow-md ${
                    message.type === 'user'
                      ? 'bg-gradient-to-br from-[#0B3D2E] to-[#1FAA59] text-white'
                      : message.isFallback
                        ? 'bg-amber-50 border-2 border-amber-300 text-[#0B3D2E]'
                        : 'bg-white border border-[#0B3D2E]/10 text-[#0B3D2E]'
                  }`}>
                    {message.type === 'bot' && message.isFallback && (
                      <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-2 bg-amber-200 text-amber-900">
                        Service unavailable
                      </span>
                    )}
                    <p className="leading-relaxed urdu-text" style={{ fontSize: '1rem', lineHeight: '1.7' }}>
                      {message.text}
                    </p>
                    {message.type === 'bot' && message.recommendedLawyers?.length ? (
                      <RecommendedLawyers lawyers={message.recommendedLawyers} compact />
                    ) : null}
                  </div>
                  <span className="text-xs text-[#0B3D2E]/50 mt-2 px-2">
                    {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-4 animate-fade-in">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1FAA59] to-[#0B3D2E] flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white border border-[#0B3D2E]/10 rounded-2xl px-6 py-4 shadow-md">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#1FAA59] animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-[#1FAA59] animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-[#1FAA59] animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {messages.length === 1 && (
          <div className="px-6 py-4 bg-white border-t border-[#0B3D2E]/10">
            <p className="text-sm text-[#0B3D2E]/60 mb-3">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputText(question)}
                  className="px-4 py-2 bg-[#E8F5ED] hover:bg-[#1FAA59]/20 text-[#0B3D2E] rounded-lg transition-all duration-300 text-sm urdu-text border border-[#1FAA59]/20 hover:border-[#1FAA59]/40"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white px-3 sm:px-6 py-3 sm:py-4 border-t border-[#0B3D2E]/10 flex-shrink-0">
          <div className="max-w-4xl mx-auto flex gap-2 sm:gap-4">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="اپنا قانونی سوال یہاں لکھیں... (Type your legal question here...)"
              className="flex-1 bg-[#F8F9FA] border-2 border-[#0B3D2E]/10 focus:border-[#1FAA59] rounded-xl px-6 py-4 outline-none resize-none urdu-text transition-all duration-300"
              rows={2}
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={inputText.trim() === '' || isTyping}
              className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#1FAA59] to-[#0B3D2E] flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed self-end"
            >
              {isTyping ? (
                <Loader className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Send className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
          <p className="text-xs text-[#0B3D2E]/50 text-center mt-3">
            This is general legal information, not legal advice. Consult a lawyer for specific matters.
          </p>
        </div>
      </div>
    </div>
  );
}
