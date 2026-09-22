import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
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

export default function Message({
  message,
  onFeedbackUpdate
}) {
  const isUser = message.sender === 'USER';

  const [feedback, setFeedback] = useState(
    message.feedback || null
  );

  const [feedbackSubmitting, setFeedbackSubmitting] =
    useState(false);

  // ---------------------------------------------
  // Clean AI response before Markdown rendering
  // ---------------------------------------------

  const cleanMessageText = (text = '') => {
    return text
      // Convert HTML <br> variants to normal new lines
      .replace(/<br\s*\/?>/gi, '\n')

      // Remove excessive spaces before new lines
      .replace(/[ \t]+\n/g, '\n')

      // Maximum 2 line breaks
      .replace(/\n{3,}/g, '\n\n')

      .trim();
  };

  const displayText = cleanMessageText(
    message.text || ''
  );

  // ---------------------------------------------
  // Feedback
  // ---------------------------------------------

  const handleFeedback = async (type) => {
    if (
      feedback === type ||
      feedbackSubmitting
    ) {
      return;
    }

    setFeedbackSubmitting(true);

    try {
      await submitFeedback(
        message.id,
        type
      );

      setFeedback(type);

      if (onFeedbackUpdate) {
        onFeedbackUpdate(
          message.id,
          type
        );
      }
    } catch (error) {
      console.error(
        'Feedback error:',
        error
      );
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  return (
    <div
      id={`message-${message.id}`}
      className={`w-full py-3 sm:py-4 px-4 sm:px-6 transition-colors ${
        isUser
          ? 'bg-white'
          : 'bg-slate-50/75 border-y border-slate-200/60'
      }`}
    >
      <div className="max-w-3xl mx-auto flex items-start space-x-3 sm:space-x-4">

        {/* Avatar */}
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

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* Name + Time */}
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xs font-semibold text-slate-900">
              {isUser
                ? 'You'
                : 'Health Assist AI'}
            </span>

            <span className="text-[11px] text-slate-400 flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>
                {message.timestamp}
              </span>
            </span>
          </div>

          {/* Urgent Warning */}
          {message.isUrgent && (
            <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-start space-x-2 text-xs">

              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />

              <div>
                <p className="font-semibold text-red-900 mb-1">
                  Medical Safety Notice
                </p>

                <p>
                  If you or someone nearby may be
                  experiencing a medical emergency,
                  seek emergency medical care
                  immediately.
                </p>
              </div>

            </div>
          )}

          {/* ---------------------------------- */}
          {/* USER MESSAGE */}
          {/* ---------------------------------- */}

          {isUser ? (

            <div className="text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-wrap break-words font-normal">
              {displayText}
            </div>

          ) : (

            /* ---------------------------------- */
            /* AI MESSAGE */
            /* ---------------------------------- */

            <div className="text-sm sm:text-[15px] text-slate-700 leading-6 break-words">

              <ReactMarkdown
                components={{

                  h1: ({ children }) => (
                    <h1 className="text-lg font-semibold text-slate-900 mt-4 mb-2 first:mt-0">
                      {children}
                    </h1>
                  ),

                  h2: ({ children }) => (
                    <h2 className="text-[17px] font-semibold text-slate-900 mt-4 mb-2 first:mt-0">
                      {children}
                    </h2>
                  ),

                  h3: ({ children }) => (
                    <h3 className="text-[16px] font-semibold text-slate-900 mt-4 mb-1.5 first:mt-0">
                      {children}
                    </h3>
                  ),

                  p: ({ children }) => (
                    <p className="mb-2.5 last:mb-0">
                      {children}
                    </p>
                  ),

                  strong: ({ children }) => (
                    <strong className="font-semibold text-slate-900">
                      {children}
                    </strong>
                  ),

                  ul: ({ children }) => (
                    <ul className="list-disc pl-5 mb-3 space-y-1">
                      {children}
                    </ul>
                  ),

                  ol: ({ children }) => (
                    <ol className="list-decimal pl-5 mb-3 space-y-1">
                      {children}
                    </ol>
                  ),

                  li: ({ children }) => (
                    <li className="pl-1 leading-6">
                      {children}
                    </li>
                  ),

                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-slate-300 pl-3 my-3 text-slate-600">
                      {children}
                    </blockquote>
                  ),

                  hr: () => (
                    <hr className="my-4 border-slate-200" />
                  ),

                  table: ({ children }) => (
                    <div className="overflow-x-auto my-3">
                      <table className="w-full border-collapse border border-slate-300 text-sm">
                        {children}
                      </table>
                    </div>
                  ),

                  thead: ({ children }) => (
                    <thead className="bg-slate-100">
                      {children}
                    </thead>
                  ),

                  th: ({ children }) => (
                    <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-900">
                      {children}
                    </th>
                  ),

                  td: ({ children }) => (
                    <td className="border border-slate-300 px-3 py-2 align-top">
                      {children}
                    </td>
                  )
                }}
              >
                {displayText}
              </ReactMarkdown>

            </div>
          )}

          {/* ---------------------------------- */}
          {/* Feedback */}
          {/* ---------------------------------- */}

          {!isUser && (
            <div className="mt-3 pt-2 flex flex-wrap items-center gap-2 border-t border-slate-200/50">

              <span className="text-xs text-slate-400 font-medium mr-1">
                Was this response helpful?
              </span>

              {/* Helpful */}

              <button
                id={`btn-helpful-${message.id}`}
                type="button"
                onClick={() =>
                  handleFeedback('helpful')
                }
                disabled={feedbackSubmitting}
                className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                  feedback === 'helpful'
                    ? 'bg-teal-50 border-teal-300 text-teal-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >

                {feedback === 'helpful' ? (
                  <Check className="w-3 h-3 text-teal-600" />
                ) : (
                  <ThumbsUp className="w-3 h-3" />
                )}

                <span>
                  Helpful
                </span>

              </button>

              {/* Not Helpful */}

              <button
                id={`btn-not-helpful-${message.id}`}
                type="button"
                onClick={() =>
                  handleFeedback(
                    'not_helpful'
                  )
                }
                disabled={feedbackSubmitting}
                className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                  feedback === 'not_helpful'
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >

                <ThumbsDown className="w-3 h-3" />

                <span>
                  Not Helpful
                </span>

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