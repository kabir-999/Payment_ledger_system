import React, { useState, useMemo, useEffect } from 'react';
import { blockchainAPI } from '../services/api';
import type { Transaction } from '../types/blockchain';
import { Send, Loader, CheckCircle2, Clock, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { authStore } from '../store/auth';
import TransactionStats from './TransactionStats';

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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
      position: 'relative',
      overflow: 'hidden',
      padding: '24px'
    }}>
      {/* Background gradient elements */}
      <div style={{
        position: 'absolute',
        width: '96px',
        height: '96px',
        background: '#9333ea',
        borderRadius: '50%',
        filter: 'blur(48px)',
        top: '10%',
        left: '5%',
        zIndex: 0
      }}></div>
      <div style={{
        position: 'absolute',
        width: '128px',
        height: '128px',
        background: '#38bdf8',
        borderRadius: '50%',
        filter: 'blur(40px)',
        top: '70%',
        right: '5%',
        zIndex: 0
      }}></div>

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: 'white',
            margin: 0
          }}>
            Simple Payment
          </h1>
          {currentEmail && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              color: '#d1d5db',
              fontSize: '14px'
            }}>
              <span>Signed in as <strong>{currentEmail}</strong></span>
              <button
                onClick={logout}
                style={{
                  background: 'linear-gradient(to right, #3b82f6, #1d4ed8)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '32px',
          alignItems: 'start'
        }}>
          {/* Left Column - Payment Form + Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Payment Form */}
            <div style={{
              background: '#1f2937',
              padding: '32px',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '24px'
              }}>
                Send Payment
              </h2>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#d1d5db',
                    marginBottom: '4px'
                  }} htmlFor="sender">
                    From (User 1)
                  </label>
                  <input
                    id="sender"
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
                    value={sender}
                    onChange={e => setSender(e.target.value)}
                    placeholder="you@example.com"
                    disabled={isSubmitting || !!currentEmail}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#d1d5db',
                    marginBottom: '4px'
                  }} htmlFor="receiver">
                    To (User 2)
                  </label>
                  <input
                    id="receiver"
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
                    value={receiver}
                    onChange={e => setReceiver(e.target.value)}
                    placeholder="friend@example.com"
                    disabled={isSubmitting}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#d1d5db',
                    marginBottom: '4px'
                  }} htmlFor="amount">
                    Amount ({CURRENCY})
                  </label>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
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
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder={`0.00 ${CURRENCY}`}
                    disabled={isSubmitting}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    disabled={isDisabled}
                    style={{
                      background: isDisabled ? '#6b7280' : 'linear-gradient(to right, #9333ea, #a855f7, #3b82f6)',
                      color: 'white',
                      padding: '8px 16px',
                      fontWeight: 'bold',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      opacity: isDisabled ? 0.6 : 1,
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Send Payment
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Balance Display */}
              {currentEmail && (
                <div style={{
                  marginTop: '24px',
                  padding: '16px',
                  background: '#374151',
                  borderRadius: '6px'
                }}>
                  <div style={{ fontSize: '12px', color: '#d1d5db', marginBottom: '4px' }}>
                    Your balance
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '24px', color: 'white' }}>
                    {myBalance ?? '—'}
                  </div>
                </div>
              )}

              {/* Status */}
              {status !== 'idle' && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: status === 'confirmed' ? '#065f46' : status === 'error' ? '#991b1b' : '#92400e',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'white',
                  fontSize: '14px'
                }}>
                  {status === 'pending' && <Clock size={16} />}
                  {status === 'mining' && <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                  {status === 'confirmed' && <CheckCircle2 size={16} />}
                  {status === 'error' && <span>⚠</span>}
                  {status === 'pending' && 'Pending submission'}
                  {status === 'mining' && 'Mining block...'}
                  {status === 'confirmed' && 'Confirmed on-chain'}
                  {status === 'error' && 'Error occurred'}
                </div>
              )}
            </div>

            {/* Transaction Stats Component */}
            <TransactionStats 
              transactions={myHistory}
              currentEmail={currentEmail}
            />
          </div>

          {/* Right Column - Mini Ledger */}
          <div style={{
            background: '#1f2937',
            padding: '32px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '24px'
            }}>
              Your Mini Ledger
            </h2>

            {myHistory.length === 0 ? (
              <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                No transactions yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {myHistory.map(tx => (
                  <div key={tx.transactionId} style={{
                    padding: '16px',
                    background: '#374151',
                    borderRadius: '6px',
                    border: '1px solid #4b5563'
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      fontSize: '12px'
                    }}>
                      <div style={{ color: '#d1d5db' }}>Amount</div>
                      <div style={{ 
                        textAlign: 'right', 
                        fontWeight: '700',
                        color: tx.receiver === currentEmail ? '#10b981' : '#ef4444'
                      }}>
                        {formatAmountForMe(tx)}
                      </div>

                      <div style={{ color: '#d1d5db' }}>Timestamp</div>
                      <div style={{ textAlign: 'right', color: '#9ca3af' }}>
                        {new Date(tx.timestamp).toLocaleString()}
                      </div>

                      <div style={{ color: '#d1d5db' }}>Transaction ID</div>
                      <div style={{ 
                        textAlign: 'right', 
                        fontFamily: 'monospace',
                        color: '#9ca3af',
                        fontSize: '10px',
                        wordBreak: 'break-all'
                      }}>
                        {tx.transactionId}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Public Keys Ledger - Full Width */}
        {history.length > 0 && (
          <div style={{
            marginTop: '32px',
            background: '#1f2937',
            padding: '32px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '24px'
            }}>
              Mini Ledger (public keys)
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {history.map(tx => (
                <div key={tx.transactionId} style={{
                  padding: '16px',
                  background: '#374151',
                  borderRadius: '6px',
                  border: '1px solid #4b5563'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    fontSize: '12px'
                  }}>
                    <div style={{ color: '#d1d5db' }}>Sender (pubkey)</div>
                    <div style={{ 
                      textAlign: 'right', 
                      wordBreak: 'break-all', 
                      fontFamily: 'monospace',
                      color: '#9ca3af',
                      fontSize: '10px'
                    }}>
                      {renderPub(tx.sender)}
                    </div>

                    <div style={{ color: '#d1d5db' }}>Receiver (pubkey)</div>
                    <div style={{ 
                      textAlign: 'right', 
                      wordBreak: 'break-all', 
                      fontFamily: 'monospace',
                      color: '#9ca3af',
                      fontSize: '10px'
                    }}>
                      {renderPub(tx.receiver)}
                    </div>

                    <div style={{ color: '#d1d5db' }}>Amount</div>
                    <div style={{ textAlign: 'right', fontWeight: '700', color: 'white' }}>
                      {tx.amount} {CURRENCY}
                    </div>

                    <div style={{ color: '#d1d5db' }}>Timestamp</div>
                    <div style={{ textAlign: 'right', color: '#9ca3af' }}>
                      {new Date(tx.timestamp).toLocaleString()}
                    </div>

                    <div style={{ color: '#d1d5db' }}>Signature</div>
                    <div style={{ 
                      textAlign: 'right', 
                      fontFamily: 'monospace',
                      color: '#9ca3af',
                      fontSize: '10px'
                    }}>
                      {tx.transactionId}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleLedger; 