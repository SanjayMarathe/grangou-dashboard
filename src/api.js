/**
 * API Service for Grangou Restaurant Dashboard
 * Handles all communication with Supabase Edge Functions
 */

const SUPABASE_FUNCTIONS_URL = 'https://vzytbtizaijkyunwxyaz.supabase.co/functions/v1';

/**
 * Helper function to make authenticated requests to Supabase Edge Functions
 */
const fetchEdge = async (functionPath, options = {}) => {
  const token = localStorage.getItem('authToken');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/${functionPath}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// ============================================
// AUTH API
// ============================================

export const authAPI = {
  /**
   * Login with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{token: string, user: object}>}
   */
  login: async (email, password) => {
    const data = await fetchEdge('restaurant-auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }

    return data;
  },

  register: async (formData) => {
    const data = await fetchEdge('restaurant-auth/register', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
    return data;
  },

  verify: async () => {
    return fetchEdge('restaurant-auth/verify');
  },

  logout: async () => {
    const result = await fetchEdge('restaurant-auth/logout', { method: 'POST' });
    localStorage.removeItem('authToken');
    return result;
  },
};

// ============================================
// DATA API
// ============================================

export const dataAPI = {
  getRestaurantProfile: () => fetchEdge('restaurant-data/profile'),
  getImpactMetrics: () => fetchEdge('restaurant-data/metrics'),
  getRecentExperiences: () => fetchEdge('restaurant-data/experiences'),
  getFlavorInsights: (period) => fetchEdge(`restaurant-data/flavors${period ? `?period=${period}` : ''}`),
  getTrafficData: () => fetchEdge('restaurant-data/traffic'),
  getGouSuggestions: () => fetchEdge('restaurant-data/suggestions'),
  getMatchTypeBreakdown: () => fetchEdge('restaurant-data/match-types'),
  getPeakHours: () => fetchEdge('restaurant-data/peak-hours'),

  // Menu management
  getMenu: () => fetchEdge('restaurant-data/menu'),
  createMenuItem: (item) => fetchEdge('restaurant-data/menu', {
    method: 'POST',
    body: JSON.stringify(item),
  }),
  updateMenuItem: (item) => fetchEdge('restaurant-data/menu', {
    method: 'PUT',
    body: JSON.stringify(item),
  }),
  deleteMenuItem: (id) => fetchEdge(`restaurant-data/menu?id=${id}`, {
    method: 'DELETE',
  }),

  // Order logging
  getOrders: () => fetchEdge('restaurant-data/orders'),
  getOrdersForMatch: (matchId) => fetchEdge(`restaurant-data/orders?match_id=${matchId}`),
  createOrders: (matchId, items) => fetchEdge('restaurant-data/orders', {
    method: 'POST',
    body: JSON.stringify({ match_id: matchId, items }),
  }),
  deleteOrdersForMatch: (matchId) => fetchEdge('restaurant-data/orders', {
    method: 'DELETE',
    body: JSON.stringify({ match_id: matchId }),
  }),

  // Recent matches for order logging
  getRecentMatches: () => fetchEdge('restaurant-data/matches-today'),

  getAllDashboardData: async () => {
    const [
      restaurantProfile,
      impactMetrics,
      recentExperiences,
      flavorInsights,
      trafficData,
      gouSuggestions,
      matchTypeBreakdown,
      peakHours,
    ] = await Promise.all([
      dataAPI.getRestaurantProfile(),
      dataAPI.getImpactMetrics(),
      dataAPI.getRecentExperiences(),
      dataAPI.getFlavorInsights(),
      dataAPI.getTrafficData(),
      dataAPI.getGouSuggestions(),
      dataAPI.getMatchTypeBreakdown(),
      dataAPI.getPeakHours(),
    ]);

    return {
      restaurantProfile,
      impactMetrics,
      recentExperiences,
      flavorInsights,
      trafficData,
      gouSuggestions,
      matchTypeBreakdown,
      peakHours,
    };
  },
};

// ============================================
// INTEGRATION API
// ============================================

export const integrationAPI = {
  getStatus: () => fetchEdge('restaurant-data/integrations'),

  connectStripe: (code) => fetchEdge('restaurant-data/integrations/stripe/connect', {
    method: 'POST',
    body: JSON.stringify({ code }),
  }),

  disconnectStripe: () => fetchEdge('restaurant-data/integrations/stripe/disconnect', {
    method: 'DELETE',
  }),

  getStripeInsights: () => fetchEdge('restaurant-data/stripe-insights'),

  connectSquare: (code) => fetchEdge('restaurant-data/integrations/square/connect', {
    method: 'POST',
    body: JSON.stringify({ code }),
  }),

  disconnectSquare: () => fetchEdge('restaurant-data/integrations/square/disconnect', {
    method: 'DELETE',
  }),
};

// ============================================
// AI API (SSE streaming)
// ============================================

export const aiAPI = {
  chat: async (message, history) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/restaurant-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, history }),
    });

    if (!response.ok) {
      throw new Error(`Chat request failed: ${response.status}`);
    }

    return response.body;
  },
};

const api = { authAPI, dataAPI, integrationAPI, aiAPI };
export default api;
