// src/services/device.service.js
// ======================================================
// DEVICE-BASED LOGIN SECURITY SERVICE
// - Har login pe device track/update karta hai
// - New device ho to record add karta hai
// ======================================================

/**
 * Handle device info on successful login.
 *
 * Params:
 *  - user: Auth document (mongoose)
 *  - deviceId: frontend generated UUID (localStorage me store kar sakte ho)
 *  - userAgent: req.get("user-agent")
 *  - ip: client IP address
 *  - rememberDevice: boolean (agar true ho to device ko trusted mark kar sakte ho)
 *
 * Returns:
 *  - { user, isNewDevice, device }
 */
export async function handleDeviceOnLogin({
  user,
  deviceId,
  userAgent,
  ip,
  rememberDevice = false,
}) {
  // Agar deviceId hi nahi aaya, to simply skip kar do
  if (!deviceId) {
    return { user, isNewDevice: false, device: null };
  }

  user.devices = user.devices || [];

  let isNewDevice = false;
  let targetDevice = null;

  // Check: kya ye device pehle se exist karta hai?
  for (const dev of user.devices) {
    if (dev.deviceId === deviceId) {
      // Existing device -> lastLogin update karo
      dev.lastLoginAt = new Date();
      dev.userAgent = userAgent;
      dev.ip = ip;

      // Agar user ne rememberDevice == true bheja ho to trust bhi kar sakte ho
      if (rememberDevice) {
        dev.isTrusted = true;
      }

      targetDevice = dev;
      break;
    }
  }

  // Agar loop me nahi mila -> new device hai
  if (!targetDevice) {
    isNewDevice = true;

    const newDevice = {
      deviceId,
      userAgent,
      ip,
      isTrusted: !!rememberDevice,
      firstLoginAt: new Date(),
      lastLoginAt: new Date(),
    };

    user.devices.push(newDevice);
    targetDevice = newDevice;

    // TODO: yahan optional alert:
    // - Email/SMS: "New device logged in to your account."
  }

  // Last login user level pe bhi update karo
  user.lastLoginAt = new Date();

  await user.save();

  return { user, isNewDevice, device: targetDevice };
}
