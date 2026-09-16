import Company from "../models/companyModel.js";

export const updateCompanyLocation = async (req, res) => {
  try {
    const companyId = req.companyId;

    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        message: "Latitude and longitude are required",
      });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({
        message: "Latitude and longitude must be valid numbers",
      });
    }

    if (lat < -90 || lat > 90) {
      return res.status(400).json({
        message: "Invalid latitude",
      });
    }

    if (lng < -180 || lng > 180) {
      return res.status(400).json({
        message: "Invalid longitude",
      });
    }

    const company = await Company.findByIdAndUpdate(
      companyId,
      {
        latitude: lat,
        longitude: lng,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    return res.status(200).json({
      message: "Company location updated successfully",
      location: {
        latitude: company.latitude,
        longitude: company.longitude,
      },
    });
  } catch (error) {
    console.log("Update company location error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};
