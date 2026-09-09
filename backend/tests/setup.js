const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const connectDB = require("../src/config/database");

// 1. Mock External APIs

// Mock AWS SNS Client
jest.mock("@aws-sdk/client-sns", () => {
  return {
    SNSClient: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockImplementation(() => Promise.resolve({ MessageId: "mock-msg-id-12345" })),
    })),
    PublishCommand: jest.fn().mockImplementation((args) => args),
  };
});

// Mock Cloudinary SDK
jest.mock("cloudinary", () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn((options, callback) => ({
        end: jest.fn((buffer) => {
          callback(null, {
            secure_url: "https://res.cloudinary.com/mock/image/upload/sample.jpg",
            public_id: "mototribe/rides/sample_public_id",
          });
        }),
      })),
      destroy: jest.fn().mockResolvedValue({ result: "ok" }),
    },
  },
}));

// Mock global fetch for OpenWeatherMap and Google Maps APIs
global.fetch = jest.fn().mockImplementation((url) => {
  if (typeof url === "string" && url.includes("openweathermap.org")) {
    if (url.includes("/weather")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            main: { temp: 25, humidity: 60 },
            weather: [{ main: "Clear", description: "clear sky", icon: "01d" }],
            wind: { speed: 5 },
          }),
      });
    }
    if (url.includes("/forecast")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            list: [
              {
                dt_txt: "2026-09-08 18:00:00",
                main: { temp: 24 },
                weather: [{ main: "Clear", icon: "01d" }],
              },
            ],
          }),
      });
    }
  }
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ status: "OK", results: [] }),
  });
});

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.DATABASE_URL = mongoUri;

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  await mongoose.connect(mongoUri);

  // Seed static Badge definitions
  const Badge = require("../src/models/mototribe/Badge");
  const initialBadges = [
    {
      key: "first_ride",
      name: "First Ride",
      description: "Complete your first ride",
      criteriaType: "ridesCompleted",
      criteriaValue: 1,
    },
    {
      key: "five_rides",
      name: "Five Rides",
      description: "Complete 5 rides",
      criteriaType: "ridesCompleted",
      criteriaValue: 5,
    },
    {
      key: "century_rider",
      name: "Century Rider",
      description: "Ride 100 km total",
      criteriaType: "totalDistanceKm",
      criteriaValue: 100,
    },
    {
      key: "thousand_km_club",
      name: "1,000 km Club",
      description: "Ride 1000 km total",
      criteriaType: "totalDistanceKm",
      criteriaValue: 1000,
    },
    {
      key: "explorer",
      name: "Explorer",
      description: "Visit 5 different regions",
      criteriaType: "regionsExplored",
      criteriaValue: 5,
    },
    {
      key: "social_rider",
      name: "Social Rider",
      description: "Join 10 ride groups",
      criteriaType: "rideGroupsJoined",
      criteriaValue: 10,
    },
  ];

  for (const b of initialBadges) {
    await Badge.findOneAndUpdate(
      { key: b.key },
      { $set: b },
      { upsert: true, new: true }
    );
  }
}, 120000);

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    if (key !== "badges") {
      await collections[key].deleteMany({});
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});
