export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// All requests include credentials so the HTTP-only cookie is sent automatically.
// NEVER read or write localStorage for user data or tokens.
const opts: RequestInit = { credentials: "include" };

// ── Products ──────────────────────────────────────────────────────────────
export const fetchProducts = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/products`, opts);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error("fetchProducts failed:", error);
    return [];
  }
};

export const publishProduct = async (productData: any) => {
  const res = await fetch(`${API_BASE_URL}/products`, {
    ...opts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const updateProduct = async (productId: string, productData: any) => {
  const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
    ...opts,
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      if (err.message) msg = err.message;
    } catch {
      // ignore parse errors
    }
    throw new Error(msg);
  }
  return res.json();
};

export const deleteProduct = async (productId: string) => {
  const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
    ...opts,
    method: "DELETE",
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      if (err.message) msg = err.message;
    } catch {
      // ignore parse errors
    }
    throw new Error(msg);
  }
  return res.json();
};

// ── Orders ────────────────────────────────────────────────────────────────
export const fetchOrders = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/orders`, opts);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error("fetchOrders failed:", error);
    return [];
  }
};

export const placeOrder = async (orderData: any) => {
  const res = await fetch(`${API_BASE_URL}/orders`, {
    ...opts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      if (err.message) msg = err.message;
    } catch {
      // ignore parse errors
    }
    throw new Error(msg);
  }
  return res.json();
};

export const updateOrderStatus = async (orderId: string, status: string) => {
  const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
    ...opts,
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

// ── Transport (transporter role) ─────────────────────────────────────────────
export const fetchOrdersForTransport = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/orders/for-transport`, opts);
    if (!res.ok) {
      if (res.status === 404) return [];
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
};

export const assignTransporter = async (orderId: string, transporterId: string, transporterName: string) => {
  const res = await fetch(`${API_BASE_URL}/orders/${orderId}/assign-transporter`, {
    ...opts,
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transporterId, transporterName }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
};

export const updateDeliveryStatus = async (orderId: string, deliveryStatus: "picked_up" | "in_transit" | "delivered") => {
  const res = await fetch(`${API_BASE_URL}/orders/${orderId}/delivery-status`, {
    ...opts,
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deliveryStatus }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

// ── Notifications ─────────────────────────────────────────────────────────
export const fetchNotifications = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications`, opts);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error("fetchNotifications failed:", error);
    return [];
  }
};

// ── Auth ──────────────────────────────────────────────────────────────────
export const signupUser = async (userData: any) => {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    ...opts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Signup failed");
  }
  return res.json();
};

export const verifyOTP = async (userId: string, otp: string) => {
  const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    ...opts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, otp }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "OTP verification failed");
  }
  return res.json();
};

export const loginUser = async (credentials: any) => {
  // Backend sets HTTP-only cookie. We return user data from response body.
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    ...opts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Login failed");
  }
  return res.json(); // { user: {...} }
};

// ── Payments ──────────────────────────────────────────────────────────────
export const createPaymentOrder = async (amount: number) => {
  const res = await fetch(`${API_BASE_URL}/payments/create-order`, {
    ...opts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) throw new Error("Failed to create payment order");
  return res.json();
};

export const verifyPayment = async (paymentData: any) => {
  const res = await fetch(`${API_BASE_URL}/payments/verify-payment`, {
    ...opts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paymentData),
  });
  if (!res.ok) throw new Error("Payment verification failed");
  return res.json();
};

// ── Wallet Top-up (Razorpay) ───────────────────────────────────────────────
export const createWalletTopupOrder = async (amount: number) => {
  const res = await fetch(`${API_BASE_URL}/payments/wallet/create-order`, {
    ...opts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) throw new Error("Failed to create wallet top-up order");
  return res.json(); // { id, amount, currency }
};

export const verifyWalletTopup = async (payload: any) => {
  const res = await fetch(`${API_BASE_URL}/payments/wallet/verify`, {
    ...opts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      if (err.message) msg = err.message;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
};

/** Demo top-up only: credits wallet without Razorpay. */
export const demoWalletTopup = async (userId: string, amount: number) => {
  const res = await fetch(`${API_BASE_URL}/payments/wallet/demo-topup`, {
    ...opts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, amount }),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      if (err.message) msg = err.message;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
};

export const demoWalletWithdraw = async (userId: string, amount: number, upiId: string) => {
  const res = await fetch(`${API_BASE_URL}/payments/wallet/demo-withdraw`, {
    ...opts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, amount, upiId }),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      if (err.message) msg = err.message;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
};

export const fetchWalletBalance = async (userId: string) => {
  const res = await fetch(`${API_BASE_URL}/payments/wallet/balance/${userId}`, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json(); // { userId, balance }
};
