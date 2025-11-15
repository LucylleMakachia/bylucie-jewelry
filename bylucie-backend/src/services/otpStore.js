const otpStore = new Map(); // key: otpToken, value: { otp, email, phone, createdAt }

export default {
  set: (key, value) => otpStore.set(key, value),
  get: (key) => otpStore.get(key),
  delete: (key) => otpStore.delete(key),
};
