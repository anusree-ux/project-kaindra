const RideJournal = require("../../models/mototribe/RideJournal");
const Ride = require("../../models/mototribe/Ride");
const RideParticipant = require("../../models/mototribe/RideParticipant");
const {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
} = require("../../services/mototribe/uploadService");
const AppError = require("../../utils/AppError");

/**
 * @desc    Create or update ride journal entry with photos & note
 * @route   POST /api/mototribe/rides/:id/journal
 * @access  Private (Confirmed Participant or Organizer)
 */
const upsertJournalEntry = async (req, res, next) => {
  const uploadedPhotos = [];
  try {
    const rideId = req.params.id;
    const userId = req.user._id;

    // 1. Verify Ride exists
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return next(new AppError("Ride not found.", 404));
    }

    // 2. Authorization: Organizer or Confirmed Participant
    const isOrganizer = ride.organizerId.toString() === userId.toString();
    const participant = await RideParticipant.findOne({
      rideId,
      userId,
      status: "confirmed",
    });

    if (!isOrganizer && !participant) {
      return next(
        new AppError(
          "Must be a confirmed participant or organizer of this ride to add journal entries.",
          403
        )
      );
    }

    // 3. Upload files to Cloudinary
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadResult = await uploadImageToCloudinary(
          file.buffer,
          "mototribe/rides"
        );
        uploadedPhotos.push(uploadResult);
      }
    }

    const { note } = req.body;

    // 4. Find existing journal entry or create new one
    let wasCreated = false;
    let journal = await RideJournal.findOne({ rideId, userId });

    if (journal) {
      if (note !== undefined) {
        journal.note = note;
      }
      if (uploadedPhotos.length > 0) {
        journal.photos.push(...uploadedPhotos);
      }
      await journal.save();
    } else {
      journal = await RideJournal.create({
        rideId,
        userId,
        note: note || "",
        photos: uploadedPhotos,
      });
      wasCreated = true;
    }

    res.status(wasCreated ? 201 : 200).json({
      status: "success",
      data: {
        journal,
      },
    });
  } catch (error) {
    // Rollback: cleanup any uploaded Cloudinary photos if DB operation fails
    if (uploadedPhotos.length > 0) {
      for (const photo of uploadedPhotos) {
        try {
          await deleteImageFromCloudinary(photo.publicId);
        } catch (cleanupErr) {
          console.error("Cloudinary rollback cleanup error:", cleanupErr);
        }
      }
    }
    next(error);
  }
};

/**
 * @desc    Get all journal entries for a ride
 * @route   GET /api/mototribe/rides/:id/journal
 * @access  Private (Confirmed Participant or Organizer)
 */
const getRideJournals = async (req, res, next) => {
  try {
    const rideId = req.params.id;
    const userId = req.user._id;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return next(new AppError("Ride not found.", 404));
    }

    const isOrganizer = ride.organizerId.toString() === userId.toString();
    const participant = await RideParticipant.findOne({
      rideId,
      userId,
      status: "confirmed",
    });

    if (!isOrganizer && !participant) {
      return next(
        new AppError(
          "Must be a confirmed participant or organizer to view ride journals.",
          403
        )
      );
    }

    const journals = await RideJournal.find({ rideId })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: journals.length,
      data: {
        journals,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get logged-in user's journal entries across all rides
 * @route   GET /api/mototribe/rider-profile/me/journal
 * @access  Private
 */
const getMyJournals = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const journals = await RideJournal.find({ userId })
      .populate("rideId", "title origin destination startDate status")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: journals.length,
      data: {
        journals,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a specific photo from a journal entry and Cloudinary
 * @route   DELETE /api/mototribe/rides/:id/journal/photos/*
 * @access  Private (Entry Owner Only)
 */
const deleteJournalPhoto = async (req, res, next) => {
  try {
    const rideId = req.params.id;
    const userId = req.user._id;

    // Express 5 wildcard match: req.params[0] or req.query.publicId or req.params.publicId
    const publicId = req.params[0] || req.query.publicId || req.params.publicId;

    if (!publicId) {
      return next(new AppError("Photo publicId is required.", 400));
    }

    const journal = await RideJournal.findOne({ rideId, userId });
    if (!journal) {
      return next(new AppError("Journal entry not found for this ride.", 404));
    }

    const photoIndex = journal.photos.findIndex(
      (p) => p.publicId === publicId
    );

    if (photoIndex === -1) {
      return next(new AppError("Photo not found in journal entry.", 404));
    }

    await deleteImageFromCloudinary(publicId);

    journal.photos.splice(photoIndex, 1);
    await journal.save();

    res.status(200).json({
      status: "success",
      message: "Photo deleted successfully.",
      data: {
        journal,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upsertJournalEntry,
  getRideJournals,
  getMyJournals,
  deleteJournalPhoto,
};
