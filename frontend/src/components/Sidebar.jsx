import React, { useState, useEffect } from 'react';
import {
  NavLink,
  useNavigate,
  useLocation
} from 'react-router-dom';

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

import {
  getChatHistory,
  getCurrentUser,
  logoutUser
} from '../services/api';

export default function Sidebar({
  isOpen,
  onClose,
  onNewChat,
  onSelectChatId,
  activeChatId
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [recentChats, setRecentChats] =
    useState([]);

  const user = getCurrentUser();

  // Load recent chats
  const loadRecentChats = async () => {
    try {
      const history =
        await getChatHistory();

      setRecentChats(history);
    } catch (error) {
      console.error(
        'Unable to load recent chats:',
        error
      );
    }
  };

  useEffect(() => {
    loadRecentChats();
  }, [
    activeChatId,
    location.pathname
  ]);

  // New chat
  const handleNewChatClick = () => {
    if (onNewChat) {
      onNewChat();
    }

    if (
      location.pathname !== '/chat'
    ) {
      navigate('/chat');
    }

    if (
      window.innerWidth < 1024 &&
      onClose
    ) {
      onClose();
    }
  };

  // Open recent chat
  const handleSelectRecentChat = (
    chat
  ) => {
    if (onSelectChatId) {
      onSelectChatId(chat.id);
    }

    if (
      location.pathname !== '/chat'
    ) {
      navigate('/chat', {
        state: {
          selectedChatId: chat.id
        }
      });
    }

    if (
      window.innerWidth < 1024 &&
      onClose
    ) {
      onClose();
    }
  };

  // Logout
  const handleLogout = () => {
    logoutUser();

    if (onClose) {
      onClose();
    }

    navigate('/login');
  };

  // Common navigation style
  const navigationClass = ({
    isActive
  }) =>
    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
      isActive
        ? 'bg-white/10 text-white font-medium shadow-sm'
        : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}

      <aside
        id="app-sidebar"
        className={`fixed bottom-0 left-0 top-0 z-50 flex w-72 flex-col border-r border-white/[0.06] bg-[#0d1f2d] shadow-2xl transition-transform duration-200 ease-in-out lg:static lg:shadow-none ${
          isOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >

        {/* Brand */}

        <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-white/[0.07] px-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-lg shadow-teal-950/20">

              <HeartPulse className="h-5 w-5" />

            </div>

            <div>

              <h2 className="text-[15px] font-semibold tracking-tight text-white">

                Health Assist AI

              </h2>

              <div className="mt-0.5 flex items-center gap-1.5">

                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                <span className="text-[10px] font-medium tracking-wide text-slate-400">

                  Medical Information Assistant

                </span>

              </div>

            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>

        </div>


        {/* New Chat */}

        <div className="px-4 pb-3 pt-4">

          <button
            id="sidebar-new-chat-btn"
            type="button"
            onClick={
              handleNewChatClick
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all hover:bg-teal-400 active:scale-[0.99]"
          >

            <Plus className="h-4 w-4 stroke-[2.5]" />

            <span>
              New Consultation
            </span>

          </button>

        </div>


        {/* Navigation */}

        <nav className="px-3 py-2">

          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">

            Workspace

          </p>


          {/* Chat */}

          <NavLink
            to="/chat"
            end
            onClick={() =>
              window.innerWidth <
                1024 &&
              onClose &&
              onClose()
            }
            className={
              navigationClass
            }
          >

            <MessageSquare className="h-[17px] w-[17px] text-teal-400" />

            <span>
              Chat Assistant
            </span>

          </NavLink>


          {/* History */}

          <NavLink
            to="/history"
            onClick={() =>
              window.innerWidth <
                1024 &&
              onClose &&
              onClose()
            }
            className={
              navigationClass
            }
          >

            <History className="h-[17px] w-[17px] text-slate-400 transition-colors group-hover:text-teal-400" />

            <span>
              Chat History
            </span>

          </NavLink>


          {/* Hospitals */}

          <NavLink
            to="/hospitals"
            onClick={() =>
              window.innerWidth <
                1024 &&
              onClose &&
              onClose()
            }
            className={
              navigationClass
            }
          >

            <MapPin className="h-[17px] w-[17px] text-slate-400 transition-colors group-hover:text-teal-400" />

            <span>
              Nearby Hospitals
            </span>

          </NavLink>

        </nav>


        {/* Divider */}

        <div className="mx-4 my-2 h-px bg-white/[0.07]" />


        {/* Recent Chats */}

        <div className="flex-1 overflow-y-auto px-3 py-2">

          <div className="mb-2 flex items-center justify-between px-3">

            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">

              Recent Chats

            </span>

            <Sparkles className="h-3.5 w-3.5 text-teal-400/80" />

          </div>


          <div className="space-y-1">

            {recentChats.length ===
            0 ? (

              <div className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-center">

                <MessageSquare className="mx-auto mb-2 h-4 w-4 text-slate-600" />

                <p className="text-[11px] text-slate-500">

                  No recent conversations

                </p>

              </div>

            ) : (

              recentChats.map(
                (chat) => {

                  const isSelected =
                    activeChatId ===
                      chat.id &&
                    location.pathname ===
                      '/chat';

                  return (

                    <button
                      key={chat.id}
                      id={`recent-chat-btn-${chat.id}`}
                      type="button"
                      onClick={() =>
                        handleSelectRecentChat(
                          chat
                        )
                      }
                      title={
                        chat.title
                      }
                      className={`group relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs transition-all ${
                        isSelected
                          ? 'bg-teal-500/15 text-teal-100'
                          : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
                      }`}
                    >

                      {/* Active indicator */}

                      {isSelected && (

                        <span className="absolute bottom-2.5 left-0 top-2.5 w-[2px] rounded-full bg-teal-400" />

                      )}

                      <MessageSquare
                        className={`h-3.5 w-3.5 shrink-0 ${
                          isSelected
                            ? 'text-teal-400'
                            : 'text-slate-500 group-hover:text-slate-400'
                        }`}
                      />

                      <span className="truncate">

                        {chat.title}

                      </span>

                    </button>

                  );
                }
              )

            )}

          </div>

        </div>


        {/* User Profile */}

        <div className="border-t border-white/[0.07] p-3">

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-2.5">

            <div className="flex items-center gap-2.5">

              {/* Avatar */}

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/15 text-teal-300 ring-1 ring-teal-400/20">

                <User className="h-4 w-4" />

              </div>


              {/* User Info */}

              <div className="min-w-0 flex-1">

                <p className="truncate text-xs font-semibold text-slate-100">

                  {user?.name ||
                    'Healthcare User'}

                </p>

                <p className="mt-0.5 truncate text-[10px] text-slate-500">

                  {user?.email ||
                    'Signed in user'}

                </p>

              </div>


              {/* Logout */}

              <button
                id="sidebar-logout-btn"
                type="button"
                onClick={
                  handleLogout
                }
                className="rounded-lg p-2 text-slate-500 transition-all hover:bg-red-500/10 hover:text-red-400"
                title="Logout"
                aria-label="Logout"
              >

                <LogOut className="h-4 w-4" />

              </button>

            </div>

          </div>

          <p className="mt-2 text-center text-[9px] text-slate-600">

            Health Assist AI • Educational Use

          </p>

        </div>

      </aside>
    </>
  );
}