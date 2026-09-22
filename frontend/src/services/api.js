    /**
     * Health Assist AI - API Service Layer
     * 
     * This service provides API integration functions for the Health Assist AI frontend.
     * Currently configured with mock/sample data for demonstration and frontend development.
     * 
     * Future Python Flask REST API Endpoints:
     * - POST   /api/login          -> Authenticate user and receive JWT token
     * - POST   /api/register       -> Register a new user account
     * - POST   /api/chat           -> Send question to LangChain + RAG + Pinecone + LLM pipeline
     * - GET    /api/history        -> Retrieve conversation history for current user from SQLite
     * - DELETE /api/history/:id    -> Delete specific conversation session
     * - DELETE /api/history        -> Clear all conversations for current user
     * - GET    /api/hospitals      -> Fetch nearby healthcare facilities based on lat/lng
     * - POST   /api/feedback       -> Submit user feedback (Helpful / Not Helpful) on AI response
     */

    // Configurable API base URL for future Flask backend connection
    export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    // Initial mock chat history items
    const INITIAL_HISTORY = [
      {
        id: 'chat-1',
        title: 'Diabetes Symptoms',
        snippet: 'What are common symptoms of diabetes?',
        timestamp: 'Today, 10:30 AM',
        date: new Date().toISOString(),
        messages: [
          {
            id: 'm-1',
            sender: 'USER',
            text: 'What are common symptoms of diabetes?',
            timestamp: '10:30 AM',
          },
          {
            id: 'm-2',
            sender: 'ASSISTANT',
            text: 'Common symptoms of diabetes include increased thirst (polydipsia), frequent urination (polyuria), extreme fatigue, unexplained weight loss, blurred vision, and slow-healing sores. Type 1 diabetes symptoms can develop quickly over weeks, whereas Type 2 symptoms often develop slowly and may be subtle. If you experience these symptoms consistently, consider getting a fasting blood glucose or HbA1c test conducted by a licensed physician.',
            timestamp: '10:30 AM',
            feedback: null,
          },
        ],
      },
      {
        id: 'chat-2',
        title: 'Migraine Causes',
        snippet: 'What causes migraine?',
        timestamp: 'Yesterday, 8:15 PM',
        date: new Date(Date.now() - 86400000).toISOString(),
        messages: [
          {
            id: 'm-3',
            sender: 'USER',
            text: 'What causes migraine?',
            timestamp: '8:15 PM',
          },
          {
            id: 'm-4',
            sender: 'ASSISTANT',
            text: 'Migraines are complex neurovascular disorders. While the exact physiological mechanism involves abnormal brain activity temporarily affecting nerve signals and blood flow, common triggers include:\n\n• Stress and emotional changes\n• Hormonal fluctuations (especially estrogen in women)\n• Sleep irregularities or fatigue\n• Dietary triggers (aged cheeses, caffeine, artificial sweeteners, alcohol)\n• Sensory stimuli such as bright flashing lights or strong odors\n• Weather or barometric pressure shifts\n\nKeeping a migraine headache diary can help identify your specific triggers.',
            timestamp: '8:16 PM',
            feedback: 'helpful',
          },
        ],
      },
      {
        id: 'chat-3',
        title: 'Normal Blood Pressure',
        snippet: 'What is considered a normal blood pressure reading?',
        timestamp: 'September 12, 2026',
        date: new Date(Date.now() - 86400000 * 3).toISOString(),
        messages: [
          {
            id: 'm-5',
            sender: 'USER',
            text: 'What is considered a normal blood pressure reading?',
            timestamp: '3:45 PM',
          },
          {
            id: 'm-6',
            sender: 'ASSISTANT',
            text: 'According to standard clinical guidelines (American Heart Association & WHO):\n\n• Normal: Systolic less than 120 mm Hg AND Diastolic less than 80 mm Hg.\n• Elevated: Systolic between 120–129 mm Hg AND Diastolic less than 80 mm Hg.\n• Stage 1 Hypertension: Systolic 130–139 mm Hg OR Diastolic 80–89 mm Hg.\n• Stage 2 Hypertension: Systolic 140 mm Hg or higher OR Diastolic 90 mm Hg or higher.\n\nMaintain cardiovascular health through a balanced low-sodium diet, regular aerobic exercise, and routine blood pressure checks.',
            timestamp: '3:46 PM',
            feedback: null,
          },
        ],
      },
      {
        id: 'chat-4',
        title: 'Vitamin D Deficiency',
        snippet: 'What happens when vitamin D is low?',
        timestamp: 'September 10, 2026',
        date: new Date(Date.now() - 86400000 * 5).toISOString(),
        messages: [
          {
            id: 'm-7',
            sender: 'USER',
            text: 'What happens when vitamin D is low?',
            timestamp: '11:10 AM',
          },
          {
            id: 'm-8',
            sender: 'ASSISTANT',
            text: 'Vitamin D is essential for calcium absorption, immune system regulation, and bone remodeling. Low vitamin D levels can cause:\n\n• Chronic fatigue and low energy\n• Bone pain, lower back discomfort, and increased fracture risk\n• Muscle aches, cramps, or weakness\n• Mood shifts and depressive symptoms\n• Impaired immune defense and frequent respiratory infections\n\nA 25-hydroxy vitamin D blood test can confirm deficiency. Sunlight exposure, fortified foods, fatty fish, and physician-prescribed supplements help restore optimal levels.',
            timestamp: '11:11 AM',
            feedback: 'helpful',
          },
        ],
      },
      {
        id: 'chat-5',
        title: 'Healthy Diet',
        snippet: 'What are key components of a balanced nutritional diet?',
        timestamp: 'September 08, 2026',
        date: new Date(Date.now() - 86400000 * 7).toISOString(),
        messages: [
          {
            id: 'm-9',
            sender: 'USER',
            text: 'What are key components of a balanced nutritional diet?',
            timestamp: '2:20 PM',
          },
          {
            id: 'm-10',
            sender: 'ASSISTANT',
            text: 'A balanced, wholesome diet prioritizes:\n\n1. Abundant vegetables and fruits (providing fiber, vitamins, and phytonutrients)\n2. Whole grains (such as oats, brown rice, and quinoa)\n3. Lean proteins (legumes, lentils, poultry, tofu, fish)\n4. Healthy fats (olive oil, avocados, nuts, seeds)\n5. Adequate hydration with plain water\n\nLimit ultra-processed items, refined sugars, and excessive dietary sodium for long-term metabolic health.',
            timestamp: '2:21 PM',
            feedback: null,
          },
        ],
      },
    ];

    // Mock hospitals database
    const MOCK_HOSPITALS = [
      {
        id: 'hosp-1',
        name: 'City Hospital & Trauma Centre',
        distanceKm: 1.2,
        address: '104 Healthcare Boulevard, Central District',
        facilityType: 'General Hospital',
        status: 'Open 24/7',
        isOpen: true,
        emergencyAvailable: true,
        phone: '+1 (555) 234-5678',
        specialties: ['Emergency Medicine', 'General Surgery', 'Cardiology', 'Pediatrics'],
        rating: 4.7,
      },
      {
        id: 'hosp-2',
        name: 'Life Care Multispeciality Hospital',
        distanceKm: 2.4,
        address: '42 Medical Square, West Wing Road',
        facilityType: 'Multi-Speciality Hospital',
        status: 'Open 24/7',
        isOpen: true,
        emergencyAvailable: true,
        phone: '+1 (555) 876-5432',
        specialties: ['Cardiology', 'Neurology', 'Orthopedics', 'ICU & Critical Care'],
        rating: 4.8,
      },
      {
        id: 'hosp-3',
        name: 'Community Health Centre',
        distanceKm: 3.1,
        address: '88 Public Welfare Avenue, Sector 4',
        facilityType: 'Healthcare Centre',
        status: 'Open • Closes 8:00 PM',
        isOpen: true,
        emergencyAvailable: false,
        phone: '+1 (555) 345-6789',
        specialties: ['Primary Care', 'Immunization', 'Maternal Health', 'General OPD'],
        rating: 4.3,
      },
      {
        id: 'hosp-4',
        name: 'Apex Super Speciality Institute',
        distanceKm: 4.5,
        address: '12 Pioneer Avenue, Tech Corridor',
        facilityType: 'Super Speciality Hospital',
        status: 'Open 24/7',
        isOpen: true,
        emergencyAvailable: true,
        phone: '+1 (555) 901-2345',
        specialties: ['Oncology', 'Organ Transplant', 'Neurosurgery', 'Advanced Diagnostics'],
        rating: 4.9,
      },
      {
        id: 'hosp-5',
        name: 'Green Cross Family Clinic & Diagnostic Centre',
        distanceKm: 1.8,
        address: '215 Willow Creek Road, Block B',
        facilityType: 'Clinic & Diagnostics',
        status: 'Open • Closes 9:00 PM',
        isOpen: true,
        emergencyAvailable: false,
        phone: '+1 (555) 432-1098',
        specialties: ['Family Medicine', 'Blood Pathology Lab', 'Ultrasound & X-Ray', 'Health Checkups'],
        rating: 4.5,
      },
      {
        id: 'hosp-6',
        name: 'Metro Urgent Care & Walk-in Clinic',
        distanceKm: 2.9,
        address: '507 Commercial Ring, Suite 100',
        facilityType: 'Urgent Care Center',
        status: 'Open 24/7',
        isOpen: true,
        emergencyAvailable: true,
        phone: '+1 (555) 678-9012',
        specialties: ['Urgent Minor Trauma', 'X-Ray', 'Minor Illnesses', 'Rapid Diagnostics'],
        rating: 4.6,
      },
    ];

    // Helper to simulate network latency
    const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

    // Local storage keys
    const STORAGE_KEY_AUTH = 'health_assist_auth';
    const STORAGE_KEY_HISTORY = 'health_assist_history';

    // Helper to load history from localStorage or fallback to mock
    function loadStoredHistory() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
        if (raw) {
          return JSON.parse(raw);
        }
      } catch {
        // ignore
      }
      return INITIAL_HISTORY;
    }

    function saveStoredHistory(history) {
      try {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
      } catch {
        // ignore
      }
    }

    /**
    * 1. Authenticate user
    * Future Flask Endpoint: POST /api/login
    */
    export async function loginUser(email, password) {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed.');
      }

      localStorage.setItem('healthAssistToken', data.token);

      localStorage.setItem(
        'healthAssistUser',
        JSON.stringify(data.user)
      );

      return {
        success: true,
        token: data.token,
        user: data.user
      };
    }
    /**
      Send email verification OTP
      POST /api/send-otp
    */
    export async function sendOTP(email) {
      const response = await fetch(`${API_BASE_URL}/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Unable to send verification OTP.'
        );
      }

      return {
        success: true,
        message: data.message
      };
    }


    /**
    Verify email OTP
      POST /api/verify-otp
    */
    export async function verifyOTP(email, otp) {
      const response = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'OTP verification failed.'
        );
      }

      return {
        success: true,
        message: data.message,
        verificationToken: data.verification_token
      };
    }
    /**
 * Send password reset OTP
 * POST /api/forgot-password/send-otp
 */
export async function sendForgotPasswordOTP(email) {
  const response = await fetch(
    `${API_BASE_URL}/forgot-password/send-otp`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email.trim()
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || 'Unable to send password reset OTP.'
    );
  }

  return {
    success: true,
    message: data.message
  };
}


/**
 * Verify password reset OTP
 * POST /api/forgot-password/verify-otp
 */
export async function verifyForgotPasswordOTP(email, otp) {
  const response = await fetch(
    `${API_BASE_URL}/forgot-password/verify-otp`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email.trim(),
        otp: otp.trim()
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || 'Password reset OTP verification failed.'
    );
  }

  return {
    success: true,
    message: data.message,
    resetToken: data.reset_token
  };
}


/**
 * Reset password
 * POST /api/forgot-password/reset
 */
export async function resetForgotPassword(
  email,
  newPassword,
  resetToken
) {
  const response = await fetch(
    `${API_BASE_URL}/forgot-password/reset`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email.trim(),
        new_password: newPassword,
        reset_token: resetToken
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || 'Unable to reset password.'
    );
  }

  return {
    success: true,
    message: data.message
  };
}
    /**
    * Register verified user
    * POST /api/register
    */
    export async function registerUser(
      name,
      email,
      password,
      verificationToken
    ) {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password,
          verification_token: verificationToken
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Registration failed.'
        );
      }

      // Save normal login JWT
      localStorage.setItem(
        'healthAssistToken',
        data.token
      );

      // Save registered user
      localStorage.setItem(
        'healthAssistUser',
        JSON.stringify(data.user)
      );

      return {
        success: true,
        token: data.token,
        user: data.user
      };
    }
    /**
    * Get currently authenticated user from session
    */
    export function getCurrentUser() {
      try {
        const raw = localStorage.getItem('healthAssistUser');

        if (raw) {
          return JSON.parse(raw);
        }
      } catch (error) {
        console.error('Unable to read user data:', error);
      }

      return null;
    }

    /**
    * Logout current user
    */
    export function logoutUser() {
      try {
        localStorage.removeItem('healthAssistToken');
        localStorage.removeItem('healthAssistUser');
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    /**
    * 3. Send message to AI chatbot
    * Future Flask Endpoint: POST /api/chat
    * (Invoking LangChain + Pinecone RAG + LLM)
    */
    export async function sendMessage(question, conversationId = null) {
      if (!question || !question.trim()) {
        throw new Error('Please enter a healthcare question.');
      }

      const token = localStorage.getItem('healthAssistToken');

    if (!token) {
      throw new Error('Please login before using Health Assist AI.');
    }

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        question: question.trim(),
        conversation_id: conversationId
      })
    });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Unable to get response from Health Assist AI.'
        );
      }

      const now = new Date();

      const timeString = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });

      return {
        success: true,

        conversationId:data.conversation_id,
          

        message: {
          id: 'm-' + Date.now(),
          sender: 'ASSISTANT',
          text: data.answer,
          timestamp: timeString,
          isUrgent: false,
          feedback: null
        }
      };
    }

    /**
    * 4. Get chat history
    * Future Flask Endpoint: GET /api/history
    */
    export async function getChatHistory() {
      const token = localStorage.getItem('healthAssistToken');

      if (!token) {
        throw new Error('Please login to view chat history.');
      }

      const response = await fetch(`${API_BASE_URL}/history`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load chat history.');
      }

      return (data.history || []).map((item) => ({
        ...item,
        timestamp: item.date
      }));
    }
    /**
    * Get all messages from one conversation
    * GET /api/history/:conversationId
    */
    export async function getConversationById(conversationId) {
      const token = localStorage.getItem('healthAssistToken');

      if (!token) {
        throw new Error('Please login to view this conversation.');
      }

      const response = await fetch(
        `${API_BASE_URL}/history/${conversationId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          data.message ||
          'Unable to load conversation.'
        );
      }

      return data;
    }
    /**
    * 5. Delete conversation by ID
    * Future Flask Endpoint: DELETE /api/history/:id
    */
    export async function deleteChat(conversationId) {
      const token = localStorage.getItem('healthAssistToken');

      if (!token) {
        throw new Error('Please login first.');
      }

      const response = await fetch(
        `${API_BASE_URL}/history/${conversationId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Unable to delete conversation.');
      }

      return data;
    }
    /**
    * 5b. Clear all conversations
    * Future Flask Endpoint: DELETE /api/history
    */
    export async function clearAllHistory() {
      const token = localStorage.getItem('healthAssistToken');

      if (!token) {
        throw new Error('Please login first.');
      }

      const response = await fetch(`${API_BASE_URL}/history`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Unable to clear chat history.');
      }

      return data;
    }

    /**
    * Save or update a conversation in local history
    */
    export function saveConversationToHistory(chat) {
      const history = loadStoredHistory();
      const existingIndex = history.findIndex((h) => h.id === chat.id);
      if (existingIndex >= 0) {
        history[existingIndex] = chat;
      } else {
        history.unshift(chat);
      }
      saveStoredHistory(history);
    }

    /**
    * 6. Get nearby hospitals
    * Future Flask Endpoint: GET /api/hospitals?lat=...&lng=...
    */
    export async function getNearbyHospitals(latitude, longitude) {
      const token = localStorage.getItem('healthAssistToken');

      const response = await fetch(`${API_BASE_URL}/hospitals/nearby`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && {
            'Authorization': `Bearer ${token}`
          })
        },
        body: JSON.stringify({
          latitude: latitude,
          longitude: longitude,
          radius: 5000
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          data.error ||
          'Unable to find nearby hospitals.'
        );
      }

      return data;
    }

    /**
    * 7. Submit feedback on AI response (Helpful / Not Helpful)
    * Future Flask Endpoint: POST /api/feedback
    */
    export async function submitFeedback(messageId, rating) {
      await delay(200);

      // Future Flask backend call:
      // await fetch(`${API_BASE_URL}/feedback`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ message_id: messageId, rating }) // rating: 'helpful' | 'not_helpful'
      // });

      return { success: true, messageId, rating };
    }
    export async function checkBackendHealth() {
      const response = await fetch(`${API_BASE_URL}/health`);

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      return await response.json();
    }
