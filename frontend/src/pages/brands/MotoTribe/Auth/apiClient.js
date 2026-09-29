import {
  getValidMotoTribeSession,
  refreshMotoTribeSession,
  clearMotoTribeSession,
} from "./authSession";

const API_BASE_URL =
  import.meta.env.VITE_MOTOTRIBE_API_URL || "http://localhost:5000/api";

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return text ? { message: text } : {};
}

async function request(endpoint, options = {}, retry = true) {
  const session = getValidMotoTribeSession();

  const headers = {
    ...(options.body instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  if (session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`;
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error(
      "Unable to connect to the MotoTribe server. Please try again."
    );
  }

  if (response.status === 401 && retry) {
    const refreshedSession = refreshMotoTribeSession();

    if (refreshedSession?.accessToken) {
      return request(endpoint, options, false);
    }

    clearMotoTribeSession();

    throw new Error("Your session has expired. Please log in again.");
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

export async function apiGet(endpoint, options = {}) {
  return request(endpoint, {
    ...options,
    method: "GET",
  });
}

export async function apiPost(endpoint, body, options = {}) {
  return request(endpoint, {
    ...options,
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
}

export async function apiPut(endpoint, body, options = {}) {
  return request(endpoint, {
    ...options,
    method: "PUT",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
}

export async function apiPatch(endpoint, body, options = {}) {
  return request(endpoint, {
    ...options,
    method: "PATCH",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
}

export async function apiDelete(endpoint, options = {}) {
  return request(endpoint, {
    ...options,
    method: "DELETE",
  });
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}