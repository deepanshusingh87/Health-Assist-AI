import React, { useState, useRef, useEffect } from 'react';
import stethoscopeImage from '../assets/stethoscope.png';

import {
  Send,
  Activity,
  ArrowRight,
  Shield,
  Loader2,
  Mic,
  MicOff,
  Stethoscope,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Search,
  Heart
} from 'lucide-react';

import Message from './Message';

export default function ChatBox({
  messages,
  onSendMessage,
  isLoading,
  onFeedbackUpdate,
  chatTitle,
  hasActiveConversation
}) {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  // Health topic cards
  const topicCards = [
    {
      title: 'Symptoms & Conditions',
      description:
        'Understand common symptoms and health conditions.',
      icon: Stethoscope,
      prompt:
        'I want to understand a symptom or medical condition.'
    },
    {
      title: 'Self-Care Advice',
      description:
        'Explore safe temporary self-care information.',
      icon: HeartPulse,
      prompt:
        'What safe self-care steps can I take for common symptoms?'
    },
    {
      title: 'Prevention & Wellness',
      description:
        'Learn everyday habits that support better health.',
      icon: Heart,
      prompt:
        'How can I improve my general health and wellness?'
    },
    {
      title: 'When to See a Doctor',
      description:
        'Know when professional medical care may be needed.',
      icon: ShieldCheck,
      prompt:
        'How do I know when a symptom needs medical attention?'
    }
  ];

  // Suggested questions
  const suggestions = [
    'What are common symptoms of diabetes?',
    'How can I maintain healthy blood pressure?',
    'What causes migraine and how can I manage triggers?',
    'What are the symptoms of vitamin D deficiency?'
  ];

  // Scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Send message
  const handleSubmit = (event) => {
    if (event) {
      event.preventDefault();
    }

    const trimmed = inputText.trim();

    if (!trimmed || isLoading) {
      return;
    }

    onSendMessage(trimmed);

    setInputText('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Enter = Send
  // Shift + Enter = New line
  const handleKeyDown = (event) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey
    ) {
      event.preventDefault();
      handleSubmit();
    }
  };

  // Fill textarea from cards
  const handleSuggestionClick = (prompt) => {
    setInputText(prompt);

    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
    }
  };

  // Auto resize textarea
  const handleTextareaInput = (event) => {
    setInputText(event.target.value);

    event.target.style.height = 'auto';

    event.target.style.height =
      `${Math.min(
        event.target.scrollHeight,
        160
      )}px`;
  };

  // Voice input
  const handleVoiceInput = () => {
    // Stop current recognition
    if (
      isListening &&
      recognitionRef.current
    ) {
      recognitionRef.current.stop();
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        'Voice recognition is not supported in this browser. Please use Google Chrome.'
      );

      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognitionRef.current =
      recognition;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (
      event
    ) => {
      const transcript =
        event.results[0][0]
          .transcript;

      setInputText(
        transcript
      );

      if (
        textareaRef.current
      ) {
        textareaRef.current.focus();
      }
    };

    recognition.onerror = (
      event
    ) => {
      console.error(
        'Speech recognition error:',
        event.error
      );

      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);

      recognitionRef.current =
        null;
    };

    recognition.start();
  };

  // Support Chat.jsx prop + fallback
  const conversationActive =
    typeof hasActiveConversation ===
    'boolean'
      ? hasActiveConversation
      : messages.length > 0;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f8fafc]">

      {/* Welcome Dashboard */}

      {!conversationActive ? (

        <div className="flex-1 overflow-y-auto">

          <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-7">

            {/* Hero */}

            <section className="relative overflow-hidden rounded-[28px] border border-teal-100 bg-gradient-to-br from-[#e8fbf8] via-[#f4fbff] to-[#eaf3ff] px-5 py-6 shadow-[0_12px_40px_rgba(15,118,110,0.08)] sm:px-7 sm:py-8">

              {/* Background decoration */}

              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-200/30 blur-3xl" />

              <div className="pointer-events-none absolute -bottom-20 right-24 h-56 w-56 rounded-full bg-blue-200/30 blur-3xl" />

              <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_260px] lg:items-center">

                {/* Hero Text */}

                <div>

                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/75 px-3 py-1.5 text-xs font-semibold text-teal-700 shadow-sm">

                    <Sparkles className="h-3.5 w-3.5" />

                    RAG-powered health information

                  </div>

                  <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">

                    How can I help you today?

                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">

                    Ask about symptoms, common conditions,
                    prevention, wellness, self-care and
                    information available in the medical
                    knowledge base.

                  </p>

                  {/* Trust badges */}

                  <div className="mt-5 flex flex-wrap gap-2">

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">

                      <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />

                      Knowledge-grounded

                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">

                      <Shield className="h-3.5 w-3.5 text-blue-600" />

                      Educational use

                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">

                      <Activity className="h-3.5 w-3.5 text-cyan-600" />

                      Not a diagnosis

                    </span>

                  </div>

                </div>

                {/* Medical Visual */}

                <div className="hidden lg:flex items-center justify-center">

                 <div className="relative w-full max-w-[300px] overflow-hidden rounded-3xl">
                    <img
                     src={stethoscopeImage}
                     alt="Stethoscope representing healthcare assistance"
                     className="h-[190px] w-full object-cover object-center"
                    />

                    <div className="absolute inset-0 bg-gradient-to-r from-[#eefbf9]/60 via-transparent to-transparent" />

                    

                      

                    

                  </div>

                </div>

              </div>

            </section>


            {/* Health Topics */}

            <section className="mt-6">

              <div className="mb-3">

                <h2 className="text-sm font-semibold text-slate-900">
                  Explore health topics
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Choose a category to start a conversation.
                </p>

              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

                {topicCards.map(
                  (item) => {

                    const Icon =
                      item.icon;

                    return (

                      <button
                        key={item.title}
                        type="button"
                        onClick={() =>
                          handleSuggestionClick(
                            item.prompt
                          )
                        }
                        className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
                      >

                        <div className="flex items-start justify-between gap-4">

                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">

                            <Icon className="h-5 w-5" />

                          </div>

                          <ArrowRight className="mt-1 h-4 w-4 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-teal-600" />

                        </div>

                        <h3 className="mt-4 text-sm font-semibold text-slate-900">

                          {item.title}

                        </h3>

                        <p className="mt-1.5 text-xs leading-5 text-slate-500">

                          {item.description}

                        </p>

                      </button>

                    );
                  }
                )}

              </div>

            </section>


            {/* Suggested Questions */}

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

              <div className="flex items-center gap-2">

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">

                  <Search className="h-4 w-4" />

                </div>

                <div>

                  <h2 className="text-sm font-semibold text-slate-900">

                    Suggested questions

                  </h2>

                  <p className="text-[11px] text-slate-500">

                    Try one of these to explore the assistant.

                  </p>

                </div>

              </div>


              <div className="mt-4 grid gap-2 sm:grid-cols-2">

                {suggestions.map(
                  (prompt, index) => (

                    <button
                      key={index}
                      type="button"
                      onClick={() =>
                        handleSuggestionClick(
                          prompt
                        )
                      }
                      className="group flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-left transition-colors hover:border-teal-200 hover:bg-teal-50/60"
                    >

                      <span className="text-xs font-medium leading-5 text-slate-700">

                        {prompt}

                      </span>

                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-teal-600" />

                    </button>

                  )
                )}

              </div>

            </section>

          </div>

        </div>

      ) : (

        /* Chat Conversation */

        <div className="flex-1 overflow-y-auto chat-scroll-container bg-white">

          {/* Conversation Header */}

          <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">

            <div className="mx-auto flex max-w-3xl items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">

                <Activity className="h-4 w-4" />

              </div>

              <div className="min-w-0">

                <p className="truncate text-sm font-semibold text-slate-900">

                  {chatTitle ||
                    'Health Consultation'}

                </p>

                <p className="text-[11px] text-slate-500">

                  Health Assist AI

                </p>

              </div>

            </div>

          </div>


          {/* Messages */}

          <div>

            {messages.map(
              (message) => (

                <Message
                  key={message.id}
                  message={message}
                  onFeedbackUpdate={
                    onFeedbackUpdate
                  }
                />

              )
            )}


            {/* Loading */}

            {isLoading && (

              <div className="border-y border-slate-200/60 bg-slate-50/70 px-4 py-4 sm:px-6">

                <div className="mx-auto flex max-w-3xl items-center gap-3">

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">

                    <Activity className="h-4 w-4 animate-pulse" />

                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-500">

                    <Loader2 className="h-4 w-4 animate-spin text-teal-600" />

                    <span>
                      Reviewing medical references...
                    </span>

                  </div>

                </div>

              </div>

            )}

            <div ref={messagesEndRef} />

          </div>

        </div>

      )}


      {/* Chat Input */}

      <div className="shrink-0 border-t border-slate-200 bg-white/95 px-3 py-3 shadow-[0_-8px_30px_rgba(15,23,42,0.04)] sm:px-5 sm:py-4">

        <div className="mx-auto max-w-4xl">

          <form
            onSubmit={handleSubmit}
          >

            <div className="flex items-end gap-1.5 rounded-2xl border border-slate-300 bg-white p-1.5 shadow-sm transition-all focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-50">

              <textarea
                ref={textareaRef}
                id="chat-textarea-input"
                rows={1}
                value={inputText}
                onChange={
                  handleTextareaInput
                }
                onKeyDown={
                  handleKeyDown
                }
                placeholder={
                  isListening
                    ? 'Listening...'
                    : 'Ask a healthcare question...'
                }
                className="max-h-40 min-h-[44px] w-full resize-none bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 sm:text-[15px]"
              />


              {/* Microphone */}

              <button
                type="button"
                onClick={
                  handleVoiceInput
                }
                disabled={
                  isLoading
                }
                className={`mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  isListening
                    ? 'bg-red-50 text-red-600'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-teal-700'
                }`}
                aria-label="Voice input"
                title={
                  isListening
                    ? 'Stop listening'
                    : 'Speak your question'
                }
              >

                {isListening ? (

                  <MicOff className="h-5 w-5 animate-pulse" />

                ) : (

                  <Mic className="h-5 w-5" />

                )}

              </button>


              {/* Send */}

              <button
                id="chat-send-btn"
                type="submit"
                disabled={
                  !inputText.trim() ||
                  isLoading
                }
                className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send question"
                title="Send question"
              >

                <Send className="h-4 w-4" />

              </button>

            </div>

          </form>


          {/* Disclaimer */}

          <div className="mt-2 flex items-center justify-center gap-1.5 px-2 text-center text-[10px] leading-4 text-slate-400 sm:text-[11px]">

            <Shield className="h-3 w-3 shrink-0" />

            <span>
              Health Assist AI provides educational health
              information and does not replace professional
              medical advice, diagnosis or treatment.
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}