import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AIAssistant() {
  const { t } = useLanguage();

  const SUGGESTED_ACTIONS = [
    { id: 'schedule', icon: 'event', label: t('ai_assistant.suggest.schedule.label'), desc: t('ai_assistant.suggest.schedule.desc') },
    { id: 'draft', icon: 'edit_note', label: t('ai_assistant.suggest.draft.label'), desc: t('ai_assistant.suggest.draft.desc') },
    { id: 'analyze', icon: 'insights', label: t('ai_assistant.suggest.analyze.label'), desc: t('ai_assistant.suggest.analyze.desc') },
    { id: 'detect', icon: 'person_off', label: t('ai_assistant.suggest.detect.label'), desc: t('ai_assistant.suggest.detect.desc') },
  ];

  const INITIAL_MESSAGES = [
    { id: 1, type: 'assistant', text: t('ai_assistant.msg.welcome'), time: '09:00 AM' },
  ];

  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;
    
    const newUserMsg = {
      id: Date.now(),
      type: 'user',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsTyping(true);

    // Mock AI response
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'assistant',
        text: t('ai_assistant.msg.mock_response'),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1500);
  };

  const handleQuickAction = (actionId: string) => {
    let promptText = "";
    switch(actionId) {
      case 'schedule': promptText = t('ai_assistant.suggest.schedule.prompt'); break;
      case 'draft': promptText = t('ai_assistant.suggest.draft.prompt'); break;
      case 'analyze': promptText = t('ai_assistant.suggest.analyze.prompt'); break;
      case 'detect': promptText = t('ai_assistant.suggest.detect.prompt'); break;
      default: promptText = "Execute quick action.";
    }
    handleSendMessage(promptText);
  };

  return (
    <div className="flex flex-col h-full bg-surface lg:flex-row relative overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-outline-variant/30">
        {/* Header */}
        <div className="flex-none p-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">smart_toy</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface">{t('ai_assistant.title')}</h2>
              <p className="text-xs text-on-surface-variant flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                {t('ai_assistant.status.online')}
              </p>
            </div>
          </div>
          <button className="p-2 rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">more_vert</span>
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="text-center py-4">
            <span className="text-xs font-medium text-on-surface-variant/70 bg-surface-variant/50 px-3 py-1 rounded-full">
              {t('ai_assistant.today')}
            </span>
          </div>

          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-sm ${
                  msg.type === 'user' 
                    ? 'bg-primary text-on-primary rounded-tr-sm' 
                    : 'bg-surface-variant text-on-surface-variant rounded-tl-sm'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
                <span className="text-[10px] text-on-surface-variant/70 mt-1 mx-1">
                  {msg.time}
                </span>
              </motion.div>
            ))}
            
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-start"
              >
                <div className="bg-surface-variant text-on-surface-variant rounded-2xl rounded-tl-sm p-4 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-on-surface-variant/50 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-on-surface-variant/50 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-on-surface-variant/50 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-none p-4 border-t border-outline-variant/30 bg-surface z-10">
          <div className="relative flex items-center">
            <button className="absolute left-3 p-1.5 rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">add_circle</span>
            </button>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage(inputValue);
              }}
              placeholder={t('ai_assistant.input.placeholder')}
              className="w-full bg-surface-variant/30 border border-outline-variant/50 rounded-full py-3.5 pl-12 pr-14 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-on-surface-variant/50"
            />
            <button 
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim()}
              className="absolute right-2.5 p-2 rounded-full bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-all flex items-center justify-center shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </div>
          <div className="mt-2 text-center">
            <span className="text-[10px] text-on-surface-variant/60">{t('ai_assistant.disclaimer')}</span>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Context & Quick Actions */}
      <div className="w-full lg:w-80 flex-none bg-surface/50 overflow-y-auto hidden lg:flex flex-col border-l border-outline-variant/30">
        <div className="p-6">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4">{t('ai_assistant.sidebar.suggested_actions')}</h3>
          <div className="space-y-3">
            {SUGGESTED_ACTIONS.map(action => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action.id)}
                className="w-full text-left p-3 rounded-xl border border-outline-variant/50 hover:border-primary/50 hover:bg-primary/5 transition-all group bg-surface"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-variant group-hover:bg-primary/10 flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[18px]">{action.icon}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors">{action.label}</h4>
                    <p className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-1">{action.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mt-8 mb-4">{t('ai_assistant.sidebar.context_insights')}</h3>
          
          {/* Context Card 1 */}
          <div className="bg-surface rounded-xl border border-outline-variant/50 p-4 mb-4 shadow-sm hover:border-outline-variant transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-on-surface">
                <span className="material-symbols-outlined text-sm text-tertiary">trending_up</span>
                <span className="text-xs font-bold">{t('ai_assistant.insight.spike.title')}</span>
              </div>
              <span className="text-[10px] text-on-surface-variant">{t('ai_assistant.insight.spike.time')}</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {t('ai_assistant.insight.spike.desc')}
            </p>
            <button 
              onClick={() => handleSendMessage(t('ai_assistant.insight.spike.prompt'))}
              className="mt-3 text-xs font-medium text-primary hover:underline opacity-80 hover:opacity-100 transition-opacity"
            >
              {t('ai_assistant.insight.spike.action')}
            </button>
          </div>

          {/* Context Card 2 */}
          <div className="bg-surface rounded-xl border border-outline-variant/50 p-4 shadow-sm hover:border-outline-variant transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-on-surface">
                <span className="material-symbols-outlined text-sm text-error">warning</span>
                <span className="text-xs font-bold">{t('ai_assistant.insight.missing.title')}</span>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {t('ai_assistant.insight.missing.desc')}
            </p>
            <button 
              onClick={() => handleSendMessage(t('ai_assistant.insight.missing.prompt'))}
              className="mt-3 text-xs font-medium text-primary hover:underline opacity-80 hover:opacity-100 transition-opacity"
            >
              {t('ai_assistant.insight.missing.action')}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}

