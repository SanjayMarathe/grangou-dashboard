import React, { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  Star,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  ChefHat,
  Check,
  Clock,
  Heart,
  Utensils,
  BarChart3,
  Bell,
  Search,
  RefreshCw,
  ExternalLink,
  Sparkles,
  LogOut,
  Loader2
} from 'lucide-react';
import { AuthProvider, useAuth } from './AuthContext';
import { dataAPI } from './api';
import './index.css';

// Brand Colors - Grangou Style Guide
const colors = {
  red: '#FF3B3F',
  redHover: '#E63538',
  black: '#222222',
  grey: '#F4F4F4',
  white: '#FFFFFF',
  yellow: '#FFD166',
  green: '#06D6A0',
};

// Grangou Logo Component (X with fork and knife)
const GrangouLogo = ({ size = 32 }) => (
  <img
    src="/image.png"
    alt="Grangou"
    width={size}
    height={size}
    style={{ borderRadius: size * 0.2 }}
  />
);

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center">
    <div className="text-center">
      <GrangouLogo size={64} />
      <div className="mt-4 flex items-center justify-center gap-2 text-gray-500">
        <Loader2 className="animate-spin" size={20} />
        <span>Loading dashboard...</span>
      </div>
    </div>
  </div>
);

// Login Page Component
const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);

    if (!result.success) {
      setError(result.error || 'Login failed');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <GrangouLogo size={64} />
          </div>
          <h1 className="text-2xl font-bold text-[#222222]">Welcome to Grangou</h1>
          <p className="text-gray-500 mt-2">Sign in to your restaurant portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#222222] mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3F] focus:border-transparent"
              placeholder="restaurant@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#222222] mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3F] focus:border-transparent"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#FF3B3F] hover:bg-[#E63538] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>


      </div>
    </div>
  );
};

