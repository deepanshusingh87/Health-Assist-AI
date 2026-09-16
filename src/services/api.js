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
  await delay(500);

  // Future Flask backend call:
  // const response = await fetch(`${API_BASE_URL}/login`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ email, password })
  // });
  // return await response.json();

  if (!email || !password) {
    throw new Error('Please enter both email and password.');
  }

  const mockUser = {
    id: 'usr-101',
    name: email.split('@')[0].replace('.', ' ').replace(/^./, (c) => c.toUpperCase()) || 'Healthcare User',
    email: email.toLowerCase(),
    token: 'jwt_mock_token_' + Math.random().toString(36).substring(2),
    role: 'patient',
  };

  try {
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(mockUser));
  } catch {
    // ignore
  }

  return {
    success: true,
    user: mockUser,
    message: 'Login successful',
  };
}

/**
 * 2. Register user
 * Future Flask Endpoint: POST /api/register
 */
export async function registerUser(fullName, email, password) {
  await delay(600);

  // Future Flask backend call:
  // const response = await fetch(`${API_BASE_URL}/register`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ name: fullName, email, password })
  // });
  // return await response.json();

  if (!fullName || !email || !password) {
    throw new Error('All registration fields are required.');
  }

  const mockUser = {
    id: 'usr-' + Math.floor(Math.random() * 10000),
    name: fullName,
    email: email.toLowerCase(),
    token: 'jwt_mock_token_' + Math.random().toString(36).substring(2),
    role: 'patient',
  };

  try {
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(mockUser));
  } catch {
    // ignore
  }

  return {
    success: true,
    user: mockUser,
    message: 'Account created successfully',
  };
}

/**
 * Get currently authenticated user from session
 */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {
    id: 'usr-demo',
    name: 'Demo User',
    email: 'patient@healthassist.ai',
    role: 'patient',
  };
}

/**
 * Logout current user
 */
export function logoutUser() {
  try {
    localStorage.removeItem(STORAGE_KEY_AUTH);
  } catch {
    // ignore
  }
}

/**
 * 3. Send message to AI chatbot
 * Future Flask Endpoint: POST /api/chat
 * (Invoking LangChain + Pinecone RAG + LLM)
 */
export async function sendMessage(question, conversationId = null) {
  await delay(700);

  // Future Flask backend call:
  // const token = getCurrentUser()?.token;
  // const response = await fetch(`${API_BASE_URL}/chat`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${token}`
  //   },
  //   body: JSON.stringify({ question, conversation_id: conversationId })
  // });
  // return await response.json();

  const lower = question.toLowerCase();
  let answer = '';
  let isUrgent = false;

  // Check for emergency / high-acuity keywords
  if (
    lower.includes('chest pain') ||
    lower.includes('heart attack') ||
    lower.includes('stroke') ||
    lower.includes('cannot breathe') ||
    lower.includes('difficulty breathing') ||
    lower.includes('severe bleeding') ||
    lower.includes('overdose') ||
    lower.includes('unconscious')
  ) {
    isUrgent = true;
    answer = `⚠️ IMMEDIATE ATTENTION REQUIRED: The symptoms described ("${question}") may indicate a medical emergency.\n\nPlease stop using this chatbot and immediately contact your local emergency medical services (such as 911, 112, or your country's emergency number) or proceed to the nearest hospital emergency room.\n\nHealth Assist AI is an informational tool and cannot provide emergency medical intervention.`;
  } else if (lower.includes('diabetes')) {
    answer = 'Common symptoms of diabetes may include increased thirst (polydipsia), frequent urination, constant hunger, unexplained weight loss, fatigue, blurred vision, and slow-healing cuts or bruises. Symptoms can vary between individuals and between Type 1 and Type 2 diabetes. A clinical blood test (such as Fasting Plasma Glucose or HbA1c) administered by a healthcare professional is necessary for an accurate diagnosis.';
  } else if (lower.includes('blood pressure') || lower.includes('hypertension')) {
    answer = 'A normal resting blood pressure for adults is generally defined as less than 120/80 mm Hg. The top number (systolic) measures arterial pressure when the heart beats, and the bottom number (diastolic) measures pressure between beats. Regular physical exercise, maintaining a healthy weight, moderating sodium intake, avoiding tobacco, and managing stress are key non-pharmacological methods to support healthy blood pressure.';
  } else if (lower.includes('migraine') || lower.includes('headache')) {
    answer = 'Migraines are characterized by intense, throbbing pain, typically on one side of the head. Common symptoms include sensitivity to light and sound, nausea, visual auras, and dizziness. Common triggers include hormonal changes, lack of sleep, stress, sensory stimuli, skipping meals, and specific food preservatives. Resting in a quiet, dark room and staying hydrated can provide relief. Consult a neurologist or physician if headaches become frequent or disabling.';
  } else if (lower.includes('vitamin d')) {
    answer = 'Vitamin D deficiency can present with generalized bone tenderness, fatigue, muscle weakness, frequent infections, hair thinning, and low mood. Because dietary sources (such as fortified milk, egg yolks, and oily fish) are limited, moderate safe sun exposure and physician-monitored vitamin D3 supplementation are often recommended following a 25-hydroxy vitamin D blood test.';
  } else if (lower.includes('diet') || lower.includes('nutrition') || lower.includes('food')) {
    answer = 'A balanced, health-promoting diet focuses on nutrient-dense whole foods: colorful vegetables, whole fruits, complex grains (such as brown rice and oats), quality lean proteins (beans, fish, poultry), and healthy fats (olive oil, avocados, nuts). Limiting ultra-processed items, refined sugars, and excessive sodium helps preserve metabolic health and cardiovascular function.';
  } else if (lower.includes('fever') || lower.includes('temperature')) {
    answer = 'A fever is generally defined as a body temperature of 100.4°F (38°C) or higher. It is a natural physiological immune response to infection. Supportive care includes plenty of rest, fluid intake, and light clothing. Seek prompt medical care if a fever exceeds 103°F (39.4°C), lasts more than three consecutive days, or is accompanied by stiff neck, shortness of breath, or confusion.';
  } else {
    answer = `Thank you for your question regarding "${question}".\n\nBased on general medical knowledge, maintaining wellness requires balanced nutrition, regular restorative sleep (7–9 hours), daily physical activity, and routine preventive checkups with qualified healthcare providers. If you are noticing persistent or troubling symptoms, we strongly encourage scheduling an evaluation with a certified medical doctor for personalized clinical evaluation.`;
  }

  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return {
    success: true,
    conversationId: conversationId || 'chat-' + Date.now(),
    message: {
      id: 'm-' + Date.now(),
      sender: 'ASSISTANT',
      text: answer,
      timestamp: timeString,
      isUrgent,
      feedback: null,
    },
  };
}

/**
 * 4. Get chat history
 * Future Flask Endpoint: GET /api/history
 */
export async function getChatHistory() {
  await delay(300);

  // Future Flask backend call:
  // const token = getCurrentUser()?.token;
  // const response = await fetch(`${API_BASE_URL}/history`, {
  //   headers: { 'Authorization': `Bearer ${token}` }
  // });
  // return await response.json();

  return loadStoredHistory();
}

/**
 * 5. Delete conversation by ID
 * Future Flask Endpoint: DELETE /api/history/:id
 */
export async function deleteChat(chatId) {
  await delay(200);

  // Future Flask backend call:
  // const token = getCurrentUser()?.token;
  // const response = await fetch(`${API_BASE_URL}/history/${chatId}`, {
  //   method: 'DELETE',
  //   headers: { 'Authorization': `Bearer ${token}` }
  // });
  // return await response.json();

  const history = loadStoredHistory();
  const filtered = history.filter((item) => item.id !== chatId);
  saveStoredHistory(filtered);
  return { success: true, deletedId: chatId };
}

/**
 * 5b. Clear all conversations
 * Future Flask Endpoint: DELETE /api/history
 */
export async function clearAllHistory() {
  await delay(200);
  saveStoredHistory([]);
  return { success: true };
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
  await delay(800);

  // Future Flask backend call:
  // const response = await fetch(`${API_BASE_URL}/hospitals?lat=${latitude}&lng=${longitude}`);
  // return await response.json();

  // Return realistic mock hospital data
  return {
    success: true,
    userLocation: { latitude, longitude },
    hospitals: MOCK_HOSPITALS,
  };
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
