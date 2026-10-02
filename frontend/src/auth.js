// Demo-only account storage (browser localStorage). The assignment does not require login;
// this just gates the dashboard. Passwords are stored as a SHA-256 hash, never in plain text.
export async function hashPassword(password) {
  if (window.crypto?.subtle) {
    const bytes = new TextEncoder().encode(password);
    const digest = await window.crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return `plain:${password}`; // crypto.subtle needs https or localhost; fine for a local demo
}

export const getUser = () => JSON.parse(localStorage.getItem("tradex_user") || "{}");
export const getAccount = () => JSON.parse(localStorage.getItem("tradex_account") || "null");
