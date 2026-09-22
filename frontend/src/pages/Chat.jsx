import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  AlertTriangle,
  MapPin,
  Lightbulb,
  BookOpen,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ChatBox from '../components/ChatBox';

import {
  sendMessage,
  getChatHistory,
  getConversationById
} from '../services/api';


export default function Chat() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  const [messages, setMessages] =
    useState([]);

  const [currentChatId, setCurrentChatId] =
    useState(null);

  const [chatTitle, setChatTitle] =
    useState('New Consultation');

  const [isLoading, setIsLoading] =
    useState(false);


 
  // Determine whether conversation is active
  

  const hasActiveConversation =
    messages.length > 0;


  
  // Load Previous Conversation
 

  const loadChatById = async (chatId) => {
    try {
      setIsLoading(true);

      const history =
        await getChatHistory();

      const target =
        history.find(
          (item) => item.id === chatId
        );

      const conversation =
        await getConversationById(
          chatId
        );

      const formattedMessages = [];

      conversation.messages.forEach(
        (item) => {
          const time = item.createdAt
            ? new Date(
                item.createdAt
              ).toLocaleTimeString(
                [],
                {
                  hour: '2-digit',
                  minute: '2-digit'
                }
              )
            : '';

          formattedMessages.push({
            id: `${item.id}-user`,
            sender: 'USER',
            text: item.question,
            timestamp: time
          });

          formattedMessages.push({
            id: `${item.id}-assistant`,
            sender: 'ASSISTANT',
            text: item.answer,
            timestamp: time,
            isUrgent: item.isUrgent,
            feedback: null
          });
        }
      );

      setCurrentChatId(chatId);

      setChatTitle(
        target?.title ||
          'Previous Consultation'
      );

      setMessages(
        formattedMessages
      );

    } catch (error) {
      console.error(
        'Unable to load conversation:',
        error
      );
    } finally {
      setIsLoading(false);
    }
  };


 
  // Handle conversation opened from history
  

  useEffect(() => {
    if (
      location.state?.selectedChatId
    ) {
      loadChatById(
        location.state.selectedChatId
      );
    }
  }, [location.state]);


  
  // New Chat
  

  const handleNewChat = () => {
    setCurrentChatId(null);
    setChatTitle(
      'New Consultation'
    );
    setMessages([]);
  };


  
  // Select Previous Chat
  

  const handleSelectChatId = (
    id
  ) => {
    loadChatById(id);
  };


  
  // Send Message
  

  const handleSendMessage =
    async (text) => {
      if (!text?.trim()) return;

      const now =
        new Date();

      const timeString =
        now.toLocaleTimeString(
          [],
          {
            hour: '2-digit',
            minute: '2-digit'
          }
        );

      const userMessage = {
        id:
          'm-usr-' +
          Date.now(),

        sender: 'USER',

        text: text.trim(),

        timestamp:
          timeString
      };

      const updatedMessages = [
        ...messages,
        userMessage
      ];

      setMessages(
        updatedMessages
      );

      setIsLoading(true);

      try {
        const response =
          await sendMessage(
            text.trim(),
            currentChatId
          );

        const aiMessage =
          response.message;

        setMessages([
          ...updatedMessages,
          aiMessage
        ]);

        const activeId =
          currentChatId ||
          response.conversationId;

        setCurrentChatId(
          activeId
        );


        // Auto title
        if (
          !currentChatId ||
          chatTitle ===
            'New Consultation'
        ) {
          const title =
            text.length > 32
              ? text.slice(
                  0,
                  32
                ) + '...'
              : text;

          setChatTitle(
            title
          );
        }

      } catch (error) {
        console.error(
          'Chat error:',
          error
        );

        const errorMessage = {
          id:
            'm-err-' +
            Date.now(),

          sender:
            'ASSISTANT',

          text:
            'Unable to retrieve healthcare information at the moment. Please check your connection and try again.',

          timestamp:
            timeString
        };

        setMessages([
          ...updatedMessages,
          errorMessage
        ]);

      } finally {
        setIsLoading(false);
      }
    };


 
  // Feedback
  

  const handleFeedbackUpdate = (
    messageId,
    feedbackType
  ) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id ===
        messageId
          ? {
              ...message,
              feedback:
                feedbackType
            }
          : message
      )
    );
  };


  
  // Navigation
  

  const openHospitals = () => {
    navigate('/hospitals');
  };


 
  // UI


  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f5f8fb] font-sans">

      
      {/* SIDEBAR */}
      

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() =>
          setIsSidebarOpen(false)
        }
        onNewChat={
          handleNewChat
        }
        onSelectChatId={
          handleSelectChatId
        }
        activeChatId={
          currentChatId
        }
      />


      
      {/* MAIN APPLICATION */}
      

      <div className="flex flex-1 min-w-0 h-full">

        {/* MAIN CENTER AREA */}

        <div className="flex flex-col flex-1 min-w-0 bg-[#f8fafc]">

          {/* Navbar */}

          <Navbar
            onToggleSidebar={() =>
              setIsSidebarOpen(
                (prev) => !prev
              )
            }
            isSidebarOpen={
              isSidebarOpen
            }
          />


          {/* Main Workspace */}

          <main className="flex-1 min-h-0 overflow-hidden">

            <div className="h-full flex">

              {/* ----------------------------------------- */}
              {/* CHAT / DASHBOARD */}
              {/* ----------------------------------------- */}

              <section className="flex-1 min-w-0 h-full">

                <div className="h-full bg-white">

                  <ChatBox
                    messages={
                      messages
                    }
                    onSendMessage={
                      handleSendMessage
                    }
                    isLoading={
                      isLoading
                    }
                    onFeedbackUpdate={
                      handleFeedbackUpdate
                    }
                    chatTitle={
                      chatTitle
                    }
                    hasActiveConversation={
                      hasActiveConversation
                    }
                  />

                </div>

              </section>


              
              {/* RIGHT INFORMATION PANEL */}
              {/* Hide after conversation starts */}
              

              {!hasActiveConversation && (

                <aside className="hidden 2xl:flex w-[300px] shrink-0 border-l border-slate-200 bg-[#f8fafc] overflow-y-auto">

                  <div className="w-full p-4 space-y-4">


                    {/* --------------------------------------- */}
                    {/* Emergency */}
                    {/* --------------------------------------- */}

                    <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-white p-4 shadow-sm">

                      <div className="flex items-start gap-3">

                        <div className="w-10 h-10 shrink-0 rounded-xl bg-red-100 flex items-center justify-center">

                          <AlertTriangle className="w-5 h-5 text-red-600" />

                        </div>

                        <div>

                          <h3 className="text-[15px] font-semibold text-slate-900">
                            Medical Emergency?
                          </h3>

                          <p className="mt-1 text-xs leading-5 text-slate-600">
                            If you may be experiencing a serious medical emergency, seek immediate professional help.
                          </p>

                        </div>

                      </div>


                      <div className="mt-3 rounded-xl bg-red-100/60 px-3 py-2.5">

                        <p className="text-[11px] leading-4 text-red-800">
                          Examples include severe breathing difficulty, heavy bleeding, loss of consciousness or severe chest pain.
                        </p>

                      </div>

                    </div>


                    
                    {/* Nearby Hospital */}
                    
                    <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">

                      <div className="flex items-start gap-3">

                        <div className="w-10 h-10 shrink-0 rounded-xl bg-teal-50 flex items-center justify-center">

                          <MapPin className="w-5 h-5 text-teal-600" />

                        </div>

                        <div className="flex-1">

                          <h3 className="text-[15px] font-semibold text-slate-900">
                            Find Nearby Hospitals
                          </h3>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Discover nearby healthcare facilities using your location.
                          </p>

                        </div>

                      </div>


                      <button
                        type="button"
                        onClick={
                          openHospitals
                        }
                        className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-teal-50 border border-teal-100 px-4 py-2.5 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition-colors"
                      >
                        Open Hospital Map

                        <ArrowRight className="w-4 h-4" />
                      </button>

                    </div>


                    
                    {/* Health Tip */}
                    
                    <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/80 to-white p-4 shadow-sm">

                      <div className="flex items-center gap-2">

                        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">

                          <Lightbulb className="w-5 h-5 text-amber-600" />

                        </div>

                        <h3 className="text-[15px] font-semibold text-slate-900">
                          Health Tip
                        </h3>

                      </div>


                      <p className="mt-3 text-xs leading-5 text-slate-600">
                        Small daily habits such as regular hydration, balanced nutrition, physical activity and adequate sleep can support overall wellbeing.
                      </p>

                    </div>


                   
                    {/* trusted source */}
                   
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

                      <div className="flex items-start gap-3">

                        <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-50 flex items-center justify-center">

                          <BookOpen className="w-5 h-5 text-blue-600" />

                        </div>

                        <div>

                          <h3 className="text-[15px] font-semibold text-slate-900">
                            Knowledge Sources
                          </h3>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Answers are generated using information retrieved from the project's medical knowledge base.
                          </p>

                        </div>

                      </div>


                      <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-emerald-700">

                        <ShieldCheck className="w-4 h-4" />

                        RAG-grounded responses

                      </div>

                    </div>


                  
                  
                

                    <div className="px-1">

                      <p className="text-[10px] leading-4 text-slate-400 text-center">
                        Health Assist AI provides healthcare information for educational purposes and does not replace professional medical advice, diagnosis or treatment.
                      </p>

                    </div>

                  </div>

                </aside>

              )}

            </div>

          </main>

        </div>

      </div>

    </div>
  );
}