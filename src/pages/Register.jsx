import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  User,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { registerUser } from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Frontend form validations
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter a password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await registerUser(fullName, email, password);
      navigate('/chat');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-teal-50/20 to-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
            <Activity className="w-8 h-8" />
          </div>
        </div>

        <h1 className="mt-4 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Create Account
        </h1>

        <p className="mt-2 text-center text-sm font-medium text-teal-800">
          Join Health Assist AI - Healthcare Knowledge Companion
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

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div>
              <label
                htmlFor="register-fullname"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Full Name
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="register-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Deepanshu Parihar"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label
                htmlFor="register-email"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Email Address
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="register-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="register-password"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Password
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="register-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="register-confirm-password"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Confirm Password
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="register-confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            {/* Create Account Button */}
            <div className="pt-2">
              <button
                id="register-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>

          {/* Already have an account link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link
                to="/login"
                id="register-login-link"
                className="font-semibold text-teal-700 hover:text-teal-800 hover:underline"
              >
                Login
              </Link>
            </p>
          </div>

          {/* Disclaimer */}
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
