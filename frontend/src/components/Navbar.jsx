import React, { useState } from 'react';
import {
  Link,
  useNavigate,
  useLocation
} from 'react-router-dom';

import {
  Menu,
  X,
  MapPin,
  User,
  LogOut,
  ChevronDown,
  History,
  Search,
  ShieldCheck
} from 'lucide-react';

import {
  getCurrentUser,
  logoutUser
} from '../services/api';

export default function Navbar({
  onToggleSidebar,
  isSidebarOpen
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [showProfileMenu, setShowProfileMenu] =
    useState(false);

  const user = getCurrentUser();

  const handleLogout = () => {
    logoutUser();
    setShowProfileMenu(false);
    navigate('/login');
  };

  // Page title
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/history':
        return 'Conversation History';

      case '/hospitals':
        return 'Nearby Hospitals';

      default:
        return 'Health Assistant';
    }
  };

  return (
    <header className="relative z-30 flex h-[68px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">

      {/* Left Section */}

      <div className="flex min-w-0 items-center gap-3">

        {/* Mobile Menu */}

        {onToggleSidebar && (
          <button
            id="mobile-menu-toggle-btn"
            type="button"
            onClick={onToggleSidebar}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            aria-label={
              isSidebarOpen
                ? 'Close sidebar menu'
                : 'Open sidebar menu'
            }
          >
            {isSidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        )}

        {/* Page Information */}

        <div className="min-w-0">

          <h1 className="truncate text-[15px] font-semibold text-slate-900 sm:text-base">
            {getPageTitle()}
          </h1>

          <div className="mt-0.5 hidden items-center gap-1.5 sm:flex">

            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

            <span className="text-[10px] font-medium text-slate-400">
              Health Assist AI is ready
            </span>

          </div>

        </div>

      </div>


      {/* Center Search */}

      <div className="mx-6 hidden max-w-md flex-1 md:block">

        <div className="relative">

          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            type="text"
            placeholder="Search health topics..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50"
          />

        </div>

      </div>


      {/* Right Section */}

      <div className="flex shrink-0 items-center gap-2">

        {/* Knowledge Badge */}

        <div className="hidden items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1.5 xl:flex">

          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />

          <span className="text-[10px] font-semibold text-emerald-700">
            Knowledge Base Active
          </span>

        </div>


        {/* Hospitals */}

        <Link
          to="/hospitals"
          id="navbar-hospitals-link"
          title="Find Nearby Hospitals"
          className={`flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium transition-colors ${
            location.pathname === '/hospitals'
              ? 'bg-teal-50 text-teal-700'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
          }`}
        >

          <MapPin className="h-4 w-4" />

          <span className="hidden xl:inline">
            Hospitals
          </span>

        </Link>


        {/* Divider */}

        <div className="hidden h-6 w-px bg-slate-200 sm:block" />


        {/* User Profile */}

        <div className="relative">

          <button
            id="navbar-user-profile-btn"
            type="button"
            onClick={() =>
              setShowProfileMenu(
                (prev) => !prev
              )
            }
            className="flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-slate-100"
            aria-expanded={
              showProfileMenu
            }
          >

            {/* Avatar */}

            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 text-teal-700 ring-1 ring-teal-100">

              <User className="h-4 w-4" />

            </div>


            {/* Name */}

            <div className="hidden max-w-[120px] text-left lg:block">

              <p className="truncate text-xs font-semibold text-slate-800">

                {user?.name || 'User'}

              </p>

              <p className="text-[9px] text-slate-400">
                Signed in
              </p>

            </div>


            <ChevronDown
              className={`hidden h-3.5 w-3.5 text-slate-400 transition-transform lg:block ${
                showProfileMenu
                  ? 'rotate-180'
                  : ''
              }`}
            />

          </button>


          {/* Dropdown */}

          {showProfileMenu && (
            <>

              {/* Click Outside */}

              <div
                className="fixed inset-0 z-10"
                onClick={() =>
                  setShowProfileMenu(
                    false
                  )
                }
              />


              <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">

                {/* User Details */}

                <div className="border-b border-slate-100 px-4 py-3">

                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    Signed in as
                  </p>

                  <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                    {user?.name ||
                      'Healthcare User'}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {user?.email ||
                      'Signed in user'}
                  </p>

                </div>


                {/* Navigation */}

                <div className="p-1.5">

                  <Link
                    to="/history"
                    onClick={() =>
                      setShowProfileMenu(
                        false
                      )
                    }
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-teal-700"
                  >

                    <History className="h-4 w-4" />

                    Conversation History

                  </Link>


                  <Link
                    to="/hospitals"
                    onClick={() =>
                      setShowProfileMenu(
                        false
                      )
                    }
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-teal-700"
                  >

                    <MapPin className="h-4 w-4" />

                    Find Hospitals

                  </Link>

                </div>


                {/* Logout */}

                <div className="border-t border-slate-100 p-1.5">

                  <button
                    id="profile-dropdown-logout-btn"
                    type="button"
                    onClick={
                      handleLogout
                    }
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                  >

                    <LogOut className="h-4 w-4" />

                    Sign Out

                  </button>

                </div>

              </div>

            </>
          )}

        </div>

      </div>

    </header>
  );
}