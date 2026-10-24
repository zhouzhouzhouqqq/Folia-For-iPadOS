const crypto = require('node:crypto');

// electron/spotify/session.cjs
// The signed-in Spotify account as it is kept between runs: its tokens, and what the app shows of it.

const SESSION_KEY = 'SPOTIFY_SESSION_V1';

const isCredentials = value => Boolean(value && typeof value.access_token === 'string' && value.access_token
  && typeof value.refresh_token === 'string' && value.refresh_token && Number.isFinite(value.expires_at));
const isUser = value => Boolean(value && typeof value.id === 'string' && value.id && typeof value.nickname === 'string');

// The renderer shows and stores the account id, so it only ever sees a digest of Spotify's own name for the account.
const publicAccountId = username => crypto.createHash('sha256').update(`folia-spotify:${username}`).digest('hex').slice(0, 24);

// Spotify credentials stay in the main process, encrypted with the OS keychain when it is available.
function createSpotifySessionRepository({ store, safeStorage, log = (...args) => console.log(...args), warn = (...args) => console.warn(...args) }) {
  let loaded = false;
  let current = null;
  const canEncrypt = () => safeStorage?.isEncryptionAvailable()
    && safeStorage.getSelectedStorageBackend?.() !== 'basic_text';
  const persist = () => {
    try {
      if (!canEncrypt()) throw new Error('Encryption unavailable');
      store.set(SESSION_KEY, safeStorage.encryptString(JSON.stringify(current)).toString('base64'));
    } catch {
      store.delete(SESSION_KEY);
      warn('[Spotify] Sign-in is kept for this run only: OS encryption is unavailable');
    }
  };
  return {
    get() {
      if (loaded) return current;
      loaded = true;
      try {
        const sealed = store.get(SESSION_KEY);
        if (typeof sealed !== 'string') {
          log('[Spotify] No stored sign-in');
          return null;
        }
        if (!canEncrypt()) {
          warn('[Spotify] Stored sign-in cannot be read: OS encryption is unavailable');
          return null;
        }
        const value = JSON.parse(safeStorage.decryptString(Buffer.from(sealed, 'base64')));
        if (value.version === 1 && isCredentials(value.credentials) && isUser(value.user)) current = value;
      } catch { /* damaged, or sealed by another OS account: reported below */ }
      if (current) log('[Spotify] Stored sign-in restored');
      else warn('[Spotify] Stored sign-in could not be restored');
      return current;
    },
    set({ credentials, user }) {
      if (!isCredentials(credentials) || !isUser(user)) throw new Error('Invalid Spotify session');
      loaded = true;
      current = { version: 1, credentials: { ...credentials }, user: { ...user } };
      persist();
    },
    // A renewed access token, or the account read again, replaces what is stored; without a
    // session there is nothing to replace.
    update({ credentials, user }) {
      if (!this.get() || (credentials && !isCredentials(credentials)) || (user && !isUser(user))) return;
      current = { ...current, ...(credentials ? { credentials: { ...credentials } } : {}), ...(user ? { user: { ...user } } : {}) };
      persist();
    },
    clear() {
      loaded = true;
      current = null;
      store.delete(SESSION_KEY);
    },
  };
}

module.exports = { createSpotifySessionRepository, publicAccountId, SESSION_KEY };
