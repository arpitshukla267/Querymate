// Utility functions
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function truncate(str, length = 50) {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function getBackendUrl() {
  return (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:5000" ||
    "https://querymate-backend-sz0d.onrender.com"
  );
}

export function getAuthToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("authToken");
  }
  return null;
}

export function getUserEmail() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("userEmail");
  }
  return null;
}

export function isAuthenticated() {
  return !!getAuthToken();
}

export function setAuth(token, email) {
  if (typeof window !== "undefined") {
    localStorage.setItem("authToken", token);
    localStorage.setItem("userEmail", email);
  }
}

export function clearAuth() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userEmail");
  }
}

