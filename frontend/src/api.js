const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const { token, headers, ...fetchOptions } = options;

  const response = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Request failed.");
  }

  return payload;
}

export function registerUser(data) {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function loginUser(data) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function fetchCurrentUser(token) {
  return request("/api/auth/me", { token });
}
