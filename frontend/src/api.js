const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const handleResponse = async (response) => {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const detail = payload.detail || payload.message || response.statusText;
    throw new Error(detail);
  }
  return response.json();
};

const authHeaders = (token) =>
  token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};

export const register = (data) =>
  fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  }).then(handleResponse);

export const login = (data) =>
  fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  }).then(handleResponse);

export const listCommunities = () =>
  fetch(`${API_BASE}/communities`).then(handleResponse);

export const createCommunity = (token, data) =>
  fetch(`${API_BASE}/communities`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(data),
  }).then(handleResponse);

export const listPosts = (communityId) =>
  fetch(`${API_BASE}/communities/${communityId}/posts`).then(handleResponse);

export const createPost = (token, data) =>
  fetch(`${API_BASE}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(data),
  }).then(handleResponse);

export const listComments = (postId) =>
  fetch(`${API_BASE}/posts/${postId}/comments`).then(handleResponse);

export const createComment = (token, data) =>
  fetch(`${API_BASE}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(data),
  }).then(handleResponse);

export const uploadMedia = (token, file) => {
  const body = new FormData();
  body.append("file", file);
  return fetch(`${API_BASE}/media/upload`, {
    method: "POST",
    headers: {
      ...authHeaders(token),
    },
    body,
  }).then(handleResponse);
};

export const presignMedia = (token, key) =>
  fetch(`${API_BASE}/media/presign?key=${encodeURIComponent(key)}`, {
    headers: {
      ...authHeaders(token),
    },
  }).then(handleResponse);
