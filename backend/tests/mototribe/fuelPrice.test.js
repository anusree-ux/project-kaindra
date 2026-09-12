const request = require("supertest");
const app = require("../../src/app");
const FuelPrice = require("../../src/models/mototribe/FuelPrice");
const { seedFuelPrices } = require("../../scripts/seedFuelPrices");

describe("MotoTribe Fuel Price Management API", () => {
  let authToken;

  beforeEach(async () => {
    // Register user for JWT authentication
    const userRes = await request(app).post("/api/v1/auth/signup").send({
      name: "Fuel Tester",
      email: "fuel.tester@example.com",
      password: "Password123!",
    });
    authToken = userRes.body.accessToken;

    // Seed fuel prices
    await seedFuelPrices();
  });

  test("GET /api/mototribe/fuel-prices retrieves all currently available latest fuel prices", async () => {
    const res = await request(app)
      .get("/api/mototribe/fuel-prices")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.results).toBe(7);

    const locations = res.body.data.fuelPrices.map((item) => item.location);
    expect(locations).toContain("Delhi");
    expect(locations).toContain("Mumbai, Maharashtra");
    expect(locations).toContain("Bengaluru, Karnataka");
    expect(locations).toContain("Chennai, Tamil Nadu");
    expect(locations).toContain("Hyderabad, Telangana");
    expect(locations).toContain("Ahmedabad, Gujarat");
    expect(locations).toContain("Kolkata, West Bengal");
  });

  test("Provisional estimates for Gujarat and West Bengal petrol values are flagged with isEstimate: true", async () => {
    const res = await request(app)
      .get("/api/mototribe/fuel-prices")
      .set("Authorization", `Bearer ${authToken}`);

    const ahmedabad = res.body.data.fuelPrices.find(
      (item) => item.city === "Ahmedabad"
    );
    const kolkata = res.body.data.fuelPrices.find(
      (item) => item.city === "Kolkata"
    );
    const delhi = res.body.data.fuelPrices.find(
      (item) => item.city === "Delhi"
    );

    expect(ahmedabad.isEstimate).toBe(true);
    expect(kolkata.isEstimate).toBe(true);
    expect(delhi.isEstimate).toBe(false);
  });

  test("GET /api/mototribe/fuel-prices/:location retrieves latest fuel price by location/city/state name", async () => {
    // Query by city name
    const bengaluruRes = await request(app)
      .get("/api/mototribe/fuel-prices/Bengaluru")
      .set("Authorization", `Bearer ${authToken}`);

    expect(bengaluruRes.statusCode).toBe(200);
    expect(bengaluruRes.body.data.fuelPrice.petrolPrice).toBe(110.82);
    expect(bengaluruRes.body.data.fuelPrice.dieselPrice).toBe(98.78);

    // Query by state name
    const maharashtraRes = await request(app)
      .get("/api/mototribe/fuel-prices/Maharashtra")
      .set("Authorization", `Bearer ${authToken}`);

    expect(maharashtraRes.statusCode).toBe(200);
    expect(maharashtraRes.body.data.fuelPrice.city).toBe("Mumbai");

    // Query by full location
    const hyderabadRes = await request(app)
      .get("/api/mototribe/fuel-prices/Hyderabad, Telangana")
      .set("Authorization", `Bearer ${authToken}`);

    expect(hyderabadRes.statusCode).toBe(200);
    expect(hyderabadRes.body.data.fuelPrice.petrolPrice).toBe(115.69);
  });

  test("POST /api/mototribe/fuel-prices allows daily price updates and updates isLatest flag idempotently", async () => {
    const updateRes = await request(app)
      .post("/api/mototribe/fuel-prices")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        location: "Delhi",
        city: "Delhi",
        state: "Delhi",
        petrolPrice: 102.5,
        dieselPrice: 95.5,
        isEstimate: false,
        effectiveDate: new Date(Date.now() + 86400000).toISOString(),
      });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.data.fuelPrice.petrolPrice).toBe(102.5);

    const latestRes = await request(app)
      .get("/api/mototribe/fuel-prices/Delhi")
      .set("Authorization", `Bearer ${authToken}`);

    expect(latestRes.body.data.fuelPrice.petrolPrice).toBe(102.5);
  });

  test("Running seed multiple times is idempotent and does not create duplicate records", async () => {
    await seedFuelPrices();
    await seedFuelPrices();

    const count = await FuelPrice.countDocuments();
    expect(count).toBe(7);
  });

  describe("POST /api/mototribe/fuel-prices/estimate (Estimated Fuel Cost Feature)", () => {
    test("1 & 9 & 10 & 11: Calculates Petrol fuel cost correctly with exact numbers and 2 decimal places rounding", async () => {
      const res = await request(app)
        .post("/api/mototribe/fuel-prices/estimate")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          distance: 500,
          mileage: 40,
          fuelType: "PETROL",
          location: "Delhi",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.distance).toBe(500);
      expect(res.body.data.mileage).toBe(40);
      expect(res.body.data.fuelType).toBe("PETROL");
      expect(res.body.data.fuelPrice).toBe(102.12);
      expect(res.body.data.fuelRequired).toBe(12.5); // 500 / 40
      expect(res.body.data.estimatedFuelCost).toBe(1276.5); // 12.5 * 102.12
    });

    test("2: Calculates Diesel fuel cost correctly", async () => {
      const res = await request(app)
        .post("/api/mototribe/fuel-prices/estimate")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          distance: 500,
          mileage: 40,
          fuelType: "DIESEL",
          location: "Delhi",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.fuelType).toBe("DIESEL");
      expect(res.body.data.fuelPrice).toBe(95.2);
      expect(res.body.data.fuelRequired).toBe(12.5);
      expect(res.body.data.estimatedFuelCost).toBe(1190); // 12.5 * 95.20
    });

    test("3: Handles decimal mileage and calculates rounded fuel required and cost", async () => {
      const res = await request(app)
        .post("/api/mototribe/fuel-prices/estimate")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          distance: 125.5,
          mileage: 18.5,
          fuelType: "PETROL",
          location: "Delhi",
        });

      expect(res.statusCode).toBe(200);
      // 125.5 / 18.5 = 6.783783... => rounded to 6.78
      // 6.783783... * 102.12 = 692.75799... => rounded to 692.76
      expect(res.body.data.fuelRequired).toBe(6.78);
      expect(res.body.data.estimatedFuelCost).toBe(692.76);
    });

    test("4: Rejects invalid, zero, negative, or non-numeric distance", async () => {
      const negativeRes = await request(app)
        .post("/api/mototribe/fuel-prices/estimate")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ distance: -50, mileage: 40, fuelType: "PETROL" });
      expect(negativeRes.statusCode).toBe(400);

      const zeroRes = await request(app)
        .post("/api/mototribe/fuel-prices/estimate")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ distance: 0, mileage: 40, fuelType: "PETROL" });
      expect(zeroRes.statusCode).toBe(400);

      const stringRes = await request(app)
        .post("/api/mototribe/fuel-prices/estimate")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ distance: "invalid", mileage: 40, fuelType: "PETROL" });
      expect(stringRes.statusCode).toBe(400);
    });

    test("5: Rejects invalid, zero, negative, or non-numeric mileage", async () => {
      const negativeRes = await request(app)
        .post("/api/mototribe/fuel-prices/estimate")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ distance: 500, mileage: -10, fuelType: "PETROL" });
      expect(negativeRes.statusCode).toBe(400);

      const zeroRes = await request(app)
        .post("/api/mototribe/fuel-prices/estimate")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ distance: 500, mileage: 0, fuelType: "PETROL" });
      expect(zeroRes.statusCode).toBe(400);
    });

    test("6: Rejects request missing fuel type", async () => {
      const res = await request(app)
        .post("/api/mototribe/fuel-prices/estimate")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ distance: 500, mileage: 40 });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Fuel type is required/i);
    });

    test("7: Rejects request with unsupported fuel type", async () => {
      const res = await request(app)
        .post("/api/mototribe/fuel-prices/estimate")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ distance: 500, mileage: 40, fuelType: "CNG" });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Unsupported fuel type/i);
    });

    test("8: Handles missing fuel price record for invalid location", async () => {
      const res = await request(app)
        .post("/api/mototribe/fuel-prices/estimate")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          distance: 500,
          mileage: 40,
          fuelType: "PETROL",
          location: "NonExistentCityXYZ",
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toMatch(/No fuel price data found/i);
    });

    test("Calculates correctly without specifying location, defaulting to Delhi/latest available price", async () => {
      const res = await request(app)
        .post("/api/mototribe/fuel-prices/estimate")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          distance: 500,
          mileage: 40,
          fuelType: "PETROL",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.fuelPrice).toBe(102.12);
      expect(res.body.data.fuelRequired).toBe(12.5);
      expect(res.body.data.estimatedFuelCost).toBe(1276.5);
    });
  });
});

