const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

export function apiUrl(path) {
  return `${API_URL}${path}`;
}

export function getToken() {
  return localStorage.getItem("authToken");
}

export function getCurrentUser() {
  const user = localStorage.getItem("authUser");

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch (error) {
    console.error(
      "Impossible de lire les informations du compte :",
      error
    );

    return null;
  }
}

export function saveSession(token, client) {
  localStorage.setItem("authToken", token);
  localStorage.setItem("authUser", JSON.stringify(client));
  localStorage.setItem("clientId", String(client.id));
}

export function clearSession() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
  localStorage.removeItem("clientId");
}

export async function authFetch(path, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(apiUrl(path), {
    ...options,
    headers,
  });
}