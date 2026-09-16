import React, { useState } from 'react';
import {
  Activity,
  User,
  ThumbsUp,
  ThumbsDown,
  Clock,
  AlertTriangle,
  Check
} from 'lucide-react';
import { submitFeedback } from '../services/api';

export default function Message({ message, onFeedbackUpdate }) {
  const isUser = message.sender === 'USER';
  const [feedback, setFeedback] = useState(message.feedback || null);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const handleFeedback = async (type) => {
    if (feedback === type || feedbackSubmitting) return;
    setFeedbackSubmitting(true);
    try {
      await submitFeedback(message.id, type);
      setFeedback(type);
      if (onFeedbackUpdate) {
        onFeedbackUpdate(message.id, type);
      }
    } catch {
      // ignore
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  return (
    <div
      id={`message-${message.id}`}
      className={`w-full py-3 sm:py-4 px-4 sm:px-6 transition-colors ${
        isUser ? 'bg-white' : 'bg-slate-50/75 border-y border-slate-200/60'
      }`}
    >
      <div className="max-w-3xl mx-auto flex items-start space-x-3 sm:space-x-4">
        {/* Avatar Icon */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center shadow-xs">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Activity className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Message Content Container */}
        <div className="flex-1 min-w-0">
          {/* Header info (Name & Timestamp) */}
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-semibold text-slate-900">
              {isUser ? 'You' : 'Health Assist AI'}
            </span>
            <span className="text-[11px] text-slate-400 flex items-center space-x-1">
              <Clock className="w-3 h-3 inline-block" />
              <span>{message.timestamp}</span>
            </span>
          </div>

          {/* Urgent Warning banner if flagged */}
          {message.isUrgent && (
            <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-start space-x-2 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Medical Safety Notice</p>
                <p>If you or someone nearby may be experiencing a medical emergency, call 911 or visit the nearest emergency room immediately.</p>
              </div>
            </div>
          )}

          {/* Message Body text */}
          <div className="text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-wrap break-words font-normal">
            {message.text}
          </div>

          {/* Assistant Feedback Controls (Helpful / Not Helpful) */}
          {!isUser && (
            <div className="mt-3.5 pt-2 flex flex-wrap items-center gap-2 border-t border-slate-200/50">
              <span className="text-xs text-slate-400 font-medium mr-1">
                Was this response helpful?
              </span>

              <button
                id={`btn-helpful-${message.id}`}
                type="button"
                onClick={() => handleFeedback('helpful')}
                disabled={feedbackSubmitting}
                className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                  feedback === 'helpful'
                    ? 'bg-teal-50 border-teal-300 text-teal-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Mark as helpful"
              >
                {feedback === 'helpful' ? (
                  <Check className="w-3 h-3 text-teal-600" />
                ) : (
                  <ThumbsUp className="w-3 h-3" />
                )}
                <span>Helpful</span>
              </button>

              <button
                id={`btn-not-helpful-${message.id}`}
                type="button"
                onClick={() => handleFeedback('not_helpful')}
                disabled={feedbackSubmitting}
                className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                  feedback === 'not_helpful'
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Mark as not helpful"
              >
                <ThumbsDown className="w-3 h-3" />
                <span>Not Helpful</span>
              </button>

              {feedback && (
                <span className="text-[11px] text-teal-700 font-medium ml-1">
                  Thank you for your feedback!
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
