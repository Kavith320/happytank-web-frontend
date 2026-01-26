export function saveToken(token) {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token);
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function removeToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
}

export function saveUser(user) {
  if (typeof window === "undefined") return;
  localStorage.setItem("user", JSON.stringify(user));
}

export function getUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

export function removeUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("user");
}
