// src/controller/device.controller.js
// ====================================================
// DEVICE CONTROLLER
// - List user devices
// - Trust / untrust device
// - Remove device
// ====================================================

import httpStatus from "http-status";
import { Auth } from "../models/auth.model.js";

/**
 * GET /auth/devices
 *
 * - Logged-in user ke saare devices return karta hai
 * - Sensitive info (email, password, etc.) nahi bhejta
 */
export const getDevices = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const user = await Auth.findById(userId).select("devices email username");

    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "User not found.",
      });
    }

    return res.status(httpStatus.OK).json({
      message: "Devices fetched successfully.",
      devices: user.devices || [],
    });
  } catch (err) {
    console.error("GET DEVICES ERROR:", err);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Something went wrong while fetching devices.",
    });
  }
};

/**
 * PATCH /auth/devices/:deviceId/trust
 *
 * Body:
 *  { "isTrusted": true }  // or false
 *
 * - Sirf current user ke devices me hi update karta hai
 */
export const trustDevice = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { deviceId } = req.params;
    const { isTrusted } = req.body;

    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    if (!deviceId) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "deviceId is required in URL params.",
      });
    }

    if (typeof isTrusted !== "boolean") {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "isTrusted must be a boolean.",
      });
    }

    const user = await Auth.findById(userId);

    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "User not found.",
      });
    }

    user.devices = user.devices || [];

    const device = user.devices.find((d) => d.deviceId === deviceId);

    if (!device) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Device not found.",
      });
    }

    device.isTrusted = isTrusted;
    device.lastLoginAt = device.lastLoginAt || new Date();

    await user.save();

    return res.status(httpStatus.OK).json({
      message: `Device marked as ${isTrusted ? "trusted" : "untrusted"}.`,
      device,
    });
  } catch (err) {
    console.error("TRUST DEVICE ERROR:", err);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Something went wrong while updating device.",
    });
  }
};

/**
 * DELETE /auth/devices/:deviceId
 *
 * - User apne account se kisi device ko remove kar sakta hai
 * - Optional: yeh "logout from this device" jaisa kaam karega
 */
export const removeDevice = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { deviceId } = req.params;

    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    if (!deviceId) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "deviceId is required in URL params.",
      });
    }

    const user = await Auth.findById(userId);

    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "User not found.",
      });
    }

    user.devices = user.devices || [];

    const beforeCount = user.devices.length;

    user.devices = user.devices.filter((d) => d.deviceId !== deviceId);

    if (user.devices.length === beforeCount) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Device not found.",
      });
    }

    await user.save();

    return res.status(httpStatus.OK).json({
      message: "Device removed successfully.",
    });
  } catch (err) {
    console.error("REMOVE DEVICE ERROR:", err);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Something went wrong while removing device.",
    });
  }
};
