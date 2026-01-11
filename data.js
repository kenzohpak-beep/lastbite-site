window.LastBiteData = {
  PARTNERS: [
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
  ],

  CATEGORIES: ["Bakery", "Dessert", "Bagels", "Pizza", "Mixed Box"],

  IMPACT: {
    kgFoodPerMeal: 0.75,
    kgCO2ePerMeal: 1.6,
    grossProfitDelivery: 5.4,
    grossProfitPickup: 10.4,
    donationRate: 0.05,

    // Seed totals shown immediately (fake but realistic-looking)
    seedCompanyMeals: 12500,
    seedCompanyDonated: 5200,
    seedCompanySavings: 78000,

    seedGlobalOrders: 184000,
    seedGlobalMeals: 520000,
    seedGlobalDonated: 235000,
    seedGlobalSavings: 1200000
  },

  DEALS: [
    // COBS
    { id:"cobs_1", partner:"COBS Bread", category:"Bakery", title:"End-of-day Bread Bundle", description:"Assorted loaves & buns (limited).", price:7.99, originalValue:18.00, window:"8:30–9:00 PM", windowEnd:"21:00", distanceKm:1.2, deliveryAvailable:false, tags:["Best value","Limited"], dietary:["Vegetarian"], emoji:"🍞" },
    { id:"cobs_2", partner:"COBS Bread", category:"Bakery", title:"Pastry Mix Pack", description:"Croissants + danish assortment.", price:6.49, originalValue:15.00, window:"8:30–9:00 PM", windowEnd:"21:00", distanceKm:1.2, deliveryAvailable:true, tags:["Delivery"], dietary:["Vegetarian"], emoji:"🥐" },
    { id:"cobs_3", partner:"COBS Bread", category:"Mixed Box", title:"Breakfast Box", description:"Muffins + scones + buns.", price:8.99, originalValue:20.00, window:"8:30–9:00 PM", windowEnd:"21:00", distanceKm:1.2, deliveryAvailable:true, tags:["Best value","Delivery"], dietary:["Vegetarian"], emoji:"🧁" },

    // SanRemo
    { id:"sanremo_1", partner:"SanRemo Bakery", category:"Dessert", title:"Cannoli Trio", description:"3 assorted cannoli.", price:7.50, originalValue:16.50, window:"9:00–9:30 PM", windowEnd:"21:30", distanceKm:2.6, deliveryAvailable:true, tags:["Delivery"], dietary:["Vegetarian"], emoji:"🍰" },
    { id:"sanremo_2", partner:"SanRemo Bakery", category:"Bakery", title:"Italian Bread + Cookies", description:"Bread + cookie bag.", price:9.99, originalValue:22.00, window:"9:00–9:30 PM", windowEnd:"21:30", distanceKm:2.6, deliveryAvailable:false, tags:["Best value"], dietary:["Vegetarian"], emoji:"🍪" },
    { id:"sanremo_3", partner:"SanRemo Bakery", category:"Dessert", title:"Tiramisu Slice Bundle", description:"2 slices (limited).", price:8.49, originalValue:18.00, window:"9:00–9:30 PM", windowEnd:"21:30", distanceKm:2.6, deliveryAvailable:true, tags:["Limited","Delivery"], dietary:["Vegetarian"], emoji:"☕" },

    // Dufflet
    { id:"dufflet_1", partner:"Dufflet Pastries", category:"Dessert", title:"Cake Slice Surprise", description:"Chef’s choice slice.", price:6.25, originalValue:14.00, window:"8:00–8:30 PM", windowEnd:"20:30", distanceKm:1.9, deliveryAvailable:true, tags:["Delivery"], dietary:["Vegetarian"], emoji:"🍰" },
    { id:"dufflet_2", partner:"Dufflet Pastries", category:"Dessert", title:"Macaron 6-Pack", description:"Assorted flavours.", price:8.99, originalValue:19.00, window:"8:00–8:30 PM", windowEnd:"20:30", distanceKm:1.9, deliveryAvailable:false, tags:["Best value"], dietary:["Gluten-free"], emoji:"🍬" },
    { id:"dufflet_3", partner:"Dufflet Pastries", category:"Bakery", title:"Pastry Box", description:"Croissants + danish mix.", price:7.99, originalValue:18.00, window:"8:00–8:30 PM", windowEnd:"20:30", distanceKm:1.9, deliveryAvailable:true, tags:["Delivery"], dietary:["Vegetarian"], emoji:"🥐" },

    // Uncle Tetsu
    { id:"tetsu_1", partner:"Uncle Tetsu’s Cheesecake", category:"Dessert", title:"Cheesecake Slice Duo", description:"2 slices (classic).", price:7.25, originalValue:16.00, window:"8:30–9:00 PM", windowEnd:"21:00", distanceKm:3.1, deliveryAvailable:true, tags:["Delivery"], dietary:["Vegetarian"], emoji:"🧀" },
    { id:"tetsu_2", partner:"Uncle Tetsu’s Cheesecake", category:"Dessert", title:"Mini Cheesecake Box", description:"4 mini pieces.", price:9.99, originalValue:22.00, window:"8:30–9:00 PM", windowEnd:"21:00", distanceKm:3.1, deliveryAvailable:false, tags:["Best value"], dietary:["Vegetarian"], emoji:"🍮" },

    // Dimpflmeier
    { id:"dimp_1", partner:"Dimpflmeier Bakery", category:"Bakery", title:"Rye & Rolls Bundle", description:"Rye loaf + roll pack.", price:8.25, originalValue:19.50, window:"7:45–8:15 PM", windowEnd:"20:15", distanceKm:4.0, deliveryAvailable:false, tags:["Best value"], dietary:["Vegetarian"], emoji:"🍞" },
    { id:"dimp_2", partner:"Dimpflmeier Bakery", category:"Bakery", title:"Pretzel Bag", description:"Soft pretzels (6).", price:6.99, originalValue:15.00, window:"7:45–8:15 PM", windowEnd:"20:15", distanceKm:4.0, deliveryAvailable:true, tags:["Delivery"], dietary:["Vegetarian","Nut-free"], emoji:"🥨" },

    // St Urbain
    { id:"sturbain_1", partner:"St. Urbain Bagel Bakery", category:"Bagels", title:"Bagel Dozen (Assorted)", description:"12 bagels, end-of-day.", price:6.99, originalValue:14.50, window:"6:30–7:00 PM", windowEnd:"19:00", distanceKm:2.2, deliveryAvailable:true, tags:["Best value","Delivery"], dietary:["Vegetarian"], emoji:"🥯" },
    { id:"sturbain_2", partner:"St. Urbain Bagel Bakery", category:"Bagels", title:"Cream Cheese + Bagel 6-Pack", description:"6 bagels + cream cheese.", price:8.49, originalValue:18.00, window:"6:30–7:00 PM", windowEnd:"19:00", distanceKm:2.2, deliveryAvailable:false, tags:["Limited"], dietary:["Vegetarian"], emoji:"🧈" },

    // Athens
    { id:"athens_1", partner:"Athens Pastries", category:"Dessert", title:"Baklava Box", description:"Assorted pieces.", price:7.99, originalValue:18.00, window:"8:15–8:45 PM", windowEnd:"20:45", distanceKm:2.8, deliveryAvailable:true, tags:["Delivery"], dietary:["Vegetarian"], emoji:"🍯" },
    { id:"athens_2", partner:"Athens Pastries", category:"Dessert", title:"Cookie & Pastry Mix", description:"Assorted sweets (limited).", price:8.49, originalValue:19.00, window:"8:15–8:45 PM", windowEnd:"20:45", distanceKm:2.8, deliveryAvailable:false, tags:["Limited"], dietary:["Vegetarian"], emoji:"🍪" },

    // Nadege
    { id:"nadege_1", partner:"Nadege Patisserie", category:"Dessert", title:"Macaron 8-Pack", description:"Assorted flavours.", price:10.99, originalValue:26.00, window:"8:30–9:00 PM", windowEnd:"21:00", distanceKm:1.6, deliveryAvailable:true, tags:["Delivery","Best value"], dietary:["Gluten-free"], emoji:"🎀" },
    { id:"nadege_2", partner:"Nadege Patisserie", category:"Dessert", title:"Mini Tart Box", description:"4 mini tarts.", price:9.49, originalValue:22.00, window:"8:30–9:00 PM", windowEnd:"21:00", distanceKm:1.6, deliveryAvailable:false, tags:["Limited"], dietary:["Vegetarian"], emoji:"🥧" },

    // Kettleman’s
    { id:"kettle_1", partner:"Kettleman’s Bagels", category:"Bagels", title:"Bagel 12-Pack + Spread", description:"12 bagels + spread.", price:9.99, originalValue:21.00, window:"9:15–9:45 PM", windowEnd:"21:45", distanceKm:3.4, deliveryAvailable:true, tags:["Delivery"], dietary:["Vegetarian"], emoji:"🥯" },
    { id:"kettle_2", partner:"Kettleman’s Bagels", category:"Bagels", title:"Everything Bagel Dozen", description:"12 everything bagels.", price:7.49, originalValue:15.50, window:"9:15–9:45 PM", windowEnd:"21:45", distanceKm:3.4, deliveryAvailable:false, tags:["Best value"], dietary:["Vegetarian"], emoji:"✨" },

    // Krispy Kreme
    { id:"kk_1", partner:"Krispy Kreme", category:"Dessert", title:"Original Glazed 6-Pack", description:"6 donuts, end-of-day.", price:6.99, originalValue:14.00, window:"9:00–9:30 PM", windowEnd:"21:30", distanceKm:4.6, deliveryAvailable:true, tags:["Delivery"], dietary:["Vegetarian"], emoji:"🍩" },
    { id:"kk_2", partner:"Krispy Kreme", category:"Dessert", title:"Assorted Dozen (Limited)", description:"12 assorted donuts.", price:11.99, originalValue:26.00, window:"9:00–9:30 PM", windowEnd:"21:30", distanceKm:4.6, deliveryAvailable:false, tags:["Limited","Best value"], dietary:["Vegetarian"], emoji:"🍩" },

    // Revolver Pizza
    { id:"rev_1", partner:"Revolver Pizza Co.", category:"Pizza", title:"2 Slice + Dip Combo", description:"2 slices + dip.", price:7.99, originalValue:18.00, window:"10:00–10:30 PM", windowEnd:"22:30", distanceKm:2.0, deliveryAvailable:true, tags:["Delivery","Best value"], dietary:["Nut-free"], emoji:"🍕" },
    { id:"rev_2", partner:"Revolver Pizza Co.", category:"Pizza", title:"Pizza Box (Chef’s Choice)", description:"Mixed slices, limited.", price:12.49, originalValue:28.00, window:"10:00–10:30 PM", windowEnd:"22:30", distanceKm:2.0, deliveryAvailable:true, tags:["Limited","Delivery"], dietary:["Nut-free"], emoji:"📦" }
  ]
};
