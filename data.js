window.LastBiteData = (function () {
  const PARTNERS = [
    "COBS Bread",
    "SanRemo Bakery",
    "Dufflet Pastries",
    "Uncle Tetsu’s Cheesecake",
    "Dimpflmeier Bakery",
    "St. Urbain Bagel Bakery",
    "Athens Pastries",
    "Nadege Patisserie",
    "Kettleman’s Bagels",
    "Krispy Kreme",
    "Revolver Pizza Co."
  ];

  const CATEGORIES = ["Bakery", "Desserts", "Bagels", "Pizza"];

  const DEALS = [
    {
      id: "cobs-bread-box",
      partner: "COBS Bread",
      category: "Bakery",
      title: "End-of-day Bread Box (3 items)",
      description: "Surprise mix (loaf + buns/rolls). Great for freezing.",
      dietary: ["Vegetarian", "Dairy-free"],
      tags: ["Pickup", "Best value"],
      window: "8:15–8:45 PM",
      windowEnd: "20:45",
      distanceKm: 1.1,
      deliveryAvailable: false,
      price: 8.0,
      originalValue: 20.0,
      emoji: "🍞"
    },
    {
      id: "sanremo-surprise-bag",
      partner: "SanRemo Bakery",
      category: "Bakery",
      title: "Pastry Surprise Bag (6 pastries)",
      description: "Mixed pastries from today's surplus. May contain nuts.",
      dietary: [],
      tags: ["Pickup", "Limited"],
      window: "9:00–9:30 PM",
      windowEnd: "21:30",
      distanceKm: 4.6,
      deliveryAvailable: true,
      price: 11.0,
      originalValue: 24.0,
      emoji: "🥐"
    },
    {
      id: "dufflet-slice-duo",
      partner: "Dufflet Pastries",
      category: "Desserts",
      title: "Cake Slice Duo",
      description: "Two assorted cake slices from end-of-day surplus.",
      dietary: ["Vegetarian"],
      tags: ["Pickup", "Limited"],
      window: "7:45–8:15 PM",
      windowEnd: "20:15",
      distanceKm: 5.3,
      deliveryAvailable: true,
      price: 9.0,
      originalValue: 16.0,
      emoji: "🍰"
    },
    {
      id: "kettleman-dozen",
      partner: "Kettleman’s Bagels",
      category: "Bagels",
      title: "Bagel Dozen (Surplus)",
      description: "A dozen bagels from the last bake (varies).",
      dietary: ["Dairy-free", "Nut-free"],
      tags: ["Pickup", "Best value"],
      window: "8:00–8:45 PM",
      windowEnd: "20:45",
      distanceKm: 3.1,
      deliveryAvailable: false,
      price: 9.0,
      originalValue: 20.0,
      emoji: "🥯"
    },
    {
      id: "krispy-dozen",
      partner: "Krispy Kreme",
      category: "Desserts",
      title: "End-of-day Dozen (Assorted)",
      description: "Surplus assorted donuts (limited quantity).",
      dietary: ["Vegetarian", "Nut-free"],
      tags: ["Pickup", "Limited"],
      window: "9:10–9:50 PM",
      windowEnd: "21:50",
      distanceKm: 4.8,
      deliveryAvailable: true,
      price: 10.0,
      originalValue: 24.0,
      emoji: "🍩"
    },
    {
      id: "revolver-slice-pack",
      partner: "Revolver Pizza Co.",
      category: "Pizza",
      title: "Late Slice Pack (3 slices)",
      description: "End-of-night slices (chef’s choice).",
      dietary: [],
      tags: ["Pickup", "Best value"],
      window: "9:00–9:40 PM",
      windowEnd: "21:40",
      distanceKm: 2.4,
      deliveryAvailable: true,
      price: 12.0,
      originalValue: 27.0,
      emoji: "🍕"
    },
    {
      id: "revolver-whole-pie",
      partner: "Revolver Pizza Co.",
      category: "Pizza",
      title: "Surplus Whole Pie (limited)",
      description: "A surplus pie from the last bake run (varies).",
      dietary: [],
      tags: ["Pickup", "Limited"],
      window: "9:00–9:40 PM",
      windowEnd: "21:40",
      distanceKm: 2.9,
      deliveryAvailable: true,
      price: 18.0,
      originalValue: 38.0,
      emoji: "🍕"
    }
  ];

  const IMPACT = {
    kgFoodPerMeal: 0.8,
    kgCO2ePerMeal: 2.5,
    grossProfitPickup: 10.4,
    grossProfitDelivery: 5.4,
    donationRate: 0.05,
    communityBase: {
      meals: 18420,
      kgFood: 14736,
      kgCO2e: 46050,
      donated: 3820,
      savings: 210000
    }
  };

  const PILOT_PREFIXES = ["M5", "M6", "M4"];

  return { PARTNERS, CATEGORIES, DEALS, IMPACT, PILOT_PREFIXES };
})();
