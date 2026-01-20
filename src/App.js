import React, { useState } from 'react';
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
  Settings,
  Bell,
  Search,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Calendar
} from 'lucide-react';
import {
  restaurantProfile,
  impactMetrics,
  recentExperiences,
  flavorInsights,
  trafficData,
  gouSuggestions,
  matchTypeBreakdown
} from './mockData';
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
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="8" fill={colors.red} />
    <path d="M12 12L28 28M28 12L12 28" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <circle cx="12" cy="12" r="2" fill="white" />
    <circle cx="28" cy="12" r="2" fill="white" />
  </svg>
);

// Sidebar Component
const Sidebar = () => (
  <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-50">
    <div className="p-6 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <GrangouLogo size={40} />
        <div>
          <h1 className="font-bold text-[#222222] text-lg">grangou</h1>
          <p className="text-xs text-gray-500">Restaurant Portal</p>
        </div>
      </div>
    </div>

    <nav className="flex-1 p-4">
      <div className="space-y-1">
        <NavItem icon={<BarChart3 size={20} />} label="Dashboard" active />
        <NavItem icon={<MessageSquare size={20} />} label="Reviews" badge={3} />
        <NavItem icon={<Utensils size={20} />} label="Menu Insights" />
        <NavItem icon={<Users size={20} />} label="Guest Analytics" />
        <NavItem icon={<Calendar size={20} />} label="Reservations" />
        <NavItem icon={<Settings size={20} />} label="Settings" />
      </div>
    </nav>

    <div className="p-4 border-t border-gray-100">
      <div className="bg-[#F4F4F4] rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FF3B3F] rounded-full flex items-center justify-center text-white font-semibold text-sm">
            GF
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#222222] truncate">{restaurantProfile.name}</p>
            <p className="text-xs text-gray-500 truncate">{restaurantProfile.location}</p>
          </div>
        </div>
      </div>
    </div>
  </aside>
);

const NavItem = ({ icon, label, active, badge }) => (
  <button
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      active
        ? 'bg-[#FF3B3F] text-white'
        : 'text-gray-600 hover:bg-[#F4F4F4] hover:text-[#222222]'
    }`}
  >
    {icon}
    <span className="font-medium text-sm">{label}</span>
    {badge && (
      <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${
        active ? 'bg-white text-[#FF3B3F]' : 'bg-[#FF3B3F] text-white'
      }`}>
        {badge}
      </span>
    )}
  </button>
);

// Header Component
const Header = () => (
  <header className="flex items-center justify-between mb-8">
    <div>
      <h1 className="text-[32px] font-bold text-[#222222] mb-1">
        Hey there, {restaurantProfile.name}! 👋
      </h1>
      <p className="text-gray-500 text-base">
        Ready to see how your guests are matching and munching?
      </p>
    </div>
    <div className="flex items-center gap-3">
      <button className="p-2.5 bg-white rounded-lg text-gray-500 hover:text-[#222222] hover:shadow-md transition-all border border-gray-200">
        <Search size={20} />
      </button>
      <button className="p-2.5 bg-white rounded-lg text-gray-500 hover:text-[#222222] hover:shadow-md transition-all border border-gray-200 relative">
        <Bell size={20} />
        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#FF3B3F] rounded-full border-2 border-white"></span>
      </button>
      <button className="flex items-center gap-2 px-5 py-2.5 bg-[#FF3B3F] hover:bg-[#E63538] rounded-lg text-white font-semibold text-sm transition-all shadow-sm hover:shadow-md">
        <RefreshCw size={16} />
        Sync Data
      </button>
    </div>
  </header>
);

// Impact Metrics Component
const ImpactMetrics = () => {
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
const GouSaysCard = () => {
  const [currentSuggestion, setCurrentSuggestion] = useState(0);
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
              Next Tip →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Recent Experiences Component
const RecentExperiences = () => {
  const [experiences, setExperiences] = useState(recentExperiences);

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
const FlavorInsights = () => (
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

// Traffic Chart Component
const TrafficChart = () => {
  const maxVisitors = Math.max(...trafficData.map((d) => d.visitors));
  const lastWeekData = trafficData.slice(-7);

  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[20px] font-bold text-[#222222]">Grangou Traffic</h2>
          <p className="text-sm text-gray-500">Guests matched to your spot (last 7 days)</p>
        </div>
        <div className="text-right">
          <p className="text-[24px] font-bold text-[#222222]">
            {lastWeekData.reduce((sum, d) => sum + d.visitors, 0)}
          </p>
          <p className="text-xs text-[#06D6A0] font-semibold flex items-center justify-end gap-1">
            <TrendingUp size={12} />
            +18% from last week
          </p>
        </div>
      </div>
      <div className="h-48 flex items-end gap-3">
        {lastWeekData.map((day, index) => {
          const height = (day.visitors / maxVisitors) * 100;
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">{day.visitors}</span>
              <div
                className="w-full bg-gradient-to-t from-[#FF3B3F] to-[#FF6B6F] rounded-t-lg transition-all duration-300 hover:from-[#E63538] hover:to-[#FF3B3F] cursor-pointer"
                style={{ height: `${height}%` }}
              />
              <span className="text-xs text-gray-400">{day.date.split(' ')[1]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Match Type Breakdown Component
const MatchTypeBreakdown = () => (
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

// Main App Component
function App() {
  return (
    <div className="min-h-screen bg-[#F4F4F4]">
      <Sidebar />
      <main className="ml-64 p-8">
        <Header />
        <ImpactMetrics />
        <GouSaysCard />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <RecentExperiences />
          </div>
          <div className="space-y-6">
            <FlavorInsights />
            <QuickActions />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrafficChart />
          <MatchTypeBreakdown />
        </div>
      </main>
    </div>
  );
}

export default App;