// Header Component
const Header = ({ restaurantProfile, onRefresh, isRefreshing }) => {
  const { user, logout } = useAuth();

  return (
    <header className="mb-8">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <GrangouLogo size={36} />
          <div>
            <h1 className="font-bold text-[#222222] text-lg">grangou</h1>
            <p className="text-xs text-gray-500">Restaurant Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2.5 bg-white rounded-lg text-gray-500 hover:text-[#222222] hover:shadow-md transition-all border border-gray-200">
            <Search size={20} />
          </button>
          <button className="p-2.5 bg-white rounded-lg text-gray-500 hover:text-[#222222] hover:shadow-md transition-all border border-gray-200 relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#FF3B3F] rounded-full border-2 border-white"></span>
          </button>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#FF3B3F] hover:bg-[#E63538] rounded-lg text-white font-semibold text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Syncing...' : 'Sync Data'}
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-[#FF3B3F] hover:bg-[#FF3B3F]/10 rounded-lg transition-colors text-sm border border-gray-200"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
      <div>
        <h2 className="text-[32px] font-bold text-[#222222] mb-1">
          Hey there, {user?.name || 'Restaurant'}!
        </h2>
        <p className="text-gray-500 text-base">
          Ready to see how your guests are matching and munching?
        </p>
      </div>
    </header>
  );
};

// Impact Metrics Component
const ImpactMetrics = ({ impactMetrics }) => {
  if (!impactMetrics) return null;

  const metrics = [
    {
      label: 'Total Grangou Guests',
      value: impactMetrics.totalGrangouGuests.toLocaleString(),
      change: impactMetrics.guestGrowth,
      icon: <Users className="text-[#FF3B3F]" size={24} />,
      positive: true,
      bgColor: 'bg-[#FF3B3F]/10'
    },
    {
      label: 'Estimated Revenue',
      value: `$${impactMetrics.estimatedRevenue.toLocaleString()}`,
      change: impactMetrics.revenueGrowth,
      icon: <DollarSign className="text-[#06D6A0]" size={24} />,
      positive: true,
      bgColor: 'bg-[#06D6A0]/10'
    },
    {
      label: 'Average Rating',
      value: impactMetrics.averageRating.toFixed(1),
      change: impactMetrics.ratingChange,
      icon: <Star className="text-[#FFD166]" size={24} />,
      positive: true,
      suffix: '/5',
      bgColor: 'bg-[#FFD166]/10'
    },
    {
      label: 'Repeat Visitors',
      value: `${impactMetrics.repeatVisitors}%`,
      change: 5.2,
      icon: <Heart className="text-[#FF3B3F]" size={24} />,
      positive: true,
      bgColor: 'bg-[#FF3B3F]/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="bg-white rounded-lg p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 ${metric.bgColor} rounded-lg`}>{metric.icon}</div>
            <div
              className={`flex items-center gap-1 text-sm font-semibold ${
                metric.positive ? 'text-[#06D6A0]' : 'text-[#FF3B3F]'
              }`}
            >
              {metric.positive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {metric.change}%
            </div>
          </div>
          <p className="text-gray-500 text-sm mb-1">{metric.label}</p>
          <p className="text-[32px] font-bold text-[#222222]">
            {metric.value}
            {metric.suffix && <span className="text-lg text-gray-400">{metric.suffix}</span>}
          </p>
        </div>
      ))}
    </div>
  );
};

// Gou Says AI Suggestion Component
const GouSaysCard = ({ gouSuggestions }) => {
  const [currentSuggestion, setCurrentSuggestion] = useState(0);

  if (!gouSuggestions || gouSuggestions.length === 0) return null;

  const suggestion = gouSuggestions[currentSuggestion];

  return (
    <div className="bg-gradient-to-r from-[#FF3B3F] to-[#FF6B6F] rounded-lg p-6 mb-8 shadow-lg">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-white/20 rounded-lg text-white">
          <Sparkles size={24} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-white text-lg">Gou Says...</h3>
            <span className="px-2 py-0.5 bg-white/20 text-white text-xs font-semibold rounded-full">
              AI Insight
            </span>
          </div>
          <p className="text-white/90 mb-4 text-base">{suggestion.message}</p>
          <div className="flex items-center gap-3">
            <button className="px-5 py-2.5 bg-white text-[#FF3B3F] text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
              Take Action
            </button>
            <button
              onClick={() => setCurrentSuggestion((prev) => (prev + 1) % gouSuggestions.length)}
              className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Next Tip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Recent Experiences Component
const RecentExperiences = ({ recentExperiences: initialExperiences }) => {
  const [experiences, setExperiences] = useState([]);

  useEffect(() => {
    if (initialExperiences) {
      setExperiences(initialExperiences);
    }
  }, [initialExperiences]);

  const handleAcknowledge = (id) => {
    setExperiences(
      experiences.map((exp) => (exp.id === id ? { ...exp, acknowledged: true } : exp))
    );
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={i < rating ? 'text-[#FFD166] fill-[#FFD166]' : 'text-gray-300'}
      />
    ));
  };

  if (!experiences || experiences.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-card overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-[#222222]">Recent Grangou Experiences</h2>
          <p className="text-sm text-gray-500">What your guests are saying about their matches</p>
        </div>
        <button className="text-[#FF3B3F] text-sm font-semibold hover:underline flex items-center gap-1">
          View All <ExternalLink size={14} />
        </button>
      </div>
      <div className="divide-y divide-gray-100">
        {experiences.map((exp) => (
          <div key={exp.id} className="p-6 hover:bg-[#F4F4F4]/50 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#FF3B3F] to-[#FF6B6F] rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0">
                {exp.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-[#222222]">{exp.userName}</span>
                    <div className="flex gap-0.5">{renderStars(exp.rating)}</div>
                  </div>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={12} />
                    {exp.timeAgo}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{exp.review}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-[#FF3B3F]/10 text-[#FF3B3F] text-xs font-semibold rounded-full">
                      {exp.matchType}
                    </span>
                    {exp.keywords.slice(0, 2).map((keyword, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-[#F4F4F4] text-gray-600 text-xs rounded-full"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                  {!exp.acknowledged ? (
                    <button
                      onClick={() => handleAcknowledge(exp.id)}
                      className="px-4 py-1.5 bg-[#FF3B3F] text-white text-xs font-semibold rounded-lg hover:bg-[#E63538] transition-colors flex items-center gap-1"
                    >
                      <Check size={14} />
                      Acknowledge
                    </button>
                  ) : (
                    <span className="text-xs text-[#06D6A0] font-semibold flex items-center gap-1">
                      <Check size={14} />
                      Acknowledged
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Flavor Insights Component
const FlavorInsights = ({ flavorInsights }) => {
  if (!flavorInsights || flavorInsights.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[20px] font-bold text-[#222222] flex items-center gap-2">
            <ChefHat size={20} className="text-[#FF3B3F]" />
            Gou's Flavor Insights
          </h2>
          <p className="text-sm text-gray-500">What your Grangou guests love most</p>
        </div>
      </div>
      <div className="space-y-4">
        {flavorInsights.map((item, index) => (
          <div key={index}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#222222] font-semibold">{item.item}</span>
              <span className="text-sm text-gray-500">{item.orders} orders</span>
            </div>
            <div className="h-3 bg-[#F4F4F4] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FF3B3F] to-[#FF6B6F] rounded-full transition-all duration-500"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{item.percentage}% of guests loved this</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Traffic Chart Component
const TrafficChart = ({ trafficData }) => {
  const [hoveredBar, setHoveredBar] = useState(null);

  if (!trafficData || trafficData.length === 0) return null;

  const lastWeekData = trafficData.slice(-7);
  const maxVisitors = Math.max(...lastWeekData.map((d) => d.visitors));
  const minVisitors = Math.min(...lastWeekData.map((d) => d.visitors));
  const totalVisitors = lastWeekData.reduce((sum, d) => sum + d.visitors, 0);
  const avgVisitors = Math.round(totalVisitors / lastWeekData.length);

  // Calculate growth percentage
  const previousWeekData = trafficData.slice(-14, -7);
  const previousTotal = previousWeekData.reduce((sum, d) => sum + d.visitors, 0);
  const growthPercent = previousTotal > 0
    ? Math.round(((totalVisitors - previousTotal) / previousTotal) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[20px] font-bold text-[#222222]">Grangou Traffic</h2>
          <p className="text-sm text-gray-500">Guests matched to your spot (last 7 days)</p>
        </div>
        <div className="text-right">
          <p className="text-[28px] font-bold text-[#222222]">{totalVisitors}</p>
          <p className={`text-xs font-semibold flex items-center justify-end gap-1 ${growthPercent >= 0 ? 'text-[#06D6A0]' : 'text-[#FF3B3F]'}`}>
            {growthPercent >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {growthPercent >= 0 ? '+' : ''}{growthPercent}% from last week
          </p>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-xs text-gray-400">
          <span>{maxVisitors}</span>
          <span>{Math.round(maxVisitors / 2)}</span>
          <span>0</span>
        </div>

        {/* Chart Area */}
        <div className="ml-10">
          {/* Grid lines */}
          <div className="absolute left-10 right-0 top-0 h-[200px] flex flex-col justify-between pointer-events-none">
            <div className="border-t border-gray-100 w-full"></div>
            <div className="border-t border-gray-100 w-full"></div>
            <div className="border-t border-gray-200 w-full"></div>
          </div>

          {/* Average line */}
          <div
            className="absolute left-10 right-0 border-t-2 border-dashed border-[#FFD166] pointer-events-none z-10"
            style={{ top: `${200 - (avgVisitors / maxVisitors) * 200}px` }}
          >
            <span className="absolute right-0 -top-5 text-xs text-[#FFD166] font-medium bg-white px-1">
              avg: {avgVisitors}
            </span>
          </div>

          {/* Bars */}
          <div className="h-[200px] flex items-end gap-2 relative">
            {lastWeekData.map((day, index) => {
              const height = (day.visitors / maxVisitors) * 100;
              const isHovered = hoveredBar === index;

              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-1 relative"
                  onMouseEnter={() => setHoveredBar(index)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#222222] text-white text-xs py-1.5 px-3 rounded-lg shadow-lg z-20 whitespace-nowrap">
                      <div className="font-semibold">{day.visitors} guests</div>
                      <div className="text-gray-300">{day.date}</div>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-[#222222]"></div>
                    </div>
                  )}

                  {/* Bar */}
                  <div
                    className={`w-full rounded-t-lg transition-all duration-300 cursor-pointer ${
                      isHovered
                        ? 'bg-gradient-to-t from-[#E63538] to-[#FF3B3F] scale-105'
                        : 'bg-gradient-to-t from-[#FF3B3F] to-[#FF6B6F]'
                    }`}
                    style={{
                      height: `${height}%`,
                      minHeight: '4px',
                      boxShadow: isHovered ? '0 4px 12px rgba(255, 59, 63, 0.4)' : 'none'
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="flex gap-2 mt-2">
            {lastWeekData.map((day, index) => (
              <div
                key={index}
                className={`flex-1 text-center text-xs ${
                  hoveredBar === index ? 'text-[#FF3B3F] font-semibold' : 'text-gray-400'
                }`}
              >
                {day.date.split(' ')[1]}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
        <div className="text-center">
          <p className="text-xs text-gray-400">Daily Avg</p>
          <p className="text-lg font-bold text-[#222222]">{avgVisitors}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400">Peak Day</p>
          <p className="text-lg font-bold text-[#06D6A0]">{maxVisitors}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400">Low Day</p>
          <p className="text-lg font-bold text-[#FFD166]">{minVisitors}</p>
        </div>
      </div>
    </div>
  );
};

// Match Type Breakdown Component
const MatchTypeBreakdown = ({ matchTypeBreakdown }) => {
  if (!matchTypeBreakdown || matchTypeBreakdown.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[20px] font-bold text-[#222222]">Match Types</h2>
          <p className="text-sm text-gray-500">How guests discover your spot</p>
        </div>
      </div>
      <div className="space-y-4">
        {matchTypeBreakdown.map((item, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-[#222222] font-medium">{item.type}</span>
                <span className="text-sm font-bold text-[#222222]">{item.percentage}%</span>
              </div>
              <div className="h-2 bg-[#F4F4F4] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Quick Actions Component
const QuickActions = () => (
  <div className="bg-white rounded-lg shadow-card p-6">
    <h2 className="text-[20px] font-bold text-[#222222] mb-4">Quick Actions</h2>
    <div className="grid grid-cols-2 gap-3">
      <button className="p-4 bg-[#F4F4F4] hover:bg-[#FF3B3F]/10 rounded-lg text-left transition-colors group border border-transparent hover:border-[#FF3B3F]/20">
        <MessageSquare size={20} className="text-[#FF3B3F] mb-2" />
        <p className="text-sm font-semibold text-[#222222]">Respond to Reviews</p>
        <p className="text-xs text-gray-500">3 waiting for you</p>
      </button>
      <button className="p-4 bg-[#F4F4F4] hover:bg-[#06D6A0]/10 rounded-lg text-left transition-colors group border border-transparent hover:border-[#06D6A0]/20">
        <Utensils size={20} className="text-[#06D6A0] mb-2" />
        <p className="text-sm font-semibold text-[#222222]">Update Menu</p>
        <p className="text-xs text-gray-500">Last updated 5d ago</p>
      </button>
      <button className="p-4 bg-[#F4F4F4] hover:bg-[#FFD166]/10 rounded-lg text-left transition-colors group border border-transparent hover:border-[#FFD166]/20">
        <Users size={20} className="text-[#FFD166] mb-2" />
        <p className="text-sm font-semibold text-[#222222]">View Guest List</p>
        <p className="text-xs text-gray-500">Today's matches</p>
      </button>
      <button className="p-4 bg-[#F4F4F4] hover:bg-[#FF3B3F]/10 rounded-lg text-left transition-colors group border border-transparent hover:border-[#FF3B3F]/20">
        <BarChart3 size={20} className="text-[#FF3B3F] mb-2" />
        <p className="text-sm font-semibold text-[#222222]">Export Report</p>
        <p className="text-xs text-gray-500">Monthly insights</p>
      </button>
    </div>
  </div>
);

// Dashboard Component (main content when authenticated)
const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const data = await dataAPI.getAllDashboardData();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch dashboard data:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchDashboardData();
      setIsLoading(false);
    };

    loadData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <p className="text-red-500 mb-4">Error loading dashboard: {error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-[#FF3B3F] text-white rounded-lg hover:bg-[#E63538]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const {
    restaurantProfile,
    impactMetrics,
    recentExperiences,
    flavorInsights,
    trafficData,
    gouSuggestions,
    matchTypeBreakdown,
  } = dashboardData || {};

  return (
    <div className="min-h-screen bg-[#F4F4F4]">
      <main className="p-8">
        <Header
          restaurantProfile={restaurantProfile}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
        <ImpactMetrics impactMetrics={impactMetrics} />
        <GouSaysCard gouSuggestions={gouSuggestions} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <RecentExperiences recentExperiences={recentExperiences} />
          </div>
          <div className="space-y-6">
            <FlavorInsights flavorInsights={flavorInsights} />
            <QuickActions />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrafficChart trafficData={trafficData} />
          <MatchTypeBreakdown matchTypeBreakdown={matchTypeBreakdown} />
        </div>
      </main>
    </div>
  );
};

// Main App Component with Auth
const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? <Dashboard /> : <LoginPage />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
