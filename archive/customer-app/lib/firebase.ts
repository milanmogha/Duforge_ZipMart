// OTP helpers — backend handles SMS via Twilio/Fast2SMS.
// For testing: the OTP is printed to the backend terminal.
import API from "./api";

export type AuthUser = { id: string; name?: string; phone?: string; role?: string };

// POST /users/send-otp { phone } → backend sends OTP (prints to terminal in dev)
export const sendPhoneOtp = async (phone: string): Promise<void> => {
  await API.post("/users/send-otp", { phone });
};

// POST /users/verify-otp { phone, otp } → { token, user }
export const confirmOtp = async (
  phone: string,
  code: string
): Promise<{ token: string; user: AuthUser }> => {
  const { data } = await API.post("/users/verify-otp", { phone, otp: code });
  return data;
};

export const signOutFirebase = () => Promise.resolve();
