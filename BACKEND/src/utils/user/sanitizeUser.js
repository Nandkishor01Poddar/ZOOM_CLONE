export default function sanitizeUser(userDoc) {
  if (!userDoc) return null;

  const userObj = userDoc.toObject ? userDoc.toObject() : { ...userDoc };

  delete userObj.password;
  delete userObj.emailOtpCode;
  delete userObj.emailOtpExpires;
  delete userObj.phoneOtpCode;
  delete userObj.phoneOtpExpires;
  delete userObj.resetPasswordToken;
  delete userObj.resetPasswordExpires;
  delete userObj.refreshToken;
  delete userObj.refreshTokenExpires;

  return userObj;
}
