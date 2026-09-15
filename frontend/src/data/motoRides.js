/*
 * Shared MotoTribe ride data.
 *
 * All ride-related components should use this source:
 *
 * Ride Planner
 *      ↓
 * Upcoming Rides
 *      ↓
 * Ride Details
 *      ↓
 * Live Ride
 *      ↓
 * Digital Ride Record
 *      ↓
 * Community Guide
 */

export const motoRides = [
  {
    id: "ride-001",

    name: "Ladakh High Altitude Expedition",

    start: "Delhi",
    destination: "Leh",

    route:
      "Delhi → Chandigarh → Manali → Sissu → Jispa → Sarchu → Leh",

    stops: [
      "Chandigarh",
      "Manali",
      "Sissu",
      "Jispa",
      "Sarchu",
    ],

    date: "2026-09-20",
    time: "06:00",

    type: "ADVENTURE",
    difficulty: "ADVANCED",

    organizer: "Arjun",
    organizerType: "OFFICIAL",

    riders: 18,
    maxRiders: 24,

    requestRequired: true,

    distance: 1020,
    distanceLabel: "1,020 KM",

    duration: "4 Days",

    budget: 15000,

    description:
      "A high-altitude motorcycle expedition designed for experienced riders seeking challenging terrain, mountain roads and long-distance riding.",

    requirements: [
      "Advanced mountain riding experience",
      "Adventure-ready motorcycle",
      "Valid driving license",
      "Helmet and protective riding gear",
      "Emergency equipment",
      "Pre-ride motorcycle inspection",
    ],

    safety:
      "High-altitude terrain requires preparation, appropriate equipment and route awareness.",

    participants: [
      {
        id: "r1",
        name: "Arjun",
        role: "ORGANIZER",
        confirmed: true,
      },
      {
        id: "r2",
        name: "Rahul",
        role: "RIDER",
        confirmed: true,
      },
      {
        id: "r3",
        name: "Meera",
        role: "RIDER",
        confirmed: true,
      },
    ],

    vehicle: {
      name: "Royal Enfield Himalayan",
      fuelType: "PETROL",
      mileage: 30,
    },

    journeyIntelligence: {
      fuelStops: 6,
      restStops: 5,
      serviceStops: 3,
      accommodationStops: 4,
      scenicStops: 7,
    },

    source: "COMMUNITY + MAP ESTIMATE",
  },

  {
    id: "ride-002",

    name: "Coastal Sunrise Ride",

    start: "Visakhapatnam",
    destination: "Kakinada",

    route:
      "Visakhapatnam → Anakapalle → Tuni → Yanam → Kakinada",

    stops: [
      "Anakapalle",
      "Tuni",
      "Yanam",
      "Kakinada Beach",
      "Coringa",
    ],

    date: "2026-09-22",
    time: "05:30",

    type: "TOURING",
    difficulty: "INTERMEDIATE",

    organizer: "Vikram",
    organizerType: "COMMUNITY",

    riders: 12,
    maxRiders: 20,

    requestRequired: false,

    distance: 310,
    distanceLabel: "310 KM",

    duration: "1 Day",

    budget: 3500,

    description:
      "A relaxed coastal ride focused on sunrise views, local food, scenic roads and community riding.",

    requirements: [
      "Valid driving license",
      "Helmet",
      "Registered motorcycle",
      "Basic riding experience",
    ],

    safety:
      "Maintain safe riding distance and stay hydrated during the coastal journey.",

    participants: [
      {
        id: "r4",
        name: "Vikram",
        role: "ORGANIZER",
        confirmed: true,
      },
      {
        id: "r5",
        name: "Kiran",
        role: "RIDER",
        confirmed: true,
      },
    ],

    vehicle: {
      name: "Yamaha MT-15",
      fuelType: "PETROL",
      mileage: 42,
    },

    journeyIntelligence: {
      fuelStops: 2,
      restStops: 3,
      serviceStops: 1,
      accommodationStops: 0,
      scenicStops: 5,
    },

    source: "COMMUNITY RIDER REPORT",
  },

  {
    id: "ride-003",

    name: "Western Ghats Adventure",

    start: "Bengaluru",
    destination: "Coorg",

    route:
      "Bengaluru → Ramanagara → Mysuru → Kushalnagar → Madikeri",

    stops: [
      "Ramanagara",
      "Mysuru",
      "Kushalnagar",
      "Abbey Falls",
      "Madikeri",
    ],

    date: "2026-09-25",
    time: "06:30",

    type: "ADVENTURE",
    difficulty: "INTERMEDIATE",

    organizer: "Western Riders",
    organizerType: "COMMUNITY",

    riders: 16,
    maxRiders: 22,

    requestRequired: true,

    distance: 270,
    distanceLabel: "270 KM",

    duration: "2 Days",

    budget: 4500,

    description:
      "A weekend Western Ghats ride combining winding roads, forest sections, waterfalls and relaxed group riding.",

    requirements: [
      "Valid driving license",
      "Helmet",
      "Protective riding gear",
      "Motorcycle in good condition",
    ],

    safety:
      "Forest roads may become slippery during rain. Riders should maintain controlled speeds.",

    participants: [
      {
        id: "r6",
        name: "Western Riders",
        role: "ORGANIZER",
        confirmed: true,
      },
      {
        id: "r7",
        name: "Aditya",
        role: "RIDER",
        confirmed: true,
      },
    ],

    vehicle: {
      name: "KTM Adventure 390",
      fuelType: "PETROL",
      mileage: 28,
    },

    journeyIntelligence: {
      fuelStops: 2,
      restStops: 4,
      serviceStops: 1,
      accommodationStops: 1,
      scenicStops: 6,
    },

    source: "COMMUNITY RIDER REPORT",
  },

  {
    id: "ride-004",

    name: "Night Cruiser Run",

    start: "Hyderabad",
    destination: "Vijayawada",

    route:
      "Hyderabad → Suryapet → Kodad → Guntur → Vijayawada",

    stops: [
      "Suryapet",
      "Kodad",
      "Guntur",
      "Vijayawada",
    ],

    date: "2026-09-28",
    time: "22:00",

    type: "CRUISER",
    difficulty: "INTERMEDIATE",

    organizer: "Deccan Night Riders",
    organizerType: "COMMUNITY",

    riders: 14,
    maxRiders: 20,

    requestRequired: false,

    distance: 275,
    distanceLabel: "275 KM",

    duration: "1 Night",

    budget: 3000,

    description:
      "A controlled night ride for riders who enjoy long highway cruising and group riding.",

    requirements: [
      "Night riding experience",
      "Reflective riding gear",
      "Motorcycle lights checked",
      "Valid driving license",
      "Helmet",
    ],

    safety:
      "Maintain visibility, avoid fatigue and take scheduled rest breaks during the night journey.",

    participants: [
      {
        id: "r8",
        name: "Deccan Night Riders",
        role: "ORGANIZER",
        confirmed: true,
      },
      {
        id: "r9",
        name: "Karthik",
        role: "RIDER",
        confirmed: true,
      },
    ],

    vehicle: {
      name: "Royal Enfield Classic 350",
      fuelType: "PETROL",
      mileage: 35,
    },

    journeyIntelligence: {
      fuelStops: 2,
      restStops: 3,
      serviceStops: 2,
      accommodationStops: 0,
      scenicStops: 1,
    },

    source: "COMMUNITY RIDER REPORT",
  },
];

/*
 * Find one ride using its shared ID.
 */
export function getMotoRideById(rideId) {
  return motoRides.find((ride) => ride.id === rideId);
}

/*
 * Convert a shared ride into the common date/time value
 * used by countdown and lifecycle calculations.
 */
export function getMotoRideDate(ride) {
  if (!ride) {
    return null;
  }

  return new Date(`${ride.date}T${ride.time}:00`);
}

/*
 * Automatically determine the frontend demo lifecycle.
 *
 * UPCOMING
 * STARTING
 * LIVE
 * COMPLETED
 *
 * In production this should be controlled by the backend/event system.
 */
export function getMotoRideStatus(ride, now = new Date()) {
  if (!ride) {
    return "UPCOMING";
  }

  const rideStart = getMotoRideDate(ride);

  if (!rideStart) {
    return "UPCOMING";
  }

  const startTime = rideStart.getTime();
  const currentTime = now.getTime();

  const startingWindow = 30 * 60 * 1000;
  const liveDuration = 8 * 60 * 60 * 1000;

  if (currentTime < startTime - startingWindow) {
    return "UPCOMING";
  }

  if (currentTime >= startTime - startingWindow && currentTime < startTime) {
    return "STARTING";
  }

  if (
    currentTime >= startTime &&
    currentTime < startTime + liveDuration
  ) {
    return "LIVE";
  }

  return "COMPLETED";
}

/*
 * Calculate a countdown for the shared ride.
 */
export function getMotoRideCountdown(ride, now = new Date()) {
  const rideDate = getMotoRideDate(ride);

  if (!rideDate) {
    return {
      expired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const difference = rideDate.getTime() - now.getTime();

  if (difference <= 0) {
    return {
      expired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const totalSeconds = Math.floor(difference / 1000);

  return {
    expired: false,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}