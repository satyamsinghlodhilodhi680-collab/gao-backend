
import VillageInfo from "../models/VillageInfo.js";

// Get village information
export const getVillageInfo = async (req, res) => {
  try {
    const village = await VillageInfo.findOne();

    if (!village) {
      return res.status(404).json({
        success: false,
        message: "Village information not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: village,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch village information",
    });
  }
};

// Create village information
export const createVillageInfo = async (req, res) => {
  try {
    const existingVillage = await VillageInfo.findOne();

    if (existingVillage) {
      return res.status(409).json({
        success: false,
        message: "Village information already exists",
      });
    }

    const village = await VillageInfo.create(req.body);

    return res.status(201).json({
      success: true,
      message: "Village information created successfully",
      data: village,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create village information",
    });
  }
};

// Update village information
export const updateVillageInfo = async (req, res) => {
  try {
    const village = await VillageInfo.findOneAndUpdate(
      {},
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!village) {
      return res.status(404).json({
        success: false,
        message: "Village information not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Village information updated successfully",
      data: village,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update village information",
    });
  }
};
