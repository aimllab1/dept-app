// This file handles internal administrative access
// The credentials are obfuscated to prevent plain-text visibility

const ADMIN_ID = "R3h3cjE="; // Gxwr1
const ADMIN_KEY = "QGd4dw=="; // @gxw

export function checkAdminAccess(id: string, key?: string) {
  if (!key) return false;
  try {
    const decodedId = atob(ADMIN_ID);
    const decodedKey = atob(ADMIN_KEY);
    return id === decodedId && key === decodedKey;
  } catch (e) {
    return false;
  }
}

export const ADMIN_PROFILE = {
  _id: "hidden_admin" as any,
  name: "Gxwr1",
  role: "hod",
  registrationNo: "ADMIN-TEST"
};
