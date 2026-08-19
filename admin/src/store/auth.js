const TOKEN_KEY = "zhz_admin_token";
const USER_KEY = "zhz_admin_user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(t) {
  localStorage.setItem(TOKEN_KEY, t);
}

export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function getPerms() {
  const u = getUser();
  return (u && u.permissions) || {};
}

export function isLoggedIn() {
  return !!getToken();
}

export function hasPerm(module, action = "view") {
  const p = getPerms();
  return (p[module] || []).includes(action);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
