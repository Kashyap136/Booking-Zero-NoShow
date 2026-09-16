import Service from "../models/serviceModel.js";

export const create = async (req, res) => {
  try {
     console.log("REQ BODY:", req.body);
    const {title, durationMins, price, staffId, category } =
      req.body;

       const companyId = req.companyId;
      console.log(companyId)
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
    const { companyId } = req.query;

    const services = await Service.find({
      companyId,
    });

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
