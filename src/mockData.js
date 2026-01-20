// Grangou Restaurant Insight Dashboard - Mock Data

export const restaurantProfile = {
  name: "The Golden Fork",
  cuisine: "Contemporary American",
  location: "Downtown Austin, TX",
  partnerSince: "March 2024",
  logo: "🍴"
};

export const impactMetrics = {
  totalGrangouGuests: 1847,
  guestGrowth: 23.5,
  estimatedRevenue: 87420,
  revenueGrowth: 18.2,
  averageRating: 4.7,
  ratingChange: 0.3,
  totalReviews: 342,
  repeatVisitors: 68
};

export const recentExperiences = [
  {
    id: 1,
    userName: "Sarah M.",
    avatar: "SM",
    rating: 5,
    review: "Amazing first date spot! The ambiance was perfect and our server knew exactly what to recommend for both of us.",
    matchType: "1-on-1 Dinner Date",
    keywords: ["Great Ambiance", "Perfect Service", "Date Night"],
    timeAgo: "2 hours ago",
    acknowledged: false
  },
  {
    id: 2,
    userName: "Marcus & Friends",
    avatar: "MF",
    rating: 4,
    review: "Loved the group seating arrangement. The sharing platters were generous and everyone found something they liked.",
    matchType: "Group Hangout (4 people)",
    keywords: ["Group Friendly", "Shareable Menu", "Good Portions"],
    timeAgo: "5 hours ago",
    acknowledged: true
  },
  {
    id: 3,
    userName: "Jennifer L.",
    avatar: "JL",
    rating: 5,
    review: "The truffle pasta was incredible! My match and I bonded over our love of Italian-American fusion. Will definitely be back.",
    matchType: "1-on-1 Lunch",
    keywords: ["Truffle Pasta", "Great Food", "Cozy Atmosphere"],
    timeAgo: "1 day ago",
    acknowledged: true
  },
  {
    id: 4,
    userName: "David K.",
    avatar: "DK",
    rating: 4,
    review: "Solid brunch spot! The outdoor patio was lovely. Only wish the wait time was a bit shorter during peak hours.",
    matchType: "Weekend Brunch",
    keywords: ["Outdoor Seating", "Brunch Spot", "Busy Peak Hours"],
    timeAgo: "1 day ago",
    acknowledged: false
  },
  {
    id: 5,
    userName: "Amy & Tom",
    avatar: "AT",
    rating: 5,
    review: "Third time here through Grangou! It's become our go-to spot. The staff remembers us now which is so sweet.",
    matchType: "Repeat Date Night",
    keywords: ["Regular Spot", "Friendly Staff", "Consistent Quality"],
    timeAgo: "2 days ago",
    acknowledged: true
  }
];

export const flavorInsights = [
  { item: "Truffle Parmesan Fries", percentage: 87, orders: 234 },
  { item: "Spicy Tuna Tartare", percentage: 76, orders: 189 },
  { item: "Matcha Latte", percentage: 72, orders: 178 },
  { item: "Grilled Salmon Bowl", percentage: 65, orders: 156 },
  { item: "Chocolate Lava Cake", percentage: 58, orders: 142 }
];

export const trafficData = [
  { date: "Dec 21", visitors: 42 },
  { date: "Dec 22", visitors: 38 },
  { date: "Dec 23", visitors: 55 },
  { date: "Dec 24", visitors: 48 },
  { date: "Dec 25", visitors: 32 },
  { date: "Dec 26", visitors: 45 },
  { date: "Dec 27", visitors: 52 },
  { date: "Dec 28", visitors: 67 },
  { date: "Dec 29", visitors: 58 },
  { date: "Dec 30", visitors: 71 },
  { date: "Dec 31", visitors: 89 },
  { date: "Jan 1", visitors: 76 },
  { date: "Jan 2", visitors: 62 },
  { date: "Jan 3", visitors: 54 },
  { date: "Jan 4", visitors: 68 },
  { date: "Jan 5", visitors: 72 },
  { date: "Jan 6", visitors: 65 },
  { date: "Jan 7", visitors: 78 },
  { date: "Jan 8", visitors: 82 },
  { date: "Jan 9", visitors: 74 },
  { date: "Jan 10", visitors: 69 },
  { date: "Jan 11", visitors: 85 },
  { date: "Jan 12", visitors: 91 },
  { date: "Jan 13", visitors: 88 },
  { date: "Jan 14", visitors: 79 },
  { date: "Jan 15", visitors: 83 },
  { date: "Jan 16", visitors: 95 },
  { date: "Jan 17", visitors: 87 },
  { date: "Jan 18", visitors: 92 },
  { date: "Jan 19", visitors: 98 },
  { date: "Jan 20", visitors: 105 }
];

export const gouSuggestions = [
  {
    id: 1,
    type: "insight",
    title: "Outdoor Seating Opportunity",
    message: "40% of your Grangou matches prefer outdoor seating. Consider highlighting your patio section in your app profile!",
    icon: "sun"
  },
  {
    id: 2,
    type: "trend",
    title: "Rising Brunch Demand",
    message: "Weekend brunch bookings from Grangou increased 35% this month. You might want to extend brunch hours!",
    icon: "trending-up"
  },
  {
    id: 3,
    type: "action",
    title: "Menu Highlight",
    message: "Your Truffle Fries are mentioned in 87% of positive reviews. Consider making it a featured item!",
    icon: "star"
  }
];

export const matchTypeBreakdown = [
  { type: "1-on-1 Dates", percentage: 45, color: "#FF3B3F" },
  { type: "Group Hangouts", percentage: 28, color: "#06D6A0" },
  { type: "Casual Meetups", percentage: 18, color: "#FFD166" },
  { type: "Business Lunches", percentage: 9, color: "#222222" }
];

export const peakHours = [
  { hour: "11 AM", traffic: 15 },
  { hour: "12 PM", traffic: 45 },
  { hour: "1 PM", traffic: 62 },
  { hour: "2 PM", traffic: 38 },
  { hour: "5 PM", traffic: 28 },
  { hour: "6 PM", traffic: 55 },
  { hour: "7 PM", traffic: 78 },
  { hour: "8 PM", traffic: 85 },
  { hour: "9 PM", traffic: 52 }
];
