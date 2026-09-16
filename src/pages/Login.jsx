import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { loginUser } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      await loginUser(email, password);
      navigate('/chat');
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setForgotPasswordNotice(true);
    setTimeout(() => setForgotPasswordNotice(false), 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-teal-50/20 to-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Icon and Header */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
            <Activity className="w-8 h-8" />
          </div>
        </div>

        <h1 className="mt-4 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Health Assist AI
        </h1>

        <p className="mt-2 text-center text-sm font-medium text-teal-800">
          "Your AI-Powered Healthcare Information Assistant"
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {forgotPasswordNotice && (
            <div className="mb-5 p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-sm flex items-start space-x-2">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-teal-600" />
              <span>A password reset instruction will be sent to your registered email when backend authentication is connected.</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Email Address
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@example.com or user@example.com"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-medium text-teal-700 hover:text-teal-900 hover:underline focus:outline-none"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            {/* Actions: Login & Create Account */}
            <div className="space-y-3 pt-2">
              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {loading ? 'Authenticating...' : 'Login'}
              </button>

              <Link
                to="/register"
                id="login-create-account-btn"
                className="w-full flex justify-center items-center py-2.5 px-4 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 transition-colors"
              >
                Create Account
              </Link>
            </div>
          </form>

          {/* Quick Demo Credentials Hint */}
          <div className="mt-5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
            <span className="font-semibold text-slate-600">Frontend Demo:</span> You can sign in with any valid email and password to explore the system.
          </div>

          {/* Mandatory Medical Safety Disclaimer */}
          <div className="mt-6 pt-5 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500 leading-relaxed">
              <ShieldCheck className="w-3.5 h-3.5 inline-block text-teal-600 mr-1 -mt-0.5" />
              Health Assist AI provides general healthcare information and does not replace professional medical advice, diagnosis, or treatment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
