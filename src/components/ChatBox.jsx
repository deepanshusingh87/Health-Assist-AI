import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  AlertCircle,
  Activity,
  ArrowRight,
  Shield,
  Loader2
} from 'lucide-react';
import Message from './Message';

export default function ChatBox({
  messages,
  onSendMessage,
  isLoading,
  onFeedbackUpdate,
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Suggestions required by specification
  const suggestions = [
    {
      title: 'Diabetes Symptoms',
      prompt: 'What are common symptoms of diabetes?',
    },
    {
      title: 'Blood Pressure Guidelines',
      prompt: 'How can I maintain healthy blood pressure?',
    },
    {
      title: 'Migraine Triggers',
      prompt: 'What causes migraine?',
    },
    {
      title: 'Vitamin D Deficiency',
      prompt: 'What are the symptoms of vitamin D deficiency?',
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;

    onSendMessage(trimmed);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (prompt) => {
    setInputText(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Auto-expand textarea if needed
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleTextareaInput = (e) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto chat-scroll-container">
        {messages.length === 0 ? (
          /* SECTION 5: CHAT WELCOME SCREEN */
          <div
            id="chat-welcome-screen"
            className="max-w-3xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-center text-center"
          >
            {/* Health Assist AI Icon Badge */}
            <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mb-5 shadow-xs">
              <Activity className="w-8 h-8" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
              Health Assist AI
            </h1>

            <p className="text-lg sm:text-xl font-medium text-teal-800 mb-3">
              How can I help you today?
            </p>

            <p className="text-sm sm:text-base text-slate-600 max-w-xl mb-8 leading-relaxed">
              Ask me general questions about health, diseases, symptoms,
              prevention, wellness and information available in the medical
              knowledge base.
            </p>

            {/* Suggestion Cards Grid */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl text-left">
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  id={`suggestion-card-${idx}`}
                  type="button"
                  onClick={() => handleSuggestionClick(item.prompt)}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-teal-500 hover:bg-teal-50/40 text-slate-700 hover:text-slate-900 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between group"
                >
                  <div className="pr-2">
                    <p className="text-xs font-semibold text-teal-700 uppercase tracking-wider mb-1">
                      {item.title}
                    </p>
                    <p className="text-sm font-medium text-slate-800 line-clamp-2">
                      "{item.prompt}"
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 shrink-0 transition-colors" />
                </button>
              ))}
            </div>

            {/* Emergency Prompt space in welcome */}
            <div className="mt-8 p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs max-w-xl flex items-start space-x-2 text-left">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                <strong>Emergency Notice:</strong> If you may be experiencing a medical emergency, contact your local emergency services or seek immediate professional medical care.
              </p>
            </div>
          </div>
        ) : (
          /* Message Stream */
          <div className="divide-y divide-slate-100">
            {messages.map((msg) => (
              <Message
                key={msg.id}
                message={msg}
                onFeedbackUpdate={onFeedbackUpdate}
              />
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="py-4 px-4 sm:px-6 bg-slate-50/75 border-y border-slate-200/60">
                <div className="max-w-3xl mx-auto flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                    <Activity className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="flex items-center space-x-2 text-slate-500 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                    <span>Health Assist AI is reviewing medical references...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* SECTION 6: CHAT INPUT & SECTION 11: MEDICAL SAFETY NOTICE */}
      <div className="border-t border-slate-200 bg-white p-3 sm:p-4 shrink-0 shadow-lg shadow-slate-100">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-end rounded-2xl border border-slate-300 bg-white focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-100 transition-all shadow-xs p-1.5">
              <textarea
                ref={textareaRef}
                id="chat-textarea-input"
                rows={1}
                value={inputText}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask a healthcare question..."
                className="w-full resize-none max-h-36 py-2 px-3 text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
                style={{ minHeight: '40px' }}
              />

              <button
                id="chat-send-btn"
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="shrink-0 p-2.5 rounded-xl bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
                aria-label="Send question"
                title="Send question (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* SECTION 11: MEDICAL SAFETY NOTICE */}
          <div className="mt-2.5 text-center px-2">
            <p className="text-[11px] sm:text-xs text-slate-500 leading-normal">
              <Shield className="w-3 h-3 inline-block mr-1 text-slate-400 -mt-0.5" />
              Health Assist AI provides general healthcare information only and does not replace professional medical advice, diagnosis, or treatment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
