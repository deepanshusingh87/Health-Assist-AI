import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ChatBox from '../components/ChatBox';
import {
  sendMessage,
  getChatHistory,
  saveConversationToHistory
} from '../services/api';

export default function Chat() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chatTitle, setChatTitle] = useState('New Consultation');
  const [isLoading, setIsLoading] = useState(false);

  // Load conversation if selected via navigation or recent chat
  const loadChatById = async (chatId) => {
    try {
      const history = await getChatHistory();
      const target = history.find((h) => h.id === chatId);
      if (target) {
        setCurrentChatId(target.id);
        setChatTitle(target.title);
        setMessages(target.messages || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (location.state?.selectedChatId) {
      loadChatById(location.state.selectedChatId);
    }
  }, [location.state]);

  const handleNewChat = () => {
    setCurrentChatId(null);
    setChatTitle('New Consultation');
    setMessages([]);
  };

  const handleSelectChatId = (id) => {
    loadChatById(id);
  };

  const handleSendMessage = async (text) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage = {
      id: 'm-usr-' + Date.now(),
      sender: 'USER',
      text: text,
      timestamp: timeString,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const response = await sendMessage(text, currentChatId);
      const aiMessage = response.message;
      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);

      const activeId = currentChatId || response.conversationId;
      setCurrentChatId(activeId);

      // Auto-title the conversation from first question if new
      let title = chatTitle;
      if (!currentChatId || chatTitle === 'New Consultation') {
        title = text.length > 28 ? text.slice(0, 28) + '...' : text;
        setChatTitle(title);
      }

      // Save to history storage
      saveConversationToHistory({
        id: activeId,
        title: title,
        snippet: text,
        timestamp: 'Today, ' + timeString,
        date: new Date().toISOString(),
        messages: finalMessages,
      });
    } catch {
      // Add a fallback error assistant message
      const errorMessage = {
        id: 'm-err-' + Date.now(),
        sender: 'ASSISTANT',
        text: 'Unable to retrieve healthcare information at the moment. Please check your connection and try again.',
        timestamp: timeString,
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedbackUpdate = (messageId, feedbackType) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, feedback: feedbackType } : msg
      )
    );
  };

  return (
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans">
      {/* Collapsible Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNewChat={handleNewChat}
        onSelectChatId={handleSelectChatId}
        activeChatId={currentChatId}
      />

      {/* Main Chat Layout Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-white">
        {/* Top Navbar */}
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Chat Conversation & Input Workspace */}
        <main className="flex-1 flex flex-col min-h-0 relative">
          <ChatBox
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onFeedbackUpdate={handleFeedbackUpdate}
          />
        </main>
      </div>
    </div>
  );
}
