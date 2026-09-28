const ModaTales = require("../../models/modasphere/ModaTales");

// Create a new tale submission
const createTale = async (req, res) => {
  try {
    const { name, email, storyType, message } = req.body;

    const tale = await ModaTales.create({
      name,
      email,
      storyType,
      message,
    });

    res.status(201).json({
      success: true,
      message: "Story submitted successfully",
      tale,
    });
  } catch (error) {
    console.error("Create tale error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to submit story",
    });
  }
};

// Get all tale submissions for admin
const getAdminTales = async (req, res) => {
  try {
    const tales = await ModaTales.find().sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      count: tales.length,
      tales,
    });
  } catch (error) {
    console.error("Get admin tales error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch tale submissions",
    });
  }
};

// Get a single tale submission for admin
const getAdminTaleById = async (req, res) => {
  try {
    const tale = await ModaTales.findById(req.params.id);

    if (!tale) {
      return res.status(404).json({
        success: false,
        message: "Tale submission not found",
      });
    }

    res.status(200).json({
      success: true,
      tale,
    });
  } catch (error) {
    console.error("Get admin tale error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch tale submission",
    });
  }
};

// Update tale status
const updateTaleStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const tale = await ModaTales.findById(req.params.id);

    if (!tale) {
      return res.status(404).json({
        success: false,
        message: "Tale submission not found",
      });
    }

    tale.status = status;

    await tale.save();

    res.status(200).json({
      success: true,
      message: "Tale status updated successfully",
      tale,
    });
  } catch (error) {
    console.error("Update tale status error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update tale status",
    });
  }
};

// Delete tale submission
const deleteTale = async (req, res) => {
  try {
    const tale = await ModaTales.findById(req.params.id);

    if (!tale) {
      return res.status(404).json({
        success: false,
        message: "Tale submission not found",
      });
    }

    await tale.deleteOne();

    res.status(200).json({
      success: true,
      message: "Tale submission deleted successfully",
    });
  } catch (error) {
    console.error("Delete tale error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete tale submission",
    });
  }
};

module.exports = {
  createTale,
  getAdminTales,
  getAdminTaleById,
  updateTaleStatus,
  deleteTale,
};