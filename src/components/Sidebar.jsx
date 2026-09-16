import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  MessageSquare,
  History,
  MapPin,
  User,
  LogOut,
  X,
  Sparkles,
  HeartPulse
} from 'lucide-react';
import { getChatHistory, getCurrentUser, logoutUser } from '../services/api';

export default function Sidebar({
  isOpen,
  onClose,
  onNewChat,
  onSelectChatId,
  activeChatId,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [recentChats, setRecentChats] = useState([]);
  const user = getCurrentUser();

  const loadRecentChats = async () => {
    try {
      const history = await getChatHistory();
      setRecentChats(history);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    loadRecentChats();
  }, [activeChatId, location.pathname]);

  const handleNewChatClick = () => {
    if (onNewChat) {
      onNewChat();
    }
    if (location.pathname !== '/chat') {
      navigate('/chat');
    }
    if (window.innerWidth < 1024 && onClose) {
      onClose();
    }
  };

  const handleSelectRecentChat = (chat) => {
    if (onSelectChatId) {
      onSelectChatId(chat.id);
    }
    if (location.pathname !== '/chat') {
      navigate('/chat', { state: { selectedChatId: chat.id } });
    }
    if (window.innerWidth < 1024 && onClose) {
      onClose();
    }
  };

  const handleLogout = () => {
    logoutUser();
    if (onClose) onClose();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header (App branding & close on mobile) */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-base leading-tight">
                Health Assist AI
              </h2>
              <span className="text-[11px] text-teal-600 font-medium">
                Clinical Assistant
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Action: + New Chat */}
        <div className="p-4">
          <button
            id="sidebar-new-chat-btn"
            type="button"
            onClick={handleNewChatClick}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Navigation Section */}
        <div className="px-3 py-1 space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Navigation
          </p>

          <NavLink
            to="/chat"
            end
            onClick={() => window.innerWidth < 1024 && onClose && onClose()}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-teal-50 text-teal-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <MessageSquare className="w-4 h-4 text-teal-600" />
            <span>Chat Assistant</span>
          </NavLink>

          <NavLink
            to="/history"
            onClick={() => window.innerWidth < 1024 && onClose && onClose()}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-teal-50 text-teal-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <History className="w-4 h-4 text-teal-600" />
            <span>Chat History</span>
          </NavLink>

          <NavLink
            to="/hospitals"
            onClick={() => window.innerWidth < 1024 && onClose && onClose()}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-teal-50 text-teal-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <MapPin className="w-4 h-4 text-teal-600" />
            <span>Nearby Hospitals</span>
          </NavLink>
        </div>

        {/* Recent Chats Section */}
        <div className="flex-1 overflow-y-auto px-3 py-3 mt-2 border-t border-slate-100">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Recent Chats
            </span>
            <Sparkles className="w-3 h-3 text-teal-500" />
          </div>

          <div className="space-y-1">
            {recentChats.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-400 italic">
                No recent conversations
              </p>
            ) : (
              recentChats.map((chat) => {
                const isSelected = activeChatId === chat.id && location.pathname === '/chat';
                return (
                  <button
                    key={chat.id}
                    id={`recent-chat-btn-${chat.id}`}
                    type="button"
                    onClick={() => handleSelectRecentChat(chat)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2.5 truncate ${
                      isSelected
                        ? 'bg-teal-50/80 text-teal-900 font-medium border-l-2 border-teal-600'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                    title={chat.title}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{chat.title}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Sidebar Footer: User Profile and Logout */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/70">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-medium text-xs shrink-0 border border-teal-200">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {user?.name || 'Healthcare User'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {user?.email || 'patient@healthassist.ai'}
                </p>
              </div>
            </div>

            <button
              id="sidebar-logout-btn"
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
