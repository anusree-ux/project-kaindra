const Vehicle = require("../../models/mototribe/Vehicle");
const Ride = require("../../models/mototribe/Ride");
const AppError = require("../../utils/AppError");

/**
 * @desc    Create a vehicle for logged-in user
 * @route   POST /api/mototribe/vehicles
 * @access  Private
 */
const createVehicle = async (req, res, next) => {
  try {
    const { vehicleName, registrationNumber, fuelType, mileageKmpl, isDefault } = req.body;
    const userId = req.user._id;

    const existingCount = await Vehicle.countDocuments({ userId });
    const shouldBeDefault = existingCount === 0 || isDefault === true;

    // Two-step operation: unset previous defaults before setting new default
    if (shouldBeDefault) {
      await Vehicle.updateMany({ userId }, { isDefault: false });
    }

    const vehicle = await Vehicle.create({
      userId,
      vehicleName,
      registrationNumber,
      fuelType: fuelType || "petrol",
      mileageKmpl,
      isDefault: shouldBeDefault,
    });

    res.status(201).json({
      status: "success",
      message: "Vehicle added successfully.",
      data: {
        vehicle,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all vehicles belonging to logged-in user
 * @route   GET /api/mototribe/vehicles/me
 * @access  Private
 */
const getMeVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ userId: req.user._id }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    res.status(200).json({
      status: "success",
      results: vehicles.length,
      data: {
        vehicles,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a vehicle (Owner only)
 * @route   PATCH /api/mototribe/vehicles/:id
 * @access  Private (Owner)
 */
const updateVehicle = async (req, res, next) => {
  try {
    const vehicleId = req.params.id;
    const userId = req.user._id;
    const { vehicleName, registrationNumber, fuelType, mileageKmpl, isDefault } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return next(new AppError("Vehicle not found.", 404));
    }

    if (vehicle.userId.toString() !== userId.toString()) {
      return next(new AppError("You can only edit your own vehicles.", 403));
    }

    // Two-step operation: if setting as default, unset old default first
    if (isDefault === true && !vehicle.isDefault) {
      await Vehicle.updateMany({ userId }, { isDefault: false });
      vehicle.isDefault = true;
    }

    if (vehicleName !== undefined) vehicle.vehicleName = vehicleName;
    if (registrationNumber !== undefined) vehicle.registrationNumber = registrationNumber;
    if (fuelType !== undefined) vehicle.fuelType = fuelType;
    if (mileageKmpl !== undefined) vehicle.mileageKmpl = mileageKmpl;

    await vehicle.save();

    res.status(200).json({
      status: "success",
      message: "Vehicle updated successfully.",
      data: {
        vehicle,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a vehicle (Owner only, prevented if referenced by ANY ride)
 * @route   DELETE /api/mototribe/vehicles/:id
 * @access  Private (Owner)
 */
const deleteVehicle = async (req, res, next) => {
  try {
    const vehicleId = req.params.id;
    const userId = req.user._id;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return next(new AppError("Vehicle not found.", 404));
    }

    if (vehicle.userId.toString() !== userId.toString()) {
      return next(new AppError("You can only delete your own vehicles.", 403));
    }

    // Reference check across ALL rides regardless of status (planning, ongoing, completed, cancelled)
    const rideCount = await Ride.countDocuments({ vehicleId });
    if (rideCount > 0) {
      return next(
        new AppError(
          "Cannot delete a vehicle that is referenced by existing rides. Ride history must stay connected to the vehicle used.",
          400
        )
      );
    }

    const wasDefault = vehicle.isDefault;
    await Vehicle.deleteOne({ _id: vehicle._id });

    // If deleted vehicle was default, promote newest remaining vehicle to default
    if (wasDefault) {
      const nextDefault = await Vehicle.findOne({ userId }).sort({ createdAt: -1 });
      if (nextDefault) {
        nextDefault.isDefault = true;
        await nextDefault.save();
      }
    }

    res.status(200).json({
      status: "success",
      message: "Vehicle deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVehicle,
  getMeVehicles,
  updateVehicle,
  deleteVehicle,
};
