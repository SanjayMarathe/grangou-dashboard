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
  getFlavorInsights: () => fetchEdge('restaurant-data/flavors'),
  getTrafficData: () => fetchEdge('restaurant-data/traffic'),
  getGouSuggestions: () => fetchEdge('restaurant-data/suggestions'),
  getMatchTypeBreakdown: () => fetchEdge('restaurant-data/match-types'),
  getPeakHours: () => fetchEdge('restaurant-data/peak-hours'),

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

export default { authAPI, dataAPI };
