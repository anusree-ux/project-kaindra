const connectDB = require("../src/config/database");
const { syncIOCLFuelPrices } = require("../src/services/mototribe/ioclFuelPriceService");

const seedFuelPrices = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB for IOCL state-wise fuel price seeding...");

    const result = await syncIOCLFuelPrices();
    console.log(
      `Successfully synced ${result.count} state-wise IOCL petrol and diesel fuel price records into DB!`
    );

    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error("Error seeding IOCL state fuel prices:", error);
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
};

if (require.main === module) {
  seedFuelPrices();
}

module.exports = {
  seedFuelPrices,
};
