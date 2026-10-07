// A customer's "folio session": after the owner confirms ONE correction with the
// emailed code, the server hands back a short-lived token for that customer. While
// it is live, further corrections on the same customer need no new code. The
// server checks the token on every use (owner, company, customer and expiry) —
// this file only remembers it for the browser tab.
const KEY = "wc.folioSessions";
const PREFIX = "folio.";

type Stored = Record<string, { token: string; exp: number }>;

function read(): Stored {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function write(s: Stored) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private mode — the session simply won't be remembered */
  }
}

/** Remember a token the server returned. The customer and expiry are read from the token itself. */
export function saveFolioToken(token?: string | null): void {
  if (!token || !token.startsWith(PREFIX)) return;
  try {
    const body = token.slice(PREFIX.length).split(".")[0].replace(/-/g, "+").replace(/_/g, "/");
    const t = JSON.parse(atob(body));
    if (!t?.c || !t?.exp) return;
    const s = read();
    s[t.c] = { token, exp: Number(t.exp) };
    write(s);
  } catch {
    /* unreadable token — ignore */
  }
}

/** The live token for this customer, or null (a minute of slack so it can't expire mid-request). */
export function getFolioToken(customerId?: string | null): string | null {
  if (!customerId) return null;
  const s = read();
  const hit = s[customerId];
  if (!hit) return null;
  if (hit.exp - 60_000 <= Date.now()) {
    delete s[customerId];
    write(s);
    return null;
  }
  return hit.token;
}

export function folioMinutesLeft(customerId?: string | null): number {
  if (!customerId || !getFolioToken(customerId)) return 0;
  return Math.max(1, Math.round((read()[customerId].exp - Date.now()) / 60_000));
}

export function clearFolioToken(customerId?: string | null): void {
  if (!customerId) return;
  const s = read();
  delete s[customerId];
  write(s);
}
