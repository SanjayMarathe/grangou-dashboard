import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Search,
  RefreshCw,
  ExternalLink,
  Sparkles,
  LogOut,
  Loader2,
  X,
  Plus,
  Trash2,
  Edit3,
  ArrowLeft,
  ShoppingBag,
  Minus,
  Link,
  Send,
  Zap
} from 'lucide-react';
import { AuthProvider, useAuth } from './AuthContext';
import { dataAPI, integrationAPI, aiAPI } from './api';
import './index.css';

// Brand Colors - Grangou Style Guide
// eslint-disable-next-line no-unused-vars
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

// Auth Page Component (Login + Sign Up)
const AuthPage = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Shared fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign-up fields
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [cuisineTypes, setCuisineTypes] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [dietaryOptions, setDietaryOptions] = useState('');
  const [averageCost, setAverageCost] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');

  const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3F] focus:border-transparent";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    let result;
    if (mode === 'login') {
      result = await login(email, password);
    } else {
      const formData = {
        name,
        email,
        password,
        phone_number: phoneNumber || undefined,
        address: address || undefined,
        city: city || undefined,
        cuisine_types: cuisineTypes ? cuisineTypes.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        price_range: priceRange || undefined,
        dietary_options: dietaryOptions ? dietaryOptions.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        average_cost_per_person: averageCost ? parseInt(averageCost, 10) : undefined,
        website_url: websiteUrl || undefined,
        image_url: imageUrl || undefined,
        description: description || undefined,
      };
      result = await register(formData);
    }

    if (!result.success) {
      setError(result.error || (mode === 'login' ? 'Login failed' : 'Registration failed'));
    }

    setIsLoading(false);
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <GrangouLogo size={64} />
          </div>
          <h1 className="text-2xl font-bold text-[#222222]">Welcome to Grangou</h1>
          <p className="text-gray-500 mt-2">
            {mode === 'login' ? 'Sign in to your restaurant portal' : 'Create your restaurant account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-[#222222] mb-2">
                Restaurant Name <span className="text-[#FF3B3F]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Your restaurant name"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#222222] mb-2">
              Email Address {mode === 'signup' && <span className="text-[#FF3B3F]">*</span>}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="restaurant@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#222222] mb-2">
              Password {mode === 'signup' && <span className="text-[#FF3B3F]">*</span>}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder={mode === 'login' ? 'Enter your password' : 'Create a password'}
              required
            />
          </div>

          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-sm font-medium text-[#222222] mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={inputClass}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#222222] mb-2">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={inputClass}
                  placeholder="123 Main St"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#222222] mb-2">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={inputClass}
                  placeholder="Los Angeles"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#222222] mb-2">Cuisine Types</label>
                <input
                  type="text"
                  value={cuisineTypes}
                  onChange={(e) => setCuisineTypes(e.target.value)}
                  className={inputClass}
                  placeholder="Italian, Mexican, Japanese"
                />
                <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#222222] mb-2">Price Range</label>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select price range</option>
                  <option value="$">$ - Budget</option>
                  <option value="$$">$$ - Moderate</option>
                  <option value="$$$">$$$ - Upscale</option>
                  <option value="$$$$">$$$$ - Fine Dining</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#222222] mb-2">Dietary Options</label>
                <input
                  type="text"
                  value={dietaryOptions}
                  onChange={(e) => setDietaryOptions(e.target.value)}
                  className={inputClass}
                  placeholder="Vegan, Gluten-Free, Halal"
                />
                <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#222222] mb-2">Avg Cost Per Person ($)</label>
                <input
                  type="number"
                  value={averageCost}
                  onChange={(e) => setAverageCost(e.target.value)}
                  className={inputClass}
                  placeholder="25"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#222222] mb-2">Website</label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className={inputClass}
                  placeholder="https://yourrestaurant.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#222222] mb-2">Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className={inputClass}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#222222] mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={inputClass}
                  placeholder="Tell us about your restaurant..."
                  rows={3}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#FF3B3F] hover:bg-[#E63538] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                {mode === 'login' ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              mode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          {mode === 'login' ? (
            <p>
              New restaurant?{' '}
              <button onClick={toggleMode} className="text-[#FF3B3F] font-semibold hover:underline">
                Create an account
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button onClick={toggleMode} className="text-[#FF3B3F] font-semibold hover:underline">
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Header Component
const SEARCHABLE_ITEMS = [
  { label: 'Stripe', description: 'Payment processing & financial insights', action: 'integrations', icon: '/stripe.png' },
];

const Navbar = ({ onRefresh, isRefreshing, onOpenIntegrations, onNavigate }) => {
  const { logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') { setSearchOpen(false); setQuery(''); } };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const results = query.trim()
    ? SEARCHABLE_ITEMS.filter(i => i.label.toLowerCase().includes(query.toLowerCase()) || i.description.toLowerCase().includes(query.toLowerCase()))
    : [];

  const handleSelect = (item) => {
    setSearchOpen(false);
    setQuery('');
    if (item.action === 'integrations') onOpenIntegrations();
  };

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-8 py-3">
        <div className="flex items-center gap-3">
          <GrangouLogo size={36} />
          <div>
            <h1 className="font-bold text-[#222222] text-lg">grangou</h1>
            <p className="text-xs text-gray-500">Restaurant Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            {searchOpen ? (
              <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white w-56 focus-within:ring-2 focus-within:ring-[#FF3B3F] focus-within:border-transparent">
                <Search size={16} className="text-gray-400 shrink-0" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search integrations..."
                  className="text-sm outline-none w-full"
                />
                <button onClick={() => { setSearchOpen(false); setQuery(''); }}>
                  <X size={14} className="text-gray-400 hover:text-gray-600" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2.5 bg-white rounded-lg text-gray-500 hover:text-[#222222] hover:shadow-md transition-all border border-gray-200"
              >
                <Search size={20} />
              </button>
            )}
            {results.length > 0 && (
              <div className="absolute top-full mt-1 right-0 w-64 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                {results.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F4F4F4] transition-colors text-left"
                  >
                    <img src={item.icon} alt={item.label} className="w-6 h-6 object-contain" />
                    <div>
                      <p className="text-sm font-semibold text-[#222222]">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onOpenIntegrations}
            className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-[#635BFF] hover:bg-[#635BFF]/10 rounded-lg transition-colors text-sm border border-gray-200"
          >
            <Zap size={16} />
            Integrations
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
    </div>
  );
};

const Header = () => {
  const { user } = useAuth();
  return (
    <header className="mb-6">
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
      change: impactMetrics.repeatVisitorsChange,
      icon: <Heart className="text-[#FF3B3F]" size={24} />,
      positive: impactMetrics.repeatVisitorsChange >= 0,
      bgColor: 'bg-[#FF3B3F]/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
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
    <div className="bg-gradient-to-r from-[#FF3B3F] to-[#FF6B6F] rounded-lg p-6 mb-6 shadow-lg">
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

// Experience Card (shared between list and modal)
const ExperienceCard = ({ exp, onAcknowledge, expanded }) => {
  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={16} className={i < rating ? 'text-[#FFD166] fill-[#FFD166]' : 'text-gray-300'} />
    ));

  return (
    <div className="p-6 hover:bg-[#F4F4F4]/50 transition-colors">
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
          <p className={`text-gray-600 text-sm mb-3${expanded ? '' : ' line-clamp-2'}`}>{exp.review}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-[#FF3B3F]/10 text-[#FF3B3F] text-xs font-semibold rounded-full">
                {exp.matchType}
              </span>
              {(expanded ? exp.keywords : exp.keywords.slice(0, 2)).map((keyword, i) => (
                <span key={i} className="px-3 py-1 bg-[#F4F4F4] text-gray-600 text-xs rounded-full">
                  {keyword}
                </span>
              ))}
            </div>
            {!exp.acknowledged ? (
              <button
                onClick={() => onAcknowledge(exp.id)}
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
  );
};

// All Experiences Modal
const AllExperiencesModal = ({ experiences, onClose, onAcknowledge }) => {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 pb-12">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-full flex flex-col overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[20px] font-bold text-[#222222]">All Guest Experiences</h2>
            <p className="text-sm text-gray-500">{experiences.length} review{experiences.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F4F4F4] rounded-lg transition-colors text-gray-500 hover:text-[#222222]"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto divide-y divide-gray-100">
          {experiences.map((exp) => (
            <ExperienceCard key={exp.id} exp={exp} onAcknowledge={onAcknowledge} expanded />
          ))}
        </div>
      </div>
    </div>
  );
};

// Recent Experiences Component
const RecentExperiences = ({ recentExperiences: initialExperiences }) => {
  const [experiences, setExperiences] = useState([]);
  const [showAll, setShowAll] = useState(false);

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

  if (!experiences || experiences.length === 0) return null;

  const MAX_VISIBLE = 3;
  const visible = experiences.slice(0, MAX_VISIBLE);
  const remaining = experiences.length - MAX_VISIBLE;

  return (
    <>
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-bold text-[#222222]">Recent Grangou Experiences</h2>
            <p className="text-sm text-gray-500">What your guests are saying about their matches</p>
          </div>
          {experiences.length > MAX_VISIBLE && (
            <button
              onClick={() => setShowAll(true)}
              className="text-[#FF3B3F] text-sm font-semibold hover:underline flex items-center gap-1"
            >
              View All ({experiences.length}) <ExternalLink size={14} />
            </button>
          )}
        </div>
        <div className="divide-y divide-gray-100">
          {visible.map((exp) => (
            <ExperienceCard key={exp.id} exp={exp} onAcknowledge={handleAcknowledge} />
          ))}
        </div>
        {remaining > 0 && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full py-3 text-sm font-semibold text-[#FF3B3F] hover:bg-[#FF3B3F]/5 transition-colors border-t border-gray-100"
          >
            +{remaining} more review{remaining !== 1 ? 's' : ''} — View All
          </button>
        )}
      </div>
      {showAll && (
        <AllExperiencesModal
          experiences={experiences}
          onClose={() => setShowAll(false)}
          onAcknowledge={handleAcknowledge}
        />
      )}
    </>
  );
};

// ============================================
// MENU MANAGEMENT PAGE
// ============================================

const CATEGORIES = ['Appetizer', 'Entree', 'Side', 'Dessert', 'Drink', 'Other'];

const MenuManagement = ({ onBack }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({ name: '', category: 'Entree', price: '' });
  const [bulkText, setBulkText] = useState('');
  const [bulkCategory, setBulkCategory] = useState('Entree');
  const [saving, setSaving] = useState(false);

  const loadMenu = useCallback(async () => {
    try {
      const data = await dataAPI.getMenu();
      setMenuItems(data);
    } catch (err) {
      console.error('Failed to load menu:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadMenu(); }, [loadMenu]);

  const handleAddItem = async () => {
    if (!newItem.name.trim()) return;
    setSaving(true);
    try {
      await dataAPI.createMenuItem({
        name: newItem.name.trim(),
        category: newItem.category,
        price: newItem.price ? parseFloat(newItem.price) : null,
      });
      setNewItem({ name: '', category: 'Entree', price: '' });
      setShowAddForm(false);
      await loadMenu();
    } catch (err) {
      console.error('Failed to add item:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAdd = async () => {
    const names = bulkText.split('\n').map(n => n.trim()).filter(Boolean);
    if (names.length === 0) return;
    setSaving(true);
    try {
      await dataAPI.createMenuItem(names.map(name => ({ name, category: bulkCategory })));
      setBulkText('');
      setShowBulkAdd(false);
      await loadMenu();
    } catch (err) {
      console.error('Failed to bulk add:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateItem = async (item) => {
    setSaving(true);
    try {
      await dataAPI.updateMenuItem(item);
      setEditingItem(null);
      await loadMenu();
    } catch (err) {
      console.error('Failed to update item:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Remove this menu item?')) return;
    try {
      await dataAPI.deleteMenuItem(id);
      await loadMenu();
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const handleToggleActive = async (item) => {
    await handleUpdateItem({ id: item.id, is_active: !item.is_active });
  };

  // Group items by category
  const grouped = {};
  menuItems.forEach(item => {
    const cat = item.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  const activeCount = menuItems.filter(i => i.is_active).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  return (
    <div className="p-8 pb-12 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="p-2 hover:bg-white rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <div className="flex-1">
            <h1 className="text-[28px] font-bold text-[#222222]">Menu Management</h1>
            <p className="text-gray-500">{activeCount} active item{activeCount !== 1 ? 's' : ''} on your menu</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowBulkAdd(true); setShowAddForm(false); }}
              className="px-4 py-2.5 bg-white border border-gray-200 text-[#222222] text-sm font-semibold rounded-lg hover:shadow-md transition-all"
            >
              Bulk Add
            </button>
            <button
              onClick={() => { setShowAddForm(true); setShowBulkAdd(false); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#FF3B3F] text-white text-sm font-semibold rounded-lg hover:bg-[#E63538] transition-all"
            >
              <Plus size={16} />
              Add Item
            </button>
          </div>
        </div>

        {/* Add Item Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-card p-6 mb-6">
            <h3 className="font-bold text-[#222222] mb-4">Add Menu Item</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Name *</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3F] focus:border-transparent"
                  placeholder="e.g. Margherita Pizza"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3F]"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Price (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3F]"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddItem}
                disabled={!newItem.name.trim() || saving}
                className="px-4 py-2 bg-[#FF3B3F] text-white text-sm font-semibold rounded-lg hover:bg-[#E63538] disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="animate-spin" size={14} />}
                Add Item
              </button>
              <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-gray-500 text-sm hover:bg-gray-100 rounded-lg">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Bulk Add Form */}
        {showBulkAdd && (
          <div className="bg-white rounded-lg shadow-card p-6 mb-6">
            <h3 className="font-bold text-[#222222] mb-4">Bulk Add Items</h3>
            <p className="text-sm text-gray-500 mb-3">Paste item names, one per line</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3F] h-32 resize-none"
                  placeholder={"Margherita Pizza\nCaesar Salad\nTiramisu"}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Category for all</label>
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3F]"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <p className="text-xs text-gray-400 mt-2">
                  {bulkText.split('\n').filter(l => l.trim()).length} item{bulkText.split('\n').filter(l => l.trim()).length !== 1 ? 's' : ''} to add
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleBulkAdd}
                disabled={!bulkText.trim() || saving}
                className="px-4 py-2 bg-[#FF3B3F] text-white text-sm font-semibold rounded-lg hover:bg-[#E63538] disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="animate-spin" size={14} />}
                Add All
              </button>
              <button onClick={() => setShowBulkAdd(false)} className="px-4 py-2 text-gray-500 text-sm hover:bg-gray-100 rounded-lg">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Menu Items List */}
        {menuItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-card p-12 text-center">
            <Utensils size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[#222222] mb-2">No menu items yet</h3>
            <p className="text-gray-500 mb-6">Add your menu items so you can start tracking what Grangou guests order.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-[#FF3B3F] text-white font-semibold rounded-lg hover:bg-[#E63538] transition-colors"
            >
              Add Your First Item
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([category, items]) => (
              <div key={category} className="bg-white rounded-lg shadow-card overflow-hidden">
                <div className="px-6 py-3 bg-[#F4F4F4] border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">{category}</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {items.map(item => (
                    <div key={item.id} className={`px-6 py-4 flex items-center gap-4 ${!item.is_active ? 'opacity-50' : ''}`}>
                      {editingItem?.id === item.id ? (
                        <div className="flex-1 grid grid-cols-3 gap-3">
                          <input
                            type="text"
                            value={editingItem.name}
                            onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3B3F]"
                          />
                          <select
                            value={editingItem.category || ''}
                            onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3B3F]"
                          >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              step="0.01"
                              value={editingItem.price || ''}
                              onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })}
                              className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3B3F]"
                              placeholder="Price"
                            />
                            <button
                              onClick={() => handleUpdateItem(editingItem)}
                              disabled={saving}
                              className="px-3 py-1.5 bg-[#06D6A0] text-white text-sm rounded-lg hover:bg-[#05C090]"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setEditingItem(null)}
                              className="px-3 py-1.5 text-gray-400 hover:text-gray-600 text-sm"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <span className="font-medium text-[#222222]">{item.name}</span>
                            {item.price && (
                              <span className="ml-3 text-sm text-gray-500">${Number(item.price).toFixed(2)}</span>
                            )}
                          </div>
                          <button
                            onClick={() => handleToggleActive(item)}
                            className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                              item.is_active
                                ? 'bg-[#06D6A0]/10 text-[#06D6A0]'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {item.is_active ? 'Active' : 'Inactive'}
                          </button>
                          <button
                            onClick={() => setEditingItem({ ...item })}
                            className="p-1.5 text-gray-400 hover:text-[#222222] transition-colors"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 text-gray-400 hover:text-[#FF3B3F] transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
};

// ============================================
// ORDER LOGGING PAGE
// ============================================

const OrderLogging = ({ onBack }) => {
  const [step, setStep] = useState('select-match'); // 'select-match' | 'select-items'
  const [recentMatches, setRecentMatches] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [orderItems, setOrderItems] = useState({}); // { menu_item_id: quantity }
  const [existingOrders, setExistingOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [todayOrderCount, setTodayOrderCount] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const [matches, menu, orders] = await Promise.all([
        dataAPI.getRecentMatches(),
        dataAPI.getMenu(),
        dataAPI.getOrders(),
      ]);
      setRecentMatches(matches);
      setMenuItems(menu.filter(i => i.is_active));

      // Count today's logged orders (unique match_ids)
      const today = new Date().toDateString();
      const todayMatchIds = new Set();
      (orders || []).forEach(o => {
        if (new Date(o.ordered_at).toDateString() === today) {
          todayMatchIds.add(o.match_id);
        }
      });
      setTodayOrderCount(todayMatchIds.size);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSelectMatch = async (match) => {
    setSelectedMatch(match);
    setStep('select-items');

    // Check for existing orders for this match
    try {
      const existing = await dataAPI.getOrdersForMatch(match.id);
      if (existing && existing.length > 0) {
        setExistingOrders(existing);
        const items = {};
        existing.forEach(o => { items[o.menu_item_id] = (items[o.menu_item_id] || 0) + o.quantity; });
        setOrderItems(items);
      } else {
        setExistingOrders([]);
        setOrderItems({});
      }
    } catch (err) {
      setExistingOrders([]);
      setOrderItems({});
    }
  };

  const handleAddItem = (itemId) => {
    setOrderItems(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
  };

  const handleRemoveItem = (itemId) => {
    setOrderItems(prev => {
      const next = { ...prev };
      if (next[itemId] > 1) {
        next[itemId] -= 1;
      } else {
        delete next[itemId];
      }
      return next;
    });
  };

  const handleLogOrder = async () => {
    const items = Object.entries(orderItems).map(([menu_item_id, quantity]) => ({
      menu_item_id: parseInt(menu_item_id),
      quantity,
    }));
    if (items.length === 0) return;

    setSaving(true);
    try {
      // If there were existing orders for this match, delete them first
      if (existingOrders.length > 0) {
        await dataAPI.deleteOrdersForMatch(selectedMatch.id);
      }
      await dataAPI.createOrders(selectedMatch.id, items);
      setStep('select-match');
      setSelectedMatch(null);
      setOrderItems({});
      setExistingOrders([]);
      await loadData(); // Refresh counts
    } catch (err) {
      console.error('Failed to log order:', err);
    } finally {
      setSaving(false);
    }
  };

  // Group menu items by category for the item selector
  const groupedMenu = {};
  menuItems.forEach(item => {
    const cat = item.category || 'Other';
    if (!groupedMenu[cat]) groupedMenu[cat] = [];
    groupedMenu[cat].push(item);
  });

  const totalSelectedItems = Object.values(orderItems).reduce((sum, qty) => sum + qty, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  return (
    <div className="p-8 pb-12 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => {
              if (step === 'select-items') {
                setStep('select-match');
                setSelectedMatch(null);
                setOrderItems({});
              } else {
                onBack();
              }
            }}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <div className="flex-1">
            <h1 className="text-[28px] font-bold text-[#222222]">Log Guest Orders</h1>
            <p className="text-gray-500">
              {step === 'select-match' ? 'Select a Grangou match to log their order' : `Logging for ${selectedMatch?.guests?.join(', ')}`}
            </p>
          </div>
          {todayOrderCount > 0 && (
            <div className="px-4 py-2 bg-[#06D6A0]/10 text-[#06D6A0] rounded-lg text-sm font-semibold">
              {todayOrderCount} order{todayOrderCount !== 1 ? 's' : ''} logged today
            </div>
          )}
        </div>

        {step === 'select-match' && (
          <>
            {recentMatches.length === 0 ? (
              <div className="bg-white rounded-lg shadow-card p-12 text-center">
                <Users size={48} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-[#222222] mb-2">No recent matches</h3>
                <p className="text-gray-500">When Grangou guests are matched to your restaurant, they'll appear here for order logging.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMatches.map(match => (
                  <button
                    key={match.id}
                    onClick={() => handleSelectMatch(match)}
                    className="w-full bg-white rounded-lg shadow-card p-5 text-left hover:shadow-card-hover hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#FF3B3F] to-[#FF6B6F] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {match.guests?.[0]?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-[#222222]">{match.guests?.join(', ') || 'Guest'}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="px-2 py-0.5 bg-[#FF3B3F]/10 text-[#FF3B3F] text-xs font-semibold rounded-full">
                              {match.matchType}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock size={12} />
                              {match.time}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ExternalLink size={16} className="text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {step === 'select-items' && (
          <>
            {menuItems.length === 0 ? (
              <div className="bg-white rounded-lg shadow-card p-12 text-center">
                <Utensils size={48} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-[#222222] mb-2">Set up your menu first</h3>
                <p className="text-gray-500 mb-6">Add menu items before logging orders.</p>
                <button
                  onClick={onBack}
                  className="px-6 py-3 bg-[#FF3B3F] text-white font-semibold rounded-lg hover:bg-[#E63538]"
                >
                  Go to Menu Management
                </button>
              </div>
            ) : (
              <>
                {/* Item Selector */}
                <div className="space-y-4 mb-24">
                  {Object.entries(groupedMenu).sort(([a], [b]) => a.localeCompare(b)).map(([category, items]) => (
                    <div key={category} className="bg-white rounded-lg shadow-card overflow-hidden">
                      <div className="px-6 py-3 bg-[#F4F4F4] border-b border-gray-100">
                        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">{category}</h3>
                      </div>
                      <div className="p-4 flex flex-wrap gap-2">
                        {items.map(item => {
                          const qty = orderItems[item.id] || 0;
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleAddItem(item.id)}
                              className={`relative px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                                qty > 0
                                  ? 'bg-[#FF3B3F] text-white border-[#FF3B3F] shadow-md'
                                  : 'bg-white text-[#222222] border-gray-200 hover:border-[#FF3B3F] hover:bg-[#FF3B3F]/5'
                              }`}
                            >
                              {item.name}
                              {item.price && <span className="ml-1 opacity-75">${Number(item.price).toFixed(0)}</span>}
                              {qty > 0 && (
                                <span className="absolute -top-2 -right-2 w-6 h-6 bg-[#222222] text-white text-xs rounded-full flex items-center justify-center font-bold">
                                  {qty}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Floating Order Summary */}
                {totalSelectedItems > 0 && (
                  <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-40">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {Object.entries(orderItems).map(([itemId, qty]) => {
                            const item = menuItems.find(i => i.id === parseInt(itemId));
                            if (!item) return null;
                            return (
                              <div key={itemId} className="flex items-center gap-1 bg-[#F4F4F4] rounded-full px-3 py-1">
                                <span className="text-sm font-medium">{item.name}</span>
                                <span className="text-xs text-gray-500">x{qty}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleRemoveItem(parseInt(itemId)); }}
                                  className="ml-1 text-gray-400 hover:text-[#FF3B3F]"
                                >
                                  <Minus size={12} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-sm text-gray-500">{totalSelectedItems} item{totalSelectedItems !== 1 ? 's' : ''} selected</p>
                      </div>
                      <button
                        onClick={handleLogOrder}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-[#FF3B3F] text-white font-semibold rounded-lg hover:bg-[#E63538] disabled:opacity-50 transition-all shadow-md"
                      >
                        {saving ? (
                          <><Loader2 className="animate-spin" size={16} /> Saving...</>
                        ) : (
                          <><ShoppingBag size={16} /> {existingOrders.length > 0 ? 'Update Order' : 'Log Order'}</>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
    </div>
  );
};

// Flavor Insights Component (with real data + time period toggle)
const FlavorInsights = ({ flavorInsights: initialFlavors, stripeConnected }) => {
  const [period, setPeriod] = useState('all');
  const [flavors, setFlavors] = useState(initialFlavors);
  const [stripeData, setStripeData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFlavors(initialFlavors);
  }, [initialFlavors]);

  useEffect(() => {
    if (!stripeConnected) return;
    integrationAPI.getStripeInsights()
      .then(data => setStripeData(data))
      .catch(err => console.error('Failed to load stripe insights:', err));
  }, [stripeConnected]);

  const handlePeriodChange = async (newPeriod) => {
    setPeriod(newPeriod);
    setLoading(true);
    try {
      const data = await dataAPI.getFlavorInsights(newPeriod === 'all' ? undefined : newPeriod);
      setFlavors(data);
    } catch (err) {
      console.error('Failed to load flavors:', err);
    } finally {
      setLoading(false);
    }
  };

  // Use Stripe data if connected and available
  const useStripe = stripeConnected && stripeData && stripeData.length > 0;
  const displayData = useStripe ? stripeData : flavors;
  const isEmpty = !displayData || displayData.length === 0;

  if (isEmpty) {
    return (
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <ChefHat size={20} className="text-[#FF3B3F]" />
          <h2 className="text-[20px] font-bold text-[#222222]">Gou's Flavor Insights</h2>
        </div>
        <div className="text-center py-6">
          <Utensils size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-1">No order data yet</p>
          <p className="text-xs text-gray-400">
            {stripeConnected ? 'No succeeded charges found in your Stripe account' : 'Set up your menu and log guest orders to see insights'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[20px] font-bold text-[#222222] flex items-center gap-2">
            <ChefHat size={20} className="text-[#FF3B3F]" />
            Gou's Flavor Insights
          </h2>
          <p className="text-sm text-gray-500">
            {useStripe ? 'Top revenue from your Stripe charges' : 'What your Grangou guests love most'}
          </p>
        </div>
        {useStripe && (
          <img src="/stripe.png" alt="Stripe" className="h-5 object-contain opacity-60" />
        )}
      </div>
      {/* Period Toggle — only for non-Stripe */}
      {!useStripe && (
        <div className="flex gap-1 mb-5 bg-[#F4F4F4] rounded-lg p-1">
          {[
            { key: 'week', label: 'This Week' },
            { key: 'month', label: 'This Month' },
            { key: 'all', label: 'All Time' },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => handlePeriodChange(opt.key)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                period === opt.key
                  ? 'bg-white text-[#222222] shadow-sm'
                  : 'text-gray-500 hover:text-[#222222]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-gray-400" size={24} />
        </div>
      ) : (
        <div className="space-y-4">
          {displayData.map((item, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#222222] font-semibold">{item.item}</span>
                  {item.category && (
                    <span className="px-2 py-0.5 bg-[#F4F4F4] text-gray-500 text-xs rounded-full">{item.category}</span>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  {useStripe ? `$${item.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${item.orders} orders`}
                </span>
              </div>
              <div className="h-3 bg-[#F4F4F4] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FF3B3F] to-[#FF6B6F] rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {item.percentage}% of {useStripe ? 'revenue' : 'orders'}
                {useStripe && item.count && <span className="ml-2">· {item.count} charge{item.count !== 1 ? 's' : ''}</span>}
              </p>
            </div>
          ))}
        </div>
      )}
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

// CSV Export Helper
const generateCSV = (dashboardData) => {
  if (!dashboardData) return;

  const { restaurantProfile, impactMetrics, recentExperiences, flavorInsights, trafficData, matchTypeBreakdown, peakHours } = dashboardData;
  const rows = [];

  const esc = (val) => {
    const str = String(val ?? '');
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const fmt = (n) => Number(n).toLocaleString('en-US');
  const stars = (n) => '\u2605'.repeat(n) + '\u2606'.repeat(5 - n);
  const divider = () => rows.push('');
  const section = (title) => { divider(); rows.push(`--- ${title} ---`); };

  // Report header
  const now = new Date();
  const reportDate = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const restaurantName = restaurantProfile?.name || 'Restaurant';
  rows.push(`Grangou Dashboard Report - ${esc(restaurantName)}`);
  rows.push(`Generated on ${reportDate}`);

  // Restaurant Profile
  section('Restaurant Profile');
  if (restaurantProfile) {
    rows.push(`,${esc(restaurantName)}`);
    rows.push(`Cuisine,${esc(restaurantProfile.cuisine)}`);
    rows.push(`Location,${esc(restaurantProfile.location)}`);
    rows.push(`Partner Since,${esc(restaurantProfile.partnerSince)}`);
  }

  // Impact Metrics
  section('Impact Metrics');
  if (impactMetrics) {
    rows.push('Metric,Value,Change');
    rows.push(`Total Grangou Guests,"${fmt(impactMetrics.totalGrangouGuests)}",+${impactMetrics.guestGrowth}%`);
    rows.push(`Estimated Revenue,"$${fmt(impactMetrics.estimatedRevenue)}",+${impactMetrics.revenueGrowth}%`);
    rows.push(`Average Rating,${impactMetrics.averageRating.toFixed(1)} / 5.0,${impactMetrics.ratingChange >= 0 ? '+' : ''}${impactMetrics.ratingChange}%`);
    if (impactMetrics.totalReviews != null) rows.push(`Total Reviews,"${fmt(impactMetrics.totalReviews)}",`);
    rows.push(`Repeat Visitors,${impactMetrics.repeatVisitors}%,`);
  }

  // Recent Guest Experiences
  section('Recent Guest Experiences');
  if (recentExperiences && recentExperiences.length > 0) {
    rows.push('Guest,Rating,Stars,Review,How They Found You,Keywords,When');
    recentExperiences.forEach((exp) => {
      rows.push([
        esc(exp.userName),
        `${exp.rating}/5`,
        stars(exp.rating),
        esc(exp.review),
        esc(exp.matchType),
        esc((exp.keywords || []).join('; ')),
        esc(exp.timeAgo),
      ].join(','));
    });
    const avgRating = (recentExperiences.reduce((s, e) => s + e.rating, 0) / recentExperiences.length).toFixed(1);
    rows.push(`,,,,,,`);
    rows.push(`Total: ${recentExperiences.length} reviews,Avg: ${avgRating}/5,,,,,`);
  } else {
    rows.push('No guest experiences recorded yet');
  }

  // Traffic Overview
  section('Traffic Overview (Last 30 Days)');
  if (trafficData && trafficData.length > 0) {
    const total = trafficData.reduce((s, d) => s + d.visitors, 0);
    const avg = Math.round(total / trafficData.length);
    const peak = trafficData.reduce((max, d) => d.visitors > max.visitors ? d : max, trafficData[0]);
    const low = trafficData.reduce((min, d) => d.visitors < min.visitors ? d : min, trafficData[0]);
    rows.push(`Total Guests,"${fmt(total)}"`);
    rows.push(`Daily Average,${avg}`);
    rows.push(`Best Day,${esc(peak.date)} (${peak.visitors} guests)`);
    rows.push(`Slowest Day,${esc(low.date)} (${low.visitors} guests)`);
    rows.push('');
    rows.push('Date,Guests');
    trafficData.forEach((d) => {
      rows.push(`${esc(d.date)},${d.visitors}`);
    });
  } else {
    rows.push('No traffic data recorded yet');
  }

  // How Guests Find You (Match Types)
  section('How Guests Find You');
  if (matchTypeBreakdown && matchTypeBreakdown.length > 0) {
    rows.push('Discovery Method,Share,Bar');
    matchTypeBreakdown.forEach((m) => {
      const bar = '\u2588'.repeat(Math.round(m.percentage / 5)) + '\u2591'.repeat(20 - Math.round(m.percentage / 5));
      rows.push(`${esc(m.type)},${m.percentage}%,${bar}`);
    });
  } else {
    rows.push('No match type data recorded yet');
  }

  // Busiest Hours
  section('Busiest Hours');
  if (peakHours && peakHours.length > 0) {
    const peakHour = peakHours.reduce((max, h) => h.traffic > max.traffic ? h : max, peakHours[0]);
    rows.push(`Peak Hour: ${esc(peakHour.hour)} (${peakHour.traffic} guests)`);
    rows.push('');
    rows.push('Hour,Guests,Activity');
    peakHours.forEach((h) => {
      const bar = '\u2588'.repeat(Math.round((h.traffic / peakHour.traffic) * 15));
      rows.push(`${esc(h.hour)},${h.traffic},${bar}`);
    });
  } else {
    rows.push('No peak hours data recorded yet');
  }

  // Guest Favorites (Flavor Insights)
  section('Guest Favorites');
  if (flavorInsights && flavorInsights.length > 0) {
    rows.push('Menu Item,Popularity,Total Orders');
    flavorInsights.forEach((f) => {
      const bar = '\u2588'.repeat(Math.round(f.percentage / 5)) + '\u2591'.repeat(20 - Math.round(f.percentage / 5));
      rows.push(`${esc(f.item)},${f.percentage}% ${bar},"${fmt(f.orders)}"`);
    });
    const totalOrders = flavorInsights.reduce((s, f) => s + f.orders, 0);
    rows.push(`,,`);
    rows.push(`Total,,"${fmt(totalOrders)}"`);
  } else {
    rows.push('No flavor data recorded yet');
  }

  // Footer
  divider();
  rows.push('Report generated by Grangou Restaurant Portal');

  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const today = now.toISOString().split('T')[0];
  const slug = restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  link.href = url;
  link.download = `grangou-report-${slug}-${today}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Quick Actions Component
// Integrations Page Component
const IntegrationsPage = ({
  stripeConnected, stripeUserId, onStripeDisconnect,
  squareConnected, squareMerchantId, onSquareDisconnect
}) => {
  const [isStripeDisconnecting, setIsStripeDisconnecting] = useState(false);
  const [isSquareDisconnecting, setIsSquareDisconnecting] = useState(false);

  const handleConnectStripe = () => {
    const clientId = process.env.REACT_APP_STRIPE_CLIENT_ID || '';
    const redirectUri = window.location.origin;
    const stripeOAuthUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_write&redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = stripeOAuthUrl;
  };

  const handleStripeDisconnect = async () => {
    setIsStripeDisconnecting(true);
    try {
      await integrationAPI.disconnectStripe();
      onStripeDisconnect();
    } catch (err) {
      console.error('Failed to disconnect Stripe:', err);
    } finally {
      setIsStripeDisconnecting(false);
    }
  };

  const handleConnectSquare = () => {
    const appId = process.env.REACT_APP_SQUARE_APP_ID || '';
    const redirectUri = window.location.origin;
    const squareOAuthUrl = `https://connect.squareup.com/oauth2/authorize?client_id=${appId}&scope=ORDERS_READ+PAYMENTS_READ+CUSTOMERS_READ+ITEMS_READ+INVENTORY_READ&session=false&state=square_oauth&redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = squareOAuthUrl;
  };

  const handleSquareDisconnect = async () => {
    setIsSquareDisconnecting(true);
    try {
      await integrationAPI.disconnectSquare();
      onSquareDisconnect();
    } catch (err) {
      console.error('Failed to disconnect Square:', err);
    } finally {
      setIsSquareDisconnecting(false);
    }
  };

  return (
    <div className="p-8 pb-12">
        <h2 className="text-[32px] font-bold text-[#222222] mb-1">Integrations</h2>
        <p className="text-gray-500 mb-8">Connect your business tools to get the most out of Grangou</p>

        {/* Stripe Card */}
        <div className="bg-white rounded-lg shadow-card p-6 max-w-lg mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center">
              <img src="/stripe.png" alt="Stripe" className="w-full h-full object-contain" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-[#222222]">Stripe</h3>
              <p className="text-sm text-gray-500">Payment processing & financial insights</p>
            </div>
            {stripeConnected && (
              <span className="px-3 py-1 bg-[#06D6A0]/10 text-[#06D6A0] text-xs font-semibold rounded-full">
                Connected
              </span>
            )}
          </div>

          {stripeConnected && stripeUserId && (
            <p className="text-xs text-gray-400 mb-4 font-mono">Account: {stripeUserId}</p>
          )}

          {stripeConnected ? (
            <div className="flex gap-3">
              <button
                onClick={handleStripeDisconnect}
                disabled={isStripeDisconnecting}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
              >
                {isStripeDisconnecting ? <Loader2 size={14} className="animate-spin" /> : null}
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectStripe}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#635BFF] hover:bg-[#5851e0] text-white rounded-lg transition-colors text-sm font-semibold"
            >
              <Link size={16} />
              Connect Stripe
            </button>
          )}
        </div>

        {/* Square Card */}
        <div className="bg-white rounded-lg shadow-card p-6 max-w-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center bg-black">
              <svg viewBox="0 0 24 24" fill="white" width="28" height="28"><path d="M17.5 2h-11C5.1 2 4 3.1 4 4.4v15.2C4 20.9 5.1 22 6.5 22h11c1.4 0 2.5-1.1 2.5-2.4V4.4C20 3.1 18.9 2 17.5 2zm-1 16H7.5c-.3 0-.5-.2-.5-.5v-11c0-.3.2-.5.5-.5h9c.3 0 .5.2.5.5v11c0 .3-.2.5-.5.5z"/></svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-[#222222]">Square</h3>
              <p className="text-sm text-gray-500">Point-of-sale, orders & in-restaurant payments</p>
            </div>
            {squareConnected && (
              <span className="px-3 py-1 bg-[#06D6A0]/10 text-[#06D6A0] text-xs font-semibold rounded-full">
                Connected
              </span>
            )}
          </div>

          {squareConnected && squareMerchantId && (
            <p className="text-xs text-gray-400 mb-4 font-mono">Merchant: {squareMerchantId}</p>
          )}

          {squareConnected ? (
            <div className="flex gap-3">
              <button
                onClick={handleSquareDisconnect}
                disabled={isSquareDisconnecting}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
              >
                {isSquareDisconnecting ? <Loader2 size={14} className="animate-spin" /> : null}
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectSquare}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#006AFF] hover:bg-[#0055CC] text-white rounded-lg transition-colors text-sm font-semibold"
            >
              <Link size={16} />
              Connect Square
            </button>
          )}
        </div>
    </div>
  );
};

// Chatbot Panel Component (floating, restaurant management copilot)
const ChatbotPanel = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm Gou, your restaurant management copilot. I can help with your Grangou guest insights, ratings, peak hours, and more. Connect Stripe or Square in Integrations to unlock financial and POS data too!" }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);

  const toolLabels = {
    // Stripe tools
    stripe_retrieve_balance: 'Fetching Stripe balance',
    stripe_list_charges: 'Fetching charges',
    stripe_list_customers: 'Fetching Stripe customers',
    stripe_list_payment_intents: 'Fetching payments',
    stripe_list_refunds: 'Fetching refunds',
    stripe_list_products: 'Fetching products',
    // Square tools
    square_get_locations: 'Fetching locations',
    square_list_orders: 'Fetching Square orders',
    square_list_payments: 'Fetching Square payments',
    square_list_customers: 'Fetching Square customers',
    square_list_catalog: 'Fetching menu catalog',
    // Grangou tools
    grangou_get_metrics: 'Fetching Grangou metrics',
    grangou_get_recent_experiences: 'Fetching guest experiences',
    grangou_get_peak_hours: 'Fetching peak hours',
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = { role: 'user', content: input.trim() };
    const history = messages.filter(m => m.role === 'user' || m.role === 'assistant');
    setMessages(prev => [...prev, userMessage, { role: 'assistant', content: '' }]);
    setInput('');
    setIsStreaming(true);

    let assistantContent = '';

    try {
      const streamBody = await aiAPI.chat(userMessage.content, history);
      const reader = streamBody.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const rawData = line.slice(6).trim();
          if (!rawData) continue;
          try {
            const event = JSON.parse(rawData);
            if (event.type === 'text_delta') {
              assistantContent += event.text;
              const snapshot = assistantContent;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: snapshot };
                return updated;
              });
            } else if (event.type === 'tool_use') {
              setMessages(prev => {
                const updated = [...prev];
                // insert tool message before the last empty assistant bubble
                updated.splice(updated.length - 1, 0, { role: 'tool', tool_name: event.tool_name, status: 'loading' });
                return updated;
              });
            } else if (event.type === 'tool_result') {
              setMessages(prev => {
                const updated = [...prev];
                const idx = updated.findLastIndex(m => m.role === 'tool' && m.status === 'loading');
                if (idx !== -1) updated[idx] = { ...updated[idx], status: 'done' };
                return updated;
              });
            } else if (event.type === 'done') {
              setIsStreaming(false);
            }
          } catch { /* skip malformed lines */ }
        }
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed bottom-24 right-6 bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col"
      style={{ width: '384px', height: '520px', zIndex: 1000 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-[#FF3B3F] to-[#FF6B6F] rounded-t-xl">
        <div>
          <p className="font-semibold text-white text-sm">Gou</p>
          <p className="text-white/70 text-xs">Restaurant Management Copilot</p>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'tool' ? (
              <div className="flex items-center gap-2 bg-[#FF6B00]/10 px-3 py-2 rounded-lg text-xs text-[#FF6B00]">
                {msg.status === 'loading' ? (
                  <Loader2 size={12} className="animate-spin shrink-0" />
                ) : (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0"><path d="M2 6l3 3 5-5" stroke="#FF6B00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )}
                {toolLabels[msg.tool_name] || msg.tool_name}{msg.status === 'loading' ? '...' : ''}
              </div>
            ) : (
              <div className={`max-w-[80%] px-4 py-2.5 rounded-xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#FF3B3F] text-white rounded-br-sm'
                  : 'bg-[#F4F4F4] text-[#222222] rounded-bl-sm'
              }`}>
                {msg.content ? (
                  <div className="space-y-1">
                    {msg.content.split('\n').map((line, i) => {
                      const renderInline = (text) => {
                        const parts = text.split(/(\*\*[^*]+\*\*)/g);
                        return parts.map((part, j) =>
                          /^\*\*[^*]+\*\*$/.test(part)
                            ? <strong key={j}>{part.slice(2, -2)}</strong>
                            : part
                        );
                      };
                      if (/^#{1,3} /.test(line)) {
                        return <p key={i} className="font-bold">{renderInline(line.replace(/^#{1,3} /, ''))}</p>;
                      }
                      if (/^[-*] /.test(line)) {
                        return <p key={i} className="flex gap-1.5"><span>•</span><span>{renderInline(line.replace(/^[-*] /, ''))}</span></p>;
                      }
                      if (/^\d+\. /.test(line)) {
                        return <p key={i} className="flex gap-1.5"><span className="shrink-0">{line.match(/^\d+/)[0]}.</span><span>{renderInline(line.replace(/^\d+\. /, ''))}</span></p>;
                      }
                      if (line.trim() === '') return <div key={i} className="h-1" />;
                      return <p key={i}>{renderInline(line)}</p>;
                    })}
                  </div>
                ) : (isStreaming && idx === messages.length - 1 ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={12} className="animate-spin" />
                    <span className="text-gray-400 text-xs">Thinking...</span>
                  </span>
                ) : '')}
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask about your restaurant..."
            disabled={isStreaming}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3B3F] focus:border-transparent disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={isStreaming || !input.trim()}
            className="p-2.5 bg-[#FF3B3F] text-white rounded-lg hover:bg-[#E63538] transition-colors disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const QuickActions = ({ onExportReport, onOpenMenu, onOpenOrders }) => (
  <div className="bg-white rounded-lg shadow-card p-6">
    <h2 className="text-[20px] font-bold text-[#222222] mb-4">Quick Actions</h2>
    <div className="grid grid-cols-2 gap-3">
      <button className="p-4 bg-[#F4F4F4] hover:bg-[#FF3B3F]/10 rounded-lg text-left transition-colors group border border-transparent hover:border-[#FF3B3F]/20">
        <MessageSquare size={20} className="text-[#FF3B3F] mb-2" />
        <p className="text-sm font-semibold text-[#222222]">Respond to Reviews</p>
        <p className="text-xs text-gray-500">3 waiting for you</p>
      </button>
      <button onClick={onOpenMenu} className="p-4 bg-[#F4F4F4] hover:bg-[#06D6A0]/10 rounded-lg text-left transition-colors group border border-transparent hover:border-[#06D6A0]/20">
        <Utensils size={20} className="text-[#06D6A0] mb-2" />
        <p className="text-sm font-semibold text-[#222222]">Update Menu</p>
        <p className="text-xs text-gray-500">Manage your items</p>
      </button>
      <button onClick={onOpenOrders} className="p-4 bg-[#F4F4F4] hover:bg-[#FFD166]/10 rounded-lg text-left transition-colors group border border-transparent hover:border-[#FFD166]/20">
        <ShoppingBag size={20} className="text-[#FFD166] mb-2" />
        <p className="text-sm font-semibold text-[#222222]">Log Guest Orders</p>
        <p className="text-xs text-gray-500">Today's matches</p>
      </button>
      <button onClick={onExportReport} className="p-4 bg-[#F4F4F4] hover:bg-[#FF3B3F]/10 rounded-lg text-left transition-colors group border border-transparent hover:border-[#FF3B3F]/20">
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
  const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard' | 'menu' | 'orders' | 'integrations'
  const [stripeConnected, setStripeConnected] = useState(false);
  const [stripeUserId, setStripeUserId] = useState(null);
  const [squareConnected, setSquareConnected] = useState(false);
  const [squareMerchantId, setSquareMerchantId] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

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

  const fetchIntegrationStatus = async () => {
    try {
      const status = await integrationAPI.getStatus();
      setStripeConnected(status.stripe?.connected || false);
      setStripeUserId(status.stripe?.stripe_user_id || null);
      setSquareConnected(status.square?.connected || false);
      setSquareMerchantId(status.square?.square_merchant_id || null);
    } catch (err) {
      console.error('Failed to fetch integration status:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchDashboardData(), fetchIntegrationStatus()]);
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Handle OAuth callbacks — Stripe (?code=) and Square (?code=&state=square_oauth)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (code) {
      window.history.replaceState({}, '', window.location.pathname);
      if (state === 'square_oauth') {
        integrationAPI.connectSquare(code)
          .then((result) => {
            setSquareConnected(true);
            setSquareMerchantId(result.square_merchant_id || null);
            setCurrentPage('integrations');
          })
          .catch(err => {
            console.error('Square connect failed:', err);
            alert('Square connection failed: ' + err.message);
          });
      } else {
        integrationAPI.connectStripe(code)
          .then((result) => {
            setStripeConnected(true);
            setStripeUserId(result.stripe_user_id || null);
            setCurrentPage('integrations');
          })
          .catch(err => {
            console.error('Stripe connect failed:', err);
            alert('Stripe connection failed: ' + err.message);
          });
      }
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
  };

  // Sub-pages
  const floatingChat = (
    <>
      <button
        onClick={() => setChatOpen(prev => !prev)}
        className="fixed bottom-6 right-6 bg-white hover:bg-gray-50 text-[#222222] shadow-xl hover:shadow-2xl transition-all flex items-center gap-2.5 px-3 py-2 border border-gray-200"
        style={{ zIndex: 999, borderRadius: '999px 999px 4px 999px' }}
        title="Ask Gou, your restaurant management copilot"
      >
        {chatOpen
          ? <><X size={18} className="text-gray-500" /><span className="text-sm font-medium text-gray-700 pr-1">Close</span></>
          : <><img src="/gou.png" alt="Gou" className="w-8 h-8 object-cover rounded-full" /><span className="text-sm font-medium text-gray-700 pr-1">Ask Gou</span></>
        }
      </button>
      <ChatbotPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );

  const {
    impactMetrics,
    recentExperiences,
    flavorInsights,
    trafficData,
    gouSuggestions,
    matchTypeBreakdown,
  } = dashboardData || {};

  const handleExportReport = () => generateCSV(dashboardData);

  return (
    <div className="min-h-screen bg-[#F4F4F4]">
      <Navbar
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onOpenIntegrations={() => setCurrentPage('integrations')}
      />

      {currentPage === 'menu' && (
        <MenuManagement onBack={() => { setCurrentPage('dashboard'); handleRefresh(); }} />
      )}
      {currentPage === 'orders' && (
        <OrderLogging onBack={() => { setCurrentPage('dashboard'); handleRefresh(); }} />
      )}
      {currentPage === 'integrations' && (
        <IntegrationsPage
          stripeConnected={stripeConnected}
          stripeUserId={stripeUserId}
          onStripeDisconnect={() => { setStripeConnected(false); setStripeUserId(null); }}
          squareConnected={squareConnected}
          squareMerchantId={squareMerchantId}
          onSquareDisconnect={() => { setSquareConnected(false); setSquareMerchantId(null); }}
        />
      )}
      {currentPage === 'dashboard' && (
        isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-gray-400" size={32} />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center p-8 bg-white rounded-lg shadow-lg">
              <p className="text-red-500 mb-4">Error loading dashboard: {error}</p>
              <button onClick={handleRefresh} className="px-4 py-2 bg-[#FF3B3F] text-white rounded-lg hover:bg-[#E63538]">
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <main className="p-8 pb-12">
            <Header />
            <ImpactMetrics impactMetrics={impactMetrics} />
            <GouSaysCard gouSuggestions={gouSuggestions} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <RecentExperiences recentExperiences={recentExperiences} />
                <TrafficChart trafficData={trafficData} />
                <MatchTypeBreakdown matchTypeBreakdown={matchTypeBreakdown} />
              </div>
              <div className="space-y-6">
                <FlavorInsights flavorInsights={flavorInsights} stripeConnected={stripeConnected} />
                <QuickActions
                  onExportReport={handleExportReport}
                  onOpenMenu={() => setCurrentPage('menu')}
                  onOpenOrders={() => setCurrentPage('orders')}
                />
              </div>
            </div>
          </main>
        )
      )}

      {floatingChat}
    </div>
  );
};

// Main App Component with Auth
const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? <Dashboard /> : <AuthPage />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
