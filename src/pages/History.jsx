import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import {
  History as HistoryIcon,
  Search,
  Trash2,
  ExternalLink,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import {
  getChatHistory,
  deleteChat,
  clearAllHistory
} from '../services/api';

export default function History() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);

  /**
   * Future Flask Integration:
   * GET /api/history
   */
  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await getChatHistory();
      setHistoryList(data);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  /**
   * Future Flask Integration:
   * DELETE /api/history/:id
   */
  const handleDeleteChat = async (id, title, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete conversation "${title}"?`)) return;

    try {
      await deleteChat(id);
      setHistoryList((prev) => prev.filter((item) => item.id !== id));
      showStatus('Conversation deleted successfully.');
    } catch {
      showStatus('Failed to delete conversation.');
    }
  };

  /**
   * Future Flask Integration:
   * DELETE /api/history
   */
  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
      return;
    }

    try {
      await clearAllHistory();
      setHistoryList([]);
      showStatus('All chat history cleared.');
    } catch {
      showStatus('Failed to clear history.');
    }
  };

  const handleOpenConversation = (chatId) => {
    navigate('/chat', { state: { selectedChatId: chatId } });
  };

  const showStatus = (msg) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const filteredHistory = historyList.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.snippet && item.snippet.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-50">
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          isSidebarOpen={isSidebarOpen}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                    <HistoryIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                      Chat History
                    </h1>
                    <p className="text-sm text-slate-500">
                      View and continue your previous healthcare conversations.
                    </p>
                  </div>
                </div>
              </div>

              {historyList.length > 0 && (
                <button
                  id="clear-all-history-btn"
                  type="button"
                  onClick={handleClearAll}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors self-start sm:self-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All History</span>
                </button>
              )}
            </div>

            {/* Notification alert */}
            {statusMessage && (
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Search Box */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="search-history-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-2xs transition-colors"
              />
            </div>

            {/* History Cards List */}
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Loading history records...
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-800">
                  {searchQuery ? 'No matching conversations' : 'No history yet'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {searchQuery
                    ? `No conversations match "${searchQuery}". Try a different search term.`
                    : 'Start asking healthcare questions to see your consultations recorded here.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    id={`history-card-${item.id}`}
                    className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-teal-400 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleOpenConversation(item.id)}>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm sm:text-base font-semibold text-slate-900 group-hover:text-teal-700 transition-colors truncate">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 line-clamp-1 mb-2">
                        "{item.snippet}"
                      </p>
                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-medium">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{item.timestamp}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center space-x-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <button
                        id={`open-chat-btn-${item.id}`}
                        type="button"
                        onClick={() => handleOpenConversation(item.id)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
                      >
                        <span>Open Conversation</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>

                      <button
                        id={`delete-chat-btn-${item.id}`}
                        type="button"
                        onClick={(e) => handleDeleteChat(item.id, item.title, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete conversation"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
