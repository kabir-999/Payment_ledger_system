export type AuthState = {
  email: string | null;
  publicKey?: string | null;
  privateKey?: string | null;
};

const KEY_EMAIL = 'ledger_auth_email';
const KEY_PUB = 'ledger_auth_pubkey';
const KEY_PRIV = 'ledger_auth_privkey';

class AuthStore {
  private state: AuthState = { email: null, publicKey: null, privateKey: null };
  private listeners: Array<(s: AuthState) => void> = [];

  constructor() {
    try {
      const savedEmail = localStorage.getItem(KEY_EMAIL);
      const savedPub = localStorage.getItem(KEY_PUB);
      const savedPriv = localStorage.getItem(KEY_PRIV);
      if (savedEmail) this.state.email = savedEmail;
      if (savedPub) this.state.publicKey = savedPub;
      if (savedPriv) this.state.privateKey = savedPriv;
    } catch {}
  }

  getState() {
    return this.state;
  }

  subscribe(listener: (s: AuthState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  setAuth(email: string | null, publicKey?: string | null, privateKey?: string | null) {
    this.state = { email, publicKey: publicKey ?? null, privateKey: privateKey ?? null };
    try {
      if (email) localStorage.setItem(KEY_EMAIL, email); else localStorage.removeItem(KEY_EMAIL);
      if (publicKey) localStorage.setItem(KEY_PUB, publicKey); else localStorage.removeItem(KEY_PUB);
      if (privateKey) localStorage.setItem(KEY_PRIV, privateKey); else localStorage.removeItem(KEY_PRIV);
    } catch {}
    this.listeners.forEach(l => l(this.state));
  }

  setEmail(email: string | null) {
    this.setAuth(email, this.state.publicKey ?? null, this.state.privateKey ?? null);
  }

  setKeys(publicKey: string | null, privateKey: string | null) {
    this.setAuth(this.state.email, publicKey, privateKey);
  }
}

export const authStore = new AuthStore(); 