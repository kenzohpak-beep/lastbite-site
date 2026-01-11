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

  // Deals: at least 2–3 per partner
  const DEALS = [
    // COBS Bread
    { id:"cobs-bread-box", partner:"COBS Bread", category:"Bakery", title:"End-of-day Bread Box (3 items)", description:"Surprise mix (loaf + buns/rolls). Great for freezing.", dietary:["Vegetarian","Dairy-free"], tags:["Best value"], window:"8:15–8:45 PM", windowEnd:"20:45", distanceKm:1.1, deliveryAvailable:false, price:8.00, originalValue:20.00, emoji:"🍞" },
    { id:"cobs-scone-pack", partner:"COBS Bread", category:"Bakery", title:"Scone Pack (6 scones)", description:"Assorted scones from end-of-day surplus.", dietary:["Vegetarian"], tags:["Limited"], window:"8:15–8:45 PM", windowEnd:"20:45", distanceKm:1.2, deliveryAvailable:false, price:7.00, originalValue:16.00, emoji:"🥐" },
    { id:"cobs-sandwich-bundle", partner:"COBS Bread", category:"Bakery", title:"Savory Bundle (2 items)", description:"Two savory bakery items (varies).", dietary:[], tags:["Limited"], window:"8:15–8:45 PM", windowEnd:"20:45", distanceKm:1.3, deliveryAvailable:true, price:9.00, originalValue:18.00, emoji:"🥖" },

    // SanRemo Bakery
    { id:"sanremo-surprise-bag", partner:"SanRemo Bakery", category:"Bakery", title:"Pastry Surprise Bag (6 pastries)", description:"Mixed pastries from today's surplus. May contain nuts.", dietary:[], tags:["Limited"], window:"9:00–9:30 PM", windowEnd:"21:30", distanceKm:4.6, deliveryAvailable:true, price:11.00, originalValue:24.00, emoji:"🥐" },
    { id:"sanremo-bread-duo", partner:"SanRemo Bakery", category:"Bakery", title:"Artisan Bread Duo", description:"Two assorted breads from end-of-day surplus.", dietary:["Vegetarian","Dairy-free"], tags:["Best value"], window:"9:00–9:30 PM", windowEnd:"21:30", distanceKm:4.7, deliveryAvailable:false, price:10.00, originalValue:22.00, emoji:"🍞" },
    { id:"sanremo-cookie-box", partner:"SanRemo Bakery", category:"Desserts", title:"Cookie Box (10 cookies)", description:"Assorted cookies—perfect for sharing.", dietary:["Vegetarian"], tags:[], window:"9:00–9:30 PM", windowEnd:"21:30", distanceKm:4.9, deliveryAvailable:true, price:9.00, originalValue:18.00, emoji:"🍪" },

    // Dufflet Pastries
    { id:"dufflet-slice-duo", partner:"Dufflet Pastries", category:"Desserts", title:"Cake Slice Duo", description:"Two assorted cake slices from end-of-day surplus.", dietary:["Vegetarian"], tags:["Limited"], window:"7:45–8:15 PM", windowEnd:"20:15", distanceKm:5.3, deliveryAvailable:true, price:9.00, originalValue:16.00, emoji:"🍰" },
    { id:"dufflet-mini-tarts", partner:"Dufflet Pastries", category:"Desserts", title:"Mini Tart Set (4 tarts)", description:"Assorted mini tarts (varies). May contain nuts.", dietary:["Vegetarian"], tags:[], window:"7:45–8:15 PM", windowEnd:"20:15", distanceKm:5.2, deliveryAvailable:true, price:10.00, originalValue:22.00, emoji:"🥧" },
    { id:"dufflet-breakfast-bag", partner:"Dufflet Pastries", category:"Bakery", title:"Breakfast Bag (3 items)", description:"Croissant + pastry + baked good (varies).", dietary:["Vegetarian"], tags:["Best value"], window:"7:45–8:15 PM", windowEnd:"20:15", distanceKm:5.4, deliveryAvailable:false, price:8.00, originalValue:20.00, emoji:"🥐" },

    // Uncle Tetsu’s Cheesecake
    { id:"tetsu-slice-trio", partner:"Uncle Tetsu’s Cheesecake", category:"Desserts", title:"Cheesecake Slice Trio", description:"Three slices (assorted when available).", dietary:["Vegetarian"], tags:["Limited"], window:"8:30–9:00 PM", windowEnd:"21:00", distanceKm:3.7, deliveryAvailable:true, price:12.00, originalValue:27.00, emoji:"🍰" },
    { id:"tetsu-mini-cheesecake", partner:"Uncle Tetsu’s Cheesecake", category:"Desserts", title:"Mini Cheesecake (1)", description:"One mini cheesecake from end-of-day surplus.", dietary:["Vegetarian"], tags:[], window:"8:30–9:00 PM", windowEnd:"21:00", distanceKm:3.6, deliveryAvailable:true, price:10.00, originalValue:20.00, emoji:"🧀" },
    { id:"tetsu-surprise-dessert", partner:"Uncle Tetsu’s Cheesecake", category:"Desserts", title:"Surprise Dessert Bag", description:"A mix of cheesecake/offcuts (varies).", dietary:["Vegetarian"], tags:["Best value"], window:"8:30–9:00 PM", windowEnd:"21:00", distanceKm:3.8, deliveryAvailable:false, price:9.00, originalValue:22.00, emoji:"🎁" },

    // Dimpflmeier Bakery
    { id:"dimpflmeier-rye-bag", partner:"Dimpflmeier Bakery", category:"Bakery", title:"Rye & Rolls Bag", description:"Assorted rye items + rolls (varies).", dietary:["Vegetarian","Dairy-free"], tags:["Best value"], window:"7:30–8:00 PM", windowEnd:"20:00", distanceKm:6.2, deliveryAvailable:false, price:9.00, originalValue:22.00, emoji:"🍞" },
    { id:"dimpflmeier-pretzel-pack", partner:"Dimpflmeier Bakery", category:"Bakery", title:"Pretzel Pack (6)", description:"Soft pretzels from end-of-day surplus.", dietary:["Vegetarian"], tags:[], window:"7:30–8:00 PM", windowEnd:"20:00", distanceKm:6.0, deliveryAvailable:true, price:7.00, originalValue:15.00, emoji:"🥨" },
    { id:"dimpflmeier-cake-offcuts", partner:"Dimpflmeier Bakery", category:"Desserts", title:"Cake Offcuts Box", description:"Mixed cake pieces (varies).", dietary:["Vegetarian"], tags:["Limited"], window:"7:30–8:00 PM", windowEnd:"20:00", distanceKm:6.3, deliveryAvailable:true, price:8.00, originalValue:18.00, emoji:"🍰" },

    // St. Urbain Bagel Bakery
    { id:"sturbain-dozen", partner:"St. Urbain Bagel Bakery", category:"Bagels", title:"Bagel Dozen (Surplus)", description:"Assorted bagels from the final batch.", dietary:["Dairy-free"], tags:["Best value"], window:"8:00–8:40 PM", windowEnd:"20:40", distanceKm:2.8, deliveryAvailable:false, price:9.00, originalValue:20.00, emoji:"🥯" },
    { id:"sturbain-creamcheese-kit", partner:"St. Urbain Bagel Bakery", category:"Bagels", title:"Bagels + Spread Kit", description:"6 bagels + spread (when available).", dietary:["Vegetarian"], tags:["Limited"], window:"8:00–8:40 PM", windowEnd:"20:40", distanceKm:2.9, deliveryAvailable:true, price:10.00, originalValue:22.00, emoji:"🥯" },
    { id:"sturbain-mini-bag", partner:"St. Urbain Bagel Bakery", category:"Bagels", title:"Mini Bagel Bag (8)", description:"Mini bagels (assorted).", dietary:["Dairy-free"], tags:[], window:"8:00–8:40 PM", windowEnd:"20:40", distanceKm:2.7, deliveryAvailable:true, price:7.00, originalValue:16.00, emoji:"🥯" },

    // Athens Pastries
    { id:"athens-baklava-box", partner:"Athens Pastries", category:"Desserts", title:"Baklava Box (6 pieces)", description:"Assorted baklava selection.", dietary:["Vegetarian"], tags:["Limited"], window:"8:20–8:50 PM", windowEnd:"20:50", distanceKm:4.1, deliveryAvailable:true, price:11.00, originalValue:24.00, emoji:"🍯" },
    { id:"athens-kataifi-pack", partner:"Athens Pastries", category:"Desserts", title:"Kataifi Pack (4)", description:"Four kataifi pastries from surplus.", dietary:["Vegetarian"], tags:[], window:"8:20–8:50 PM", windowEnd:"20:50", distanceKm:4.0, deliveryAvailable:true, price:9.00, originalValue:20.00, emoji:"🥮" },
    { id:"athens-surprise-bag", partner:"Athens Pastries", category:"Desserts", title:"Surprise Pastry Bag", description:"Mixed Greek pastries (varies).", dietary:["Vegetarian"], tags:["Best value"], window:"8:20–8:50 PM", windowEnd:"20:50", distanceKm:4.2, deliveryAvailable:false, price:8.00, originalValue:18.00, emoji:"🎁" },

    // Nadege Patisserie
    { id:"nadege-macarons", partner:"Nadege Patisserie", category:"Desserts", title:"Macaron Pack (8)", description:"Assorted macarons (varies).", dietary:["Vegetarian","Gluten-free"], tags:["Limited"], window:"8:10–8:40 PM", windowEnd:"20:40", distanceKm:2.2, deliveryAvailable:true, price:12.00, originalValue:28.00, emoji:"🍬" },
    { id:"nadege-eclair-duo", partner:"Nadege Patisserie", category:"Desserts", title:"Éclair Duo", description:"Two éclairs from end-of-day surplus.", dietary:["Vegetarian"], tags:[], window:"8:10–8:40 PM", windowEnd:"20:40", distanceKm:2.3, deliveryAvailable:true, price:9.00, originalValue:18.00, emoji:"🍫" },
    { id:"nadege-mini-cakes", partner:"Nadege Patisserie", category:"Desserts", title:"Mini Cake Trio", description:"Three mini cakes (varies).", dietary:["Vegetarian"], tags:["Best value"], window:"8:10–8:40 PM", windowEnd:"20:40", distanceKm:2.1, deliveryAvailable:false, price:11.00, originalValue:26.00, emoji:"🍰" },

    // Kettleman’s Bagels
    { id:"kettleman-dozen", partner:"Kettleman’s Bagels", category:"Bagels", title:"Bagel Dozen (Surplus)", description:"A dozen bagels from the last bake (varies).", dietary:["Dairy-free","Nut-free"], tags:["Best value"], window:"8:00–8:45 PM", windowEnd:"20:45", distanceKm:3.1, deliveryAvailable:false, price:9.00, originalValue:20.00, emoji:"🥯" },
    { id:"kettleman-halfdozen", partner:"Kettleman’s Bagels", category:"Bagels", title:"Half-Dozen Bagels", description:"Six bagels (assorted).", dietary:["Dairy-free"], tags:[], window:"8:00–8:45 PM", windowEnd:"20:45", distanceKm:3.0, deliveryAvailable:true, price:6.00, originalValue:12.00, emoji:"🥯" },
    { id:"kettleman-sandwich-kit", partner:"Kettleman’s Bagels", category:"Bagels", title:"Bagel Sandwich Kit (2)", description:"Two bagel sandwiches (varies).", dietary:[], tags:["Limited"], window:"8:00–8:45 PM", windowEnd:"20:45", distanceKm:3.2, deliveryAvailable:true, price:12.00, originalValue:24.00, emoji:"🥪" },

    // Krispy Kreme
    { id:"krispy-dozen", partner:"Krispy Kreme", category:"Desserts", title:"End-of-day Dozen (Assorted)", description:"Surplus assorted donuts (limited quantity).", dietary:["Vegetarian","Nut-free"], tags:["Limited"], window:"9:10–9:50 PM", windowEnd:"21:50", distanceKm:4.8, deliveryAvailable:true, price:10.00, originalValue:24.00, emoji:"🍩" },
    { id:"krispy-halfdozen", partner:"Krispy Kreme", category:"Desserts", title:"Half-Dozen Box", description:"Six assorted donuts.", dietary:["Vegetarian"], tags:[], window:"9:10–9:50 PM", windowEnd:"21:50", distanceKm:4.7, deliveryAvailable:true, price:6.50, originalValue:12.00, emoji:"🍩" },
    { id:"krispy-glazed-treats", partner:"Krispy Kreme", category:"Desserts", title:"Glazed Treat Pack (8)", description:"Assorted glazed treats from the day.", dietary:["Vegetarian"], tags:["Best value"], window:"9:10–9:50 PM", windowEnd:"21:50", distanceKm:4.9, deliveryAvailable:false, price:7.50, originalValue:18.00, emoji:"✨" },

    // Revolver Pizza Co.
    { id:"revolver-slice-pack", partner:"Revolver Pizza Co.", category:"Pizza", title:"Late Slice Pack (3 slices)", description:"End-of-night slices (chef’s choice).", dietary:[], tags:["Best value"], window:"9:00–9:40 PM", windowEnd:"21:40", distanceKm:2.4, deliveryAvailable:true, price:12.00, originalValue:27.00, emoji:"🍕" },
    { id:"revolver-whole-pie", partner:"Revolver Pizza Co.", category:"Pizza", title:"Surplus Whole Pie (limited)", description:"A surplus pie from the last bake run (varies).", dietary:[], tags:["Limited"], window:"9:00–9:40 PM", windowEnd:"21:40", distanceKm:2.9, deliveryAvailable:true, price:18.00, originalValue:38.00, emoji:"🍕" },
    { id:"revolver-garlic-bread", partner:"Revolver Pizza Co.", category:"Pizza", title:"Garlic Bread + Dip", description:"Garlic bread with dip (when available).", dietary:["Vegetarian"], tags:[], window:"9:00–9:40 PM", windowEnd:"21:40", distanceKm:2.6, deliveryAvailable:false, price:6.00, originalValue:12.00, emoji:"🧄" }
  ];

  // Impact factors used to estimate totals
  const IMPACT = {
    kgFoodPerMeal: 0.8,
    kgCO2ePerMeal: 2.5,
    // these are internal assumptions used to estimate donation from profits
    grossProfitPickup: 10.4,
    grossProfitDelivery: 5.4,
    donationRate: 0.05
  };

  return { PARTNERS, CATEGORIES, DEALS, IMPACT };
})();
