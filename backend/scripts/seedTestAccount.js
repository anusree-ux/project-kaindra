require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const User = require("../src/models/core/User");
const RiderProfile = require("../src/models/mototribe/RiderProfile");
const Vehicle = require("../src/models/mototribe/Vehicle");
const Order = require("../src/models/core/Order");

const testUsers = [
  {
    name: "Alex Rider",
    email: "shreyamahalingshetti@gmail.com",
    phoneNumber: "+919876543210",
    password: "Password@123",
    role: "user",
    isPhoneVerified: true,
    riderProfile: {
      preferredRideType: "adventure",
      totalRidesCompleted: 14,
      totalDistanceKm: 3420,
      regionsExplored: ["Western Ghats", "Ladakh Circuit", "Goa Coastal"],
      emergencyContacts: [
        {
          name: "Sarah Rider",
          phoneNumber: "+919876500001",
          relationship: "Spouse",
        },
        {
          name: "Dr. K. Sharma",
          phoneNumber: "+919876500002",
          relationship: "Doctor",
        },
      ],
    },
    orders: [
      {
        orderNumber: "ORD-94281",
        brand: "ModaMart",
        totalAmount: 4999,
        currency: "INR",
        orderStatus: "Delivered",
        paymentStatus: "paid",
        items: [
          {
            productId: "mm-jacket-01",
            name: "AeroShield Weatherproof Touring Jacket",
            price: 4999,
            quantity: 1,
            size: "L",
            color: "Carbon Black",
          },
        ],
        shippingAddress: {
          fullName: "Alex Rider",
          addressLine1: "42 MG Road, Indiranagar",
          city: "Bengaluru",
          state: "Karnataka",
          postalCode: "560038",
          phoneNumber: "+919876543210",
        },
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      },
      {
        orderNumber: "DROP-31048",
        brand: "ModaDrop",
        totalAmount: 2499,
        currency: "INR",
        orderStatus: "Shipped",
        paymentStatus: "paid",
        items: [
          {
            productId: "drop-tee-08",
            name: "CyberPunk Limited Edition Graphic Oversized Tee",
            price: 2499,
            quantity: 1,
            size: "XL",
            color: "Obsidian",
          },
        ],
        shippingAddress: {
          fullName: "Alex Rider",
          addressLine1: "42 MG Road, Indiranagar",
          city: "Bengaluru",
          state: "Karnataka",
          postalCode: "560038",
          phoneNumber: "+919876543210",
        },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ],
  },
  {
    name: "Alex Kaindra",
    email: "alex@kaindra.com",
    phoneNumber: "+919876543211",
    password: "Password@123",
    role: "user",
    isPhoneVerified: true,
  },
  {
    name: "Kaindra Administrator",
    email: "admin@kaindra.com",
    phoneNumber: "+919876543212",
    password: "Password@123",
    role: "admin",
    isPhoneVerified: true,
  },
];

async function seedTestUsers() {
  try {
    const mongoUri = process.env.DATABASE_URL || "mongodb://localhost:27017/kaindra";
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully!");

    for (const userData of testUsers) {
      const { riderProfile, orders, ...userFields } = userData;

      // Delete existing user if present to ensure clean password hash and phone
      await User.deleteMany({
        $or: [{ email: userFields.email }, { phoneNumber: userFields.phoneNumber }],
      });

      const user = await User.create(userFields);
      console.log(`Created verified test user: ${user.name} (${user.email}) [Password: ${userFields.password}]`);

      if (riderProfile) {
        await RiderProfile.deleteMany({ userId: user._id });
        await RiderProfile.create({
          userId: user._id,
          ...riderProfile,
        });
        console.log(`  -> Attached MotoTribe RiderProfile for ${user.email}`);

        // Seed default vehicles for this rider
        await Vehicle.deleteMany({ userId: user._id });
        await Vehicle.create([
          {
            userId: user._id,
            vehicleName: "Royal Enfield Himalayan 450",
            registrationNumber: "KA-01-MT-4500",
            mileageKmpl: 28,
            fuelType: "petrol",
            isDefault: true,
          },
          {
            userId: user._id,
            vehicleName: "KTM 390 Adventure",
            registrationNumber: "KA-01-MT-3900",
            mileageKmpl: 30,
            fuelType: "petrol",
            isDefault: false,
          },
        ]);
        console.log(`  -> Attached 2 default MotoTribe Vehicles for ${user.email}`);
      }

      if (orders && orders.length > 0) {
        await Order.deleteMany({ userId: user._id });
        for (const orderData of orders) {
          await Order.deleteMany({ orderNumber: orderData.orderNumber });
          await Order.create({
            userId: user._id,
            ...orderData,
          });
        }
        console.log(`  -> Seeded ${orders.length} orders for ${user.email}`);
      }
    }

    console.log("\nAll test accounts & orders successfully seeded and verified!");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding test users:", error);
    process.exit(1);
  }
}

seedTestUsers();
