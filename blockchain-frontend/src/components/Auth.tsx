import React, { useEffect, useState } from 'react';
import { blockchainAPI } from '../services/api';
import { authStore } from '../store/auth';
import toast from 'react-hot-toast';

const Auth: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedPub, setGeneratedPub] = useState<string | null>(null);
  const [generatedPriv, setGeneratedPriv] = useState<string | null>(null);

  useEffect(() => {
    const saved = authStore.getState().email;
    if (saved) setEmail(saved);
  }, []);

  const showWelcome = async (email: string) => {
    try {
      const profile = await blockchainAPI.getUserName(email);
      if (profile?.name) toast.success(`Welcome, ${profile.name}!`);
    } catch {}
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Enter email and password');
    setLoading(true);
    setGeneratedPub(null);
    setGeneratedPriv(null);
    try {
      const res = await blockchainAPI.signup(email.trim(), password, name?.trim() || undefined);
      if (res.status === 'success') {
        toast.success('Registered, keys generated, and funded with 4500 coins');
        authStore.setAuth(email.trim(), res.publicKey ?? null, res.privateKey ?? null);
        setGeneratedPub(res.publicKey ?? null);
        setGeneratedPriv(res.privateKey ?? null);
        await showWelcome(email.trim());
      } else {
        toast.error(res.message || 'Signup failed');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Enter email and password');
    setLoading(true);
    setGeneratedPub(null);
    setGeneratedPriv(null);
    try {
      const res = await blockchainAPI.login(email.trim(), password);
      if (res.status === 'success') {
        toast.success(`Login successful${res.balance !== undefined ? ` — Balance: ${res.balance}` : ''}`);
        authStore.setAuth(email.trim(), res.publicKey ?? null, null);
        await showWelcome(email.trim());
      } else {
        toast.error(res.message || 'Login failed');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="card" style={{ maxWidth: 480, margin: '0 auto' }}>
        <h1 className="text-2xl font-semibold mb-2">{mode === 'signup' ? 'Create Account' : 'Login'}</h1>
        <p className="text-gray mb-6">{mode === 'signup' ? 'Sign up to receive 4500 coins' : 'Sign in to continue'}</p>

        <form onSubmit={mode === 'signup' ? handleSignup : handleLogin}>
          <div className="form-group">
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} placeholder="you@example.com" />
          </div>
          {mode === 'signup' && (
            <div className="form-group">
              <label className="label" htmlFor="name">Name</label>
              <input id="name" type="text" className="input" value={name} onChange={e => setName(e.target.value)} disabled={loading} placeholder="User 1" />
            </div>
          )}
          <div className="form-group">
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} placeholder="••••••••" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {mode === 'signup' ? 'Sign Up' : 'Login'}
          </button>
        </form>

        {generatedPub && (
          <div className="mt-4">
            <div className="text-sm">Your Public Key</div>
            <div className="card" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{generatedPub}</div>
            <div className="text-sm" style={{ marginTop: 8 }}>Your Private Key (store safely)</div>
            <div className="card" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{generatedPriv}</div>
          </div>
        )}

        <div className="mt-4 text-sm">
          {mode === 'signup' ? (
            <span>Already have an account? <button className="btn btn-outline" onClick={() => setMode('login')} disabled={loading}>Login</button></span>
          ) : (
            <span>New here? <button className="btn btn-outline" onClick={() => setMode('signup')} disabled={loading}>Create account</button></span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth; 