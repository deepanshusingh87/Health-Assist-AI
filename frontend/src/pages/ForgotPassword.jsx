import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  Mail,
  KeyRound,
  Lock,
  AlertCircle,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';

import {
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetForgotPassword
} from '../services/api';

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [resetToken, setResetToken] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendTimer((current) => {
        if (current <= 1) {
          clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendTimer]);

  const isValidEmail = (value) => {
    return /\S+@\S+\.\S+/.test(value);
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();

    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);

      const result = await sendForgotPasswordOTP(email);

      setMessage(result.message || 'OTP sent successfully.');
      setStep(2);
      setResendTimer(60);
    } catch (err) {
      setError(err.message || 'Unable to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0 || loading) {
      return;
    }

    setError('');
    setMessage('');

    try {
      setLoading(true);

      const result = await sendForgotPasswordOTP(email);

      setMessage(result.message || 'A new OTP has been sent.');
      setResendTimer(60);
    } catch (err) {
      setError(err.message || 'Unable to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    setError('');
    setMessage('');

    if (!/^\d{6}$/.test(otp)) {
      setError('Please enter the 6-digit OTP.');
      return;
    }

    try {
      setLoading(true);

      const result = await verifyForgotPasswordOTP(
        email,
        otp
      );

      setResetToken(result.resetToken);
      setMessage('Email verified successfully.');
      setStep(3);
    } catch (err) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setError('');
    setMessage('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!resetToken) {
      setError(
        'Password reset session expired. Please verify your email again.'
      );
      return;
    }

    try {
      setLoading(true);

      await resetForgotPassword(
        email,
        newPassword,
        resetToken
      );

      setStep(4);
      setMessage('Your password has been updated successfully.');
    } catch (err) {
      setError(err.message || 'Unable to reset password.');
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

        <h1 className="mt-4 text-center text-3xl font-extrabold text-slate-900">
          Reset Password
        </h1>

        <p className="mt-2 text-center text-sm text-slate-600">
          Securely recover your Health Assist AI account
        </p>

      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">

        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80">

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-5 p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-sm flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          {step === 1 && (
            <form
              onSubmit={handleSendOTP}
              className="space-y-5"
            >
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Forgot your password?
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Enter your registered email and we will send
                  you a verification OTP.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>

                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold disabled:opacity-50"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form
              onSubmit={handleVerifyOTP}
              className="space-y-5"
            >
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Verify OTP
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Enter the 6-digit OTP sent to
                  {' '}
                  <span className="font-medium text-slate-700">
                    {email}
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Verification OTP
                </label>

                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) =>
                      setOtp(
                        e.target.value
                          .replace(/\D/g, '')
                          .slice(0, 6)
                      )
                    }
                    placeholder="Enter 6-digit OTP"
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendTimer > 0 || loading}
                className="w-full text-sm font-medium text-teal-700 disabled:text-slate-400"
              >
                {resendTimer > 0
                  ? `Resend OTP in ${resendTimer}s`
                  : 'Resend OTP'}
              </button>
            </form>
          )}

          {step === 3 && (
            <form
              onSubmit={handleResetPassword}
              className="space-y-5"
            >
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Create New Password
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Choose a new password for your account.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Password
                </label>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />

                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(e.target.value)
                    }
                    placeholder="Minimum 6 characters"
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold disabled:opacity-50"
              >
                {loading
                  ? 'Updating Password...'
                  : 'Reset Password'}
              </button>
            </form>
          )}

          {step === 4 && (
            <div className="text-center">

              <div className="mx-auto w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-teal-600" />
              </div>

              <h2 className="mt-4 text-xl font-bold text-slate-900">
                Password Updated
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Your password has been changed successfully.
                You can now login using your new password.
              </p>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="mt-6 w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold"
              >
                Back to Login
              </button>

            </div>
          )}

          {step !== 4 && (
            <div className="mt-6 pt-5 border-t border-slate-200 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-teal-700"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}