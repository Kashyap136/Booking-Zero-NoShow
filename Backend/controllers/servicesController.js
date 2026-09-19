import Service from "../models/serviceModel.js";

export const create = async (req, res) => {
  try {
    const { title, durationMins, price, staffId, category } = req.body;

    const companyId = req.companyId;

    const service = await Service.create({
      companyId,
      title,
      durationMins,
      price,
      staffId,
      category,
    });

    return res.status(201).json({
      message: "Service created successfully",
      service,
    });
  } catch (error) {
    console.log("Create service error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const list = async (req, res) => {
  try {
    const companyId = req.companyId || req.query.companyId;

    const services = await Service.find({
      companyId,
    }).sort({ title: 1 });

    return res.status(200).json({
      services,
    });
  } catch (error) {
    console.log("Get services error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const update = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { serviceId, title, durationMins, price, staffId, category } =
      req.body;

    if (!serviceId) {
      return res.status(400).json({
        message: "serviceId is required",
      });
    }

    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (durationMins !== undefined) updateFields.durationMins = durationMins;
    if (price !== undefined) updateFields.price = price;
    if (staffId !== undefined) updateFields.staffId = staffId;
    if (category !== undefined) updateFields.category = category;

    const service = await Service.findOneAndUpdate(
      { _id: serviceId, companyId },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    return res.status(200).json({
      message: "Service updated successfully",
      service,
    });
  } catch (error) {
    console.log("Update service error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const remove = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { serviceId } = req.body;

    if (!serviceId) {
      return res.status(400).json({
        message: "serviceId is required",
      });
    }

    const service = await Service.findOneAndDelete({
      _id: serviceId,
      companyId,
    });

    if (!service) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    return res.status(200).json({
      message: "Service deleted successfully",
    });
  } catch (error) {
    console.log("Delete service error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};
