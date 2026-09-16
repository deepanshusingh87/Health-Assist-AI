import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Activity,
  Menu,
  X,
  MapPin,
  User,
  LogOut,
  ShieldAlert,
  ChevronDown
} from 'lucide-react';
import { getCurrentUser, logoutUser } from '../services/api';

export default function Navbar({ onToggleSidebar, isSidebarOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const user = getCurrentUser();

  const handleLogout = () => {
    logoutUser();
    setShowProfileMenu(false);
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between">
      {/* Left side: Mobile menu toggle + Brand Logo & Title */}
      <div className="flex items-center space-x-3">
        {onToggleSidebar && (
          <button
            id="mobile-menu-toggle-btn"
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 lg:hidden"
            aria-label={isSidebarOpen ? 'Close sidebar menu' : 'Open sidebar menu'}
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        <Link
          to="/chat"
          id="navbar-brand-link"
          className="flex items-center space-x-2.5 text-slate-900 group"
        >
          <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm group-hover:bg-teal-700 transition-colors">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="font-semibold text-lg tracking-tight text-slate-900 block leading-tight">
              Health Assist AI
            </span>
            <span className="text-[11px] text-teal-700 font-medium hidden sm:inline-block">
              Healthcare Assistant
            </span>
          </div>
        </Link>
      </div>

      {/* Right side: Nearby Hospitals, Profile, and Logout */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        <Link
          to="/hospitals"
          id="navbar-hospitals-link"
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            location.pathname === '/hospitals'
              ? 'bg-teal-50 text-teal-700 border border-teal-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Find Nearby Healthcare Facilities"
        >
          <MapPin className="w-4 h-4 text-teal-600" />
          <span className="hidden md:inline">Nearby Hospitals</span>
        </Link>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            id="navbar-user-profile-btn"
            type="button"
            onClick={() => setShowProfileMenu((prev) => !prev)}
            className="flex items-center space-x-2 p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-expanded={showProfileMenu}
          >
            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-medium text-xs border border-teal-200">
              <User className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-slate-700 hidden lg:inline max-w-[120px] truncate">
              {user?.name || 'User'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:inline" />
          </button>

          {showProfileMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-20 animate-in fade-in slide-in-from-top-1">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs text-slate-500 font-medium">Signed in as</p>
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {user?.name || 'Demo User'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>

                <div className="py-1">
                  <Link
                    to="/history"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-teal-700"
                  >
                    <span>Conversation History</span>
                  </Link>
                  <Link
                    to="/hospitals"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-teal-700"
                  >
                    <span>Find Hospitals</span>
                  </Link>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    id="profile-dropdown-logout-btn"
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Direct Logout Button */}
        <button
          id="navbar-logout-btn"
          type="button"
          onClick={handleLogout}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Sign out of Health Assist AI"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
