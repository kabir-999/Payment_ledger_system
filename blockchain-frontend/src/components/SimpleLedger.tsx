import React, { useState, useMemo, useEffect } from 'react';
import { blockchainAPI } from '../services/api';
import type { Transaction } from '../types/blockchain';
import { Send, Loader, CheckCircle2, Clock, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { authStore } from '../store/auth';

const CURRENCY = 'ETH';

type PubKeyCache = Record<string, string | null>;

const SimpleLedger: React.FC = () => {
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastTx, setLastTx] = useState<Transaction | null>(null);
  const [status, setStatus] = useState<'idle' | 'pending' | 'mining' | 'confirmed' | 'error'>('idle');
  const [history, setHistory] = useState<Transaction[]>([]);
  const [currentEmail, setCurrentEmail] = useState<string | null>(authStore.getState().email);
  const [pubKeyCache, setPubKeyCache] = useState<PubKeyCache>({});
  const [myBalance, setMyBalance] = useState<number | null>(null);
  const [myHistory, setMyHistory] = useState<Transaction[]>([]);

  useEffect(() => {
    const unsub = authStore.subscribe(s => {
      setCurrentEmail(s.email);
      if (s.email) setSender(s.email);
      if (s.email) loadMyHistory(s.email);
    });
    const savedEmail = authStore.getState().email;
    if (savedEmail) {
      setSender(savedEmail);
      loadMyHistory(savedEmail);
    }
    return () => unsub();
  }, []);

  const isDisabled = useMemo(() => {
    return isSubmitting || !sender || !receiver || !amount || sender === receiver || parseFloat(amount) <= 0;
  }, [isSubmitting, sender, receiver, amount]);

  const fetchAndCachePubKey = async (email: string) => {
    if (!email || email === 'SYSTEM' || pubKeyCache[email] !== undefined) return;
    try {
      const res = await blockchainAPI.getUserPublicKey(email);
      setPubKeyCache(prev => ({ ...prev, [email]: res.publicKey ?? null }));
    } catch {
      setPubKeyCache(prev => ({ ...prev, [email]: null }));
    }
  };

  const refreshMyBalance = async () => {
    try {
      if (currentEmail) {
        const b = await blockchainAPI.getBalance(currentEmail.trim());
        setMyBalance(typeof b.balance === 'number' ? b.balance : null);
      } else {
        setMyBalance(null);
      }
    } catch {
      setMyBalance(null);
    }
  };

  useEffect(() => {
    refreshMyBalance();
  }, [currentEmail]);

  const loadHistory = async (a: string, b: string) => {
    try {
      const h = await blockchainAPI.getTransactionHistory(a);
      const filtered = h.filter(t => (t.sender === a && t.receiver === b) || (t.sender === b && t.receiver === a));
      filtered.sort((x, y) => new Date(y.timestamp).getTime() - new Date(x.timestamp).getTime());
      const latest = filtered.slice(0, 5);
      setHistory(latest);
      // prefetch pubkeys for shown txs
      latest.forEach(t => {
        fetchAndCachePubKey(t.sender);
        fetchAndCachePubKey(t.receiver);
      });
    } catch {}
  };

  const loadMyHistory = async (address: string) => {
    if (!address) return;
    try {
      const h = await blockchainAPI.getTransactionHistory(address);
      h.sort((x, y) => new Date(y.timestamp).getTime() - new Date(x.timestamp).getTime());
      setMyHistory(h.slice(0, 10));
    } catch {
      setMyHistory([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (Number.isNaN(amt) || amt <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    setStatus('pending');
    setLastTx(null);

    try {
      const addRes = await blockchainAPI.addTransaction(sender.trim(), receiver.trim(), amt);
      if (addRes.status !== 'success') {
        setStatus('error');
        toast.error(addRes.message || 'Failed to add transaction');
        setIsSubmitting(false);
        return;
      }

      toast.success('Payment submitted (pending confirmation)');
      setStatus('mining');

      const mine = await blockchainAPI.mineBlock('Miner1');
      if (mine?.status === 'success') {
        const tx = mine.block.transactions.find(t => !t.coinbase && ((t.sender === sender && t.receiver === receiver) || (t.sender === receiver && t.receiver === sender)));
        if (tx) setLastTx(tx);
        setStatus('confirmed');
        await refreshMyBalance();
        if (currentEmail) await loadMyHistory(currentEmail);
        toast.success('Payment confirmed on-chain');
      } else {
        setStatus('error');
        toast.error('Mining failed');
      }

      await loadHistory(sender.trim(), receiver.trim());
    } catch (err: any) {
      setStatus('error');
      toast.error(err?.response?.data?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const logout = () => {
    authStore.setAuth(null, null, null);
    toast.success('Logged out');
  };

  const renderPub = (email: string) => {
    const key = pubKeyCache[email];
    if (email === 'SYSTEM') return 'SYSTEM';
    if (key === undefined) return '—';
    return key || 'N/A';
  };

  const formatAmountForMe = (tx: Transaction) => {
    if (!currentEmail) return `${tx.amount} ${CURRENCY}`;
    const sign = tx.receiver === currentEmail ? '+' : (tx.sender === currentEmail ? '-' : '');
    return `${sign}${tx.amount} ${CURRENCY}`;
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="card" style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="text-2xl font-semibold mb-2">Simple Payment</h1>
          {currentEmail && (
            <div className="text-sm">
              Signed in as <strong>{currentEmail}</strong>
              <button className="btn btn-outline" style={{ marginLeft: 8 }} onClick={logout}><LogOut size={14}/> Logout</button>
            </div>
          )}
        </div>
        <p className="text-gray mb-6">Send a payment using names/emails. History displays corresponding public keys.</p>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-3">
            <div className="form-group">
              <label className="label" htmlFor="sender">From (User 1)</label>
              <input id="sender" className="input" value={sender} onChange={e => setSender(e.target.value)} placeholder="you@example.com" disabled={isSubmitting || !!currentEmail} />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="receiver">To (User 2)</label>
              <input id="receiver" className="input" value={receiver} onChange={e => setReceiver(e.target.value)} placeholder="friend@example.com" disabled={isSubmitting} />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="amount">Amount ({CURRENCY})</label>
              <input id="amount" type="number" step="0.01" min="0.01" className="input" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`0.00 ${CURRENCY}`} disabled={isSubmitting} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={isDisabled}>
            {isSubmitting ? (<><Loader size={16} className="animate-spin" /> Processing...</>) : (<><Send size={16} /> Send Payment</>)}
          </button>
        </form>

        {currentEmail && (
          <div className="mt-4 grid" style={{ gridTemplateColumns: '1fr', gap: '0.75rem' }}>
            <div className="card" style={{ padding: '0.75rem' }}>
              <div className="text-xs text-gray">Your balance</div>
              <div style={{ fontWeight: 700 }}>{myBalance ?? '—'}</div>
            </div>
          </div>
        )}

        {currentEmail && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Your Mini Ledger</h3>
            {myHistory.length === 0 ? (
              <div className="text-sm text-gray">No transactions yet.</div>
            ) : (
              <div className="grid" style={{ gap: '0.5rem' }}>
                {myHistory.map(tx => (
                  <div key={tx.transactionId} className="card" style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 6 }}>
                      <div className="text-xs text-gray">Amount</div>
                      <div style={{ textAlign: 'right', fontWeight: 700 }}>{formatAmountForMe(tx)}</div>

                      <div className="text-xs text-gray">Timestamp</div>
                      <div style={{ textAlign: 'right' }}>{new Date(tx.timestamp).toLocaleString()}</div>

                      <div className="text-xs text-gray">Transaction ID</div>
                      <div style={{ textAlign: 'right', fontFamily: 'monospace' }}>{tx.transactionId}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}



        {lastTx && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Last Confirmed Payment</h3>
            <div className="card">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 6 }}>
                <div className="text-xs text-gray">Sender (pubkey)</div>
                <div style={{ textAlign: 'right', wordBreak: 'break-all', fontFamily: 'monospace' }}>{renderPub(lastTx.sender)}</div>
                <div className="text-xs text-gray">Receiver (pubkey)</div>
                <div style={{ textAlign: 'right', wordBreak: 'break-all', fontFamily: 'monospace' }}>{renderPub(lastTx.receiver)}</div>
                <div className="text-xs text-gray">Amount</div>
                <div style={{ textAlign: 'right', fontWeight: 700 }}>{lastTx.amount} {CURRENCY}</div>
                <div className="text-xs text-gray">Timestamp</div>
                <div style={{ textAlign: 'right' }}>{new Date(lastTx.timestamp).toLocaleString()}</div>
                <div className="text-xs text-gray">Signature</div>
                <div style={{ textAlign: 'right', fontFamily: 'monospace' }}>{lastTx.transactionId}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleLedger; 