import React, { useState, useEffect } from 'react';
import { blockchainAPI } from '../services/api';
import type { Transaction } from '../types/blockchain';
import { Pickaxe, Loader, Clock, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './MiningPanel.module.css';

interface MiningPanelProps {
  onBlockMined?: () => void;
}

const MiningPanel: React.FC<MiningPanelProps> = ({ onBlockMined }) => {
  const [minerAddress, setMinerAddress] = useState('Miner1');
  const [mining, setMining] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [miningTime, setMiningTime] = useState<number | null>(null);

  const fetchPendingTransactions = async () => {
    try {
      const transactions = await blockchainAPI.getPendingTransactions();
      setPendingTransactions(transactions);
    } catch (error) {
      console.error('Error fetching pending transactions:', error);
    }
  };

  useEffect(() => {
    fetchPendingTransactions();
    
    // Refresh pending transactions every 5 seconds
    const interval = setInterval(fetchPendingTransactions, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleMineBlock = async () => {
    if (!minerAddress.trim()) {
      toast.error('Please enter a miner address');
      return;
    }

    if (pendingTransactions.length === 0) {
      toast.error('No pending transactions to mine');
      return;
    }

    setMining(true);
    const startTime = Date.now();

    try {
      const result = await blockchainAPI.mineBlock(minerAddress);
      const endTime = Date.now();
      const actualMiningTime = endTime - startTime;
      
      setMiningTime(result.miningTime || actualMiningTime);
      
      toast.success(
        `Block #${result.blockIndex} mined successfully! ` +
        `Hash: ${result.blockHash.substring(0, 16)}... ` +
        `(${result.miningTime}ms, nonce: ${result.nonce})`
      );

      // Refresh pending transactions and notify parent
      await fetchPendingTransactions();
      onBlockMined?.();
      
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to mine block');
    } finally {
      setMining(false);
      setTimeout(() => setMiningTime(null), 5000); // Clear mining time after 5 seconds
    }
  };

  const initializeSampleData = async () => {
    try {
      const result = await blockchainAPI.initSampleData();
      toast.success(result.message);
      await fetchPendingTransactions();
      onBlockMined?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to initialize sample data');
    }
  };

  return (
    <div className="card">
      <div className={styles.header}>
        <h2 className="text-xl font-semibold mb-2">⛏️ Mining Operations</h2>
        <p className="text-gray text-sm mb-6">Mine blocks and manage the blockchain</p>
      </div>

      <div className={styles.minerSection}>
        <div className="form-group">
          <label htmlFor="minerAddress" className="label">
            Miner Address
          </label>
          <input
            type="text"
            id="minerAddress"
            value={minerAddress}
            onChange={(e) => setMinerAddress(e.target.value)}
            placeholder="e.g., Miner1"
            className="input"
            disabled={mining}
          />
        </div>

        <div className={styles.actionButtons}>
          <button
            onClick={handleMineBlock}
            disabled={mining || pendingTransactions.length === 0}
            className={`btn btn-primary ${mining ? styles.mining : ''}`}
          >
            {mining ? (
              <>
                <Loader size={16} className="animate-spin" />
                Mining Block...
              </>
            ) : (
              <>
                <Pickaxe size={16} />
                Mine Block ({pendingTransactions.length} pending)
              </>
            )}
          </button>

          <button
            onClick={initializeSampleData}
            disabled={mining}
            className="btn btn-outline"
          >
            <Users size={16} />
            Initialize Sample Data
          </button>
        </div>
      </div>

      {miningTime && (
        <div className={`${styles.miningResult} animate-fadeIn`}>
          <div className="status status-success">
            <Clock size={16} />
            Block mined in {miningTime}ms
          </div>
        </div>
      )}

      <div className={styles.pendingSection}>
        <h3 className="text-lg font-semibold mb-3">
          Pending Transactions ({pendingTransactions.length})
        </h3>
        
        {pendingTransactions.length === 0 ? (
          <div className={styles.emptyState}>
            <p className="text-gray text-center">No pending transactions</p>
            <p className="text-sm text-gray text-center mt-1">
              Add some transactions to start mining
            </p>
          </div>
        ) : (
          <div className={styles.transactionList}>
            {pendingTransactions.map((tx, index) => (
              <div key={tx.transactionId} className={styles.transactionItem}>
                <div className={styles.transactionInfo}>
                  <span className={styles.transactionFlow}>
                    {tx.sender} → {tx.receiver}
                  </span>
                  <span className={styles.transactionAmount}>
                    {tx.amount} coins
                  </span>
                </div>
                <div className={styles.transactionMeta}>
                  <span className="text-xs text-gray">
                    {new Date(tx.timestamp).toLocaleTimeString()}
                  </span>
                  {tx.coinbase && (
                    <span className="status status-info">
                      Coinbase
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MiningPanel; 