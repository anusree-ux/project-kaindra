const request = require("supertest");
const app = require("../../src/app");
const Vehicle = require("../../src/models/mototribe/Vehicle");
const Ride = require("../../src/models/mototribe/Ride");
const { createTestUser } = require("../helpers/testUser");

describe("MotoTribe Vehicles API & Default Switching / Masking Logic", () => {
  let user1Token, user1Id, defaultV1Id;
  let user2Token, user2Id;

  beforeEach(async () => {
    const u1 = await createTestUser({ name: "Vehicle Owner 1" });
    user1Token = u1.token;
    user1Id = u1.userId;
    defaultV1Id = u1.vehicleId;

    const u2 = await createTestUser({ name: "Rider 2" });
    user2Token = u2.token;
    user2Id = u2.userId;
  });

  describe("Default Vehicle Switching Logic", () => {
    test("First created vehicle automatically becomes default", async () => {
      const v = await Vehicle.findById(defaultV1Id);
      expect(v.isDefault).toBe(true);
    });

    test("Creating a second vehicle with isDefault: true unsets old default", async () => {
      const res = await request(app)
        .post("/api/mototribe/vehicles")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          vehicleName: "Secondary Bike",
          registrationNumber: "KA02XY9999",
          fuelType: "petrol",
          mileageKmpl: 30,
          isDefault: true,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.vehicle.isDefault).toBe(true);

      // Verify in DB that old default was unset
      const oldV = await Vehicle.findById(defaultV1Id);
      expect(oldV.isDefault).toBe(false);

      const newV = await Vehicle.findById(res.body.data.vehicle._id);
      expect(newV.isDefault).toBe(true);
    });

    test("Updating an existing vehicle to isDefault: true unsets previous default", async () => {
      // Create second non-default vehicle
      const createRes = await request(app)
        .post("/api/mototribe/vehicles")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          vehicleName: "Second Scooter",
          registrationNumber: "KA05AB1234",
          fuelType: "petrol",
          mileageKmpl: 45,
          isDefault: false,
        });

      const secondVId = createRes.body.data.vehicle._id;
      expect(createRes.body.data.vehicle.isDefault).toBe(false);

      // Now update second vehicle to isDefault: true
      const updateRes = await request(app)
        .patch(`/api/mototribe/vehicles/${secondVId}`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ isDefault: true });

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.data.vehicle.isDefault).toBe(true);

      // Verify DB state
      const oldV = await Vehicle.findById(defaultV1Id);
      expect(oldV.isDefault).toBe(false);

      const newV = await Vehicle.findById(secondVId);
      expect(newV.isDefault).toBe(true);
    });
  });

  describe("Vehicle Reference Check on Delete Across All Ride Statuses", () => {
    test("Blocks vehicle deletion if referenced by a ride in 'planning' status", async () => {
      // Create ride with defaultV1Id in 'planning' status
      await Ride.create({
        organizerId: user1Id,
        vehicleId: defaultV1Id,
        title: "Planning Ride Test",
        origin: "A",
        destination: "B",
        startDate: new Date(Date.now() + 86400000),
        distanceKm: 50,
        status: "planning",
      });

      const delRes = await request(app)
        .delete(`/api/mototribe/vehicles/${defaultV1Id}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(delRes.statusCode).toBe(400);
      expect(delRes.body.message).toMatch(/referenced by existing rides/i);
    });

    test("Blocks vehicle deletion if referenced by a ride in 'ongoing' status", async () => {
      await Ride.create({
        organizerId: user1Id,
        vehicleId: defaultV1Id,
        title: "Ongoing Ride Test",
        origin: "A",
        destination: "B",
        startDate: new Date(),
        distanceKm: 50,
        status: "ongoing",
      });

      const delRes = await request(app)
        .delete(`/api/mototribe/vehicles/${defaultV1Id}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(delRes.statusCode).toBe(400);
      expect(delRes.body.message).toMatch(/referenced by existing rides/i);
    });

    test("Blocks vehicle deletion if referenced by a ride in 'completed' status", async () => {
      await Ride.create({
        organizerId: user1Id,
        vehicleId: defaultV1Id,
        title: "Completed Ride Test",
        origin: "A",
        destination: "B",
        startDate: new Date(Date.now() - 86400000),
        distanceKm: 50,
        status: "completed",
      });

      const delRes = await request(app)
        .delete(`/api/mototribe/vehicles/${defaultV1Id}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(delRes.statusCode).toBe(400);
      expect(delRes.body.message).toMatch(/referenced by existing rides/i);
    });

    test("Blocks vehicle deletion if referenced by a ride in 'cancelled' status", async () => {
      await Ride.create({
        organizerId: user1Id,
        vehicleId: defaultV1Id,
        title: "Cancelled Ride Test",
        origin: "A",
        destination: "B",
        startDate: new Date(),
        distanceKm: 50,
        status: "cancelled",
      });

      const delRes = await request(app)
        .delete(`/api/mototribe/vehicles/${defaultV1Id}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(delRes.statusCode).toBe(400);
      expect(delRes.body.message).toMatch(/referenced by existing rides/i);
    });

    test("Allows deleting an unreferenced vehicle and promotes next remaining vehicle to default if deleted vehicle was default", async () => {
      // Create second vehicle
      const v2Res = await request(app)
        .post("/api/mototribe/vehicles")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          vehicleName: "Spare Scooter",
          registrationNumber: "KA09ZZ1111",
          fuelType: "petrol",
          mileageKmpl: 40,
        });
      const v2Id = v2Res.body.data.vehicle._id;

      // Delete defaultV1Id (unreferenced)
      const delRes = await request(app)
        .delete(`/api/mototribe/vehicles/${defaultV1Id}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(delRes.statusCode).toBe(200);

      // Confirm v2 promotes to default
      const v2InDb = await Vehicle.findById(v2Id);
      expect(v2InDb.isDefault).toBe(true);
    });
  });

  describe("Registration Number Masking Helper Edge Cases", () => {
    test("Direct unit test of toPublicJSON with various registration number lengths", () => {
      const vehicle = new Vehicle({
        userId: user1Id,
        vehicleName: "Test Bike",
        registrationNumber: "KA01MT2027",
        mileageKmpl: 35,
      });

      // Owner sees unmasked
      const ownerView = vehicle.toPublicJSON(user1Id);
      expect(ownerView.registrationNumber).toBe("KA01MT2027");

      // Non-owner (10 chars standard Indian reg) -> prefix(4) + "****" + suffix(3)
      const nonOwner10 = vehicle.toPublicJSON(user2Id);
      expect(nonOwner10.registrationNumber).toBe("KA01****027");

      // Short registration number (<=4 chars, e.g. "AB1")
      vehicle.registrationNumber = "AB1";
      const shortReg = vehicle.toPublicJSON(user2Id);
      expect(shortReg.registrationNumber).toBe("****");

      // Medium registration number (5-7 chars, e.g. "KA01AB")
      vehicle.registrationNumber = "KA01AB";
      const medReg = vehicle.toPublicJSON(user2Id);
      expect(medReg.registrationNumber).toBe("KA****AB");
    });
  });

  describe("Authorization & Validation Checks", () => {
    test("Non-owner cannot update another user's vehicle (403)", async () => {
      const res = await request(app)
        .patch(`/api/mototribe/vehicles/${defaultV1Id}`)
        .set("Authorization", `Bearer ${user2Token}`)
        .send({ vehicleName: "Hacked Name" });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/only edit your own vehicles/i);
    });

    test("Non-owner cannot delete another user's vehicle (403)", async () => {
      const res = await request(app)
        .delete(`/api/mototribe/vehicles/${defaultV1Id}`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/only delete your own vehicles/i);
    });
  });
});
