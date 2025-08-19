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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background gradient elements */}
      <div style={{
        position: 'absolute',
        width: '96px',
        height: '96px',
        background: '#9333ea',
        borderRadius: '50%',
        filter: 'blur(48px)',
        top: '20%',
        left: '10%',
        zIndex: 0
      }}></div>
      <div style={{
        position: 'absolute',
        width: '128px',
        height: '128px',
        background: '#38bdf8',
        borderRadius: '50%',
        filter: 'blur(40px)',
        top: '60%',
        right: '10%',
        zIndex: 0
      }}></div>

      <div style={{
        maxWidth: '448px',
        width: '100%',
        margin: '0 auto',
        position: 'relative',
        zIndex: 10,
        background: '#1f2937',
        padding: '32px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          {mode === 'signup' ? 'Create Account' : 'Login'}
        </h2>

        <form onSubmit={mode === 'signup' ? handleSignup : handleLogin}>
          {mode === 'signup' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#d1d5db',
                marginBottom: '4px'
              }} htmlFor="name">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                style={{
                  marginTop: '4px',
                  padding: '8px',
                  width: '100%',
                  background: '#374151',
                  border: '1px solid #4b5563',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px'
                }}
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={loading}
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#d1d5db',
              marginBottom: '4px'
            }} htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              style={{
                marginTop: '4px',
                padding: '8px',
                width: '100%',
                background: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '6px',
                color: 'white',
                fontSize: '14px'
              }}
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
              placeholder="Enter your email"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#d1d5db',
              marginBottom: '4px'
            }} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              style={{
                marginTop: '4px',
                padding: '8px',
                width: '100%',
                background: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '6px',
                color: 'white',
                fontSize: '14px'
              }}
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
              placeholder="Enter your password"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'linear-gradient(to right, #9333ea, #a855f7, #3b82f6)',
                color: 'white',
                padding: '8px 16px',
                fontWeight: 'bold',
                borderRadius: '6px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                fontSize: '14px'
              }}
            >
              {loading ? 'Processing...' : (mode === 'signup' ? 'Create Account' : 'Login')}
            </button>
          </div>
        </form>

        {generatedPub && (
          <div style={{ marginTop: '16px', padding: '16px', background: '#374151', borderRadius: '6px' }}>
            <div style={{ fontSize: '12px', color: '#d1d5db', marginBottom: '8px' }}>Your Public Key</div>
            <div style={{ 
              fontFamily: 'monospace', 
              wordBreak: 'break-all', 
              fontSize: '12px',
              color: '#9ca3af',
              background: '#1f2937',
              padding: '8px',
              borderRadius: '4px'
            }}>
              {generatedPub}
            </div>
            <div style={{ fontSize: '12px', color: '#d1d5db', marginTop: '8px', marginBottom: '4px' }}>
              Your Private Key (store safely)
            </div>
            <div style={{ 
              fontFamily: 'monospace', 
              wordBreak: 'break-all', 
              fontSize: '12px',
              color: '#9ca3af',
              background: '#1f2937',
              padding: '8px',
              borderRadius: '4px'
            }}>
              {generatedPriv}
            </div>
          </div>
        )}

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px', color: '#9ca3af' }}>
          {mode === 'signup' ? (
            <span>
              Already have an account?{' '}
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#a855f7',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '14px'
                }}
                onClick={() => setMode('login')}
                disabled={loading}
              >
                Login
              </button>
            </span>
          ) : (
            <span>
              New here?{' '}
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#a855f7',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '14px'
                }}
                onClick={() => setMode('signup')}
                disabled={loading}
              >
                Create account
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth; 