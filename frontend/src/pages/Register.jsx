import React, { useEffect, useState } from 'react';
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

import {
  registerUser,
  sendOTP,
  verifyOTP
} from '../services/api';

export default function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  // OTP resend countdown
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendTimer((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendTimer]);

  const isValidEmail = (value) => {
    return /\S+@\S+\.\S+/.test(value);
  };

  const handleSendOTP = async () => {
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (resendTimer > 0) {
      return;
    }

    try {
      setOtpLoading(true);

      await sendOTP(email);

      setOtp('');
      setOtpSent(true);
      setOtpVerified(false);
      setVerificationToken('');

      // Start 60-second countdown
      setResendTimer(60);

      setSuccess(
        'OTP sent successfully. Please check your email.'
      );
    } catch (err) {
      setError(
        err.message || 'Unable to send verification OTP.'
      );
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError('');
    setSuccess('');

    if (!otp.trim()) {
      setError('Please enter the OTP.');
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setError('OTP must be a 6-digit number.');
      return;
    }

    try {
      setOtpLoading(true);

      const result = await verifyOTP(email, otp);

      setVerificationToken(result.verificationToken);
      setOtpVerified(true);

      setSuccess('Email verified successfully.');
    } catch (err) {
      setError(
        err.message || 'OTP verification failed.'
      );
    } finally {
      setOtpLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);

    if (otpSent || otpVerified) {
      setOtp('');
      setOtpSent(false);
      setOtpVerified(false);
      setVerificationToken('');
      setResendTimer(0);
      setSuccess('');
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Please enter a password.');
      return;
    }

    if (password.length < 6) {
      setError(
        'Password must be at least 6 characters long.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!otpVerified || !verificationToken) {
      setError(
        'Please verify your email before creating your account.'
      );
      return;
    }

    try {
      setLoading(true);

      await registerUser(
        fullName,
        email,
        password,
        verificationToken
      );

      navigate('/chat');
    } catch (err) {
      setError(
        err.message || 'Registration failed.'
      );
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

          {success && (
            <div className="mb-5 p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm flex items-start space-x-2">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form
            className="space-y-4"
            onSubmit={handleSubmit}
          >
            {/* Full Name */}
            <div>
              <label
                htmlFor="register-fullname"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Full Name
              </label>

              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />

                <input
                  id="register-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) =>
                    setFullName(e.target.value)
                  }
                  placeholder="Deepanshu Parihar"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="register-email"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Email Address
              </label>

              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />

                <input
                  id="register-email"
                  type="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="name@example.com"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* First OTP Button */}
            {!otpSent && (
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={otpLoading}
                className="w-full py-2.5 px-4 rounded-xl border border-teal-600 text-teal-700 text-sm font-semibold hover:bg-teal-50 disabled:opacity-50"
              >
                {otpLoading
                  ? 'Sending OTP...'
                  : 'Send Verification OTP'}
              </button>
            )}

            {/* OTP Section */}
            {otpSent && (
              <div className="space-y-3">
                <label
                  htmlFor="register-otp"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                >
                  Verification OTP
                </label>

                <div className="flex gap-2">
                  <input
                    id="register-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    disabled={otpVerified}
                    onChange={(e) =>
                      setOtp(
                        e.target.value.replace(/\D/g, '')
                      )
                    }
                    placeholder="Enter 6-digit OTP"
                    className="flex-1 min-w-0 px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-100"
                  />

                  <button
                    type="button"
                    onClick={handleVerifyOTP}
                    disabled={
                      otpLoading || otpVerified
                    }
                    className="px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50"
                  >
                    {otpVerified
                      ? 'Verified'
                      : otpLoading
                        ? 'Verifying...'
                        : 'Verify'}
                  </button>
                </div>

                {otpVerified ? (
                  <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Email verified
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={
                      otpLoading || resendTimer > 0
                    }
                    className="text-xs font-semibold text-teal-700 hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed"
                  >
                    {resendTimer > 0
                      ? `Resend OTP in ${resendTimer}s`
                      : 'Resend OTP'}
                  </button>
                )}
              </div>
            )}

            {/* Password */}
            <div>
              <label
                htmlFor="register-password"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Password
              </label>

              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />

                <input
                  id="register-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="At least 6 characters"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
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

              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />

                <input
                  id="register-confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="Re-enter password"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Create Account */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !otpVerified}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? 'Creating Account...'
                  : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-teal-700 hover:underline"
              >
                Login
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500 leading-relaxed">
              <ShieldCheck className="w-3.5 h-3.5 inline-block text-teal-600 mr-1 -mt-0.5" />
              Health Assist AI provides general healthcare
              information and does not replace professional
              medical advice, diagnosis, or treatment.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}