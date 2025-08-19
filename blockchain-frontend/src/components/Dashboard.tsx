import React, { useState, useEffect } from 'react';
import { blockchainAPI } from '../services/api';
import type { BlockchainStats } from '../types/blockchain';
import { Activity, Shield, Clock, Hash } from 'lucide-react';
import styles from './Dashboard.module.css';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<BlockchainStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const data = await blockchainAPI.getStats();
      setStats(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch blockchain statistics');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchStats, 10000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className="container">
          <div className="grid grid-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card loading">
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <div className="animate-pulse" style={{ width: 24, height: 24, background: '#e5e7eb' }} />
                  </div>
                  <div className={styles.statContent}>
                    <div className="animate-pulse" style={{ width: '60%', height: 20, background: '#e5e7eb', marginBottom: 8 }} />
                    <div className="animate-pulse" style={{ width: '40%', height: 16, background: '#e5e7eb' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboard}>
        <div className="container">
          <div className="card text-center">
            <div className="status status-error">
              <Shield size={16} />
              {error}
            </div>
            <button className="btn btn-primary mt-4" onClick={fetchStats}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className="container">
        <div className={`${styles.dashboardHeader} mb-8`}>
          <h1 className="text-3xl font-bold text-center mb-2">🔗 Blockchain Payment Ledger</h1>
          <p className="text-gray text-center">Real-time blockchain statistics and monitoring</p>
        </div>

        <div className="grid grid-4 mb-8">
          <div className="card animate-fadeIn">
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.primary}`}>
                <Activity size={24} />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{stats?.totalBlocks || 0}</div>
                <div className={styles.statLabel}>Total Blocks</div>
              </div>
            </div>
          </div>

          <div className="card animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.secondary}`}>
                <Hash size={24} />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{stats?.totalTransactions || 0}</div>
                <div className={styles.statLabel}>Total Transactions</div>
              </div>
            </div>
          </div>

          <div className="card animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.warning}`}>
                <Clock size={24} />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{stats?.pendingTransactions || 0}</div>
                <div className={styles.statLabel}>Pending Transactions</div>
              </div>
            </div>
          </div>

          <div className="card animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${stats?.isValid ? styles.success : styles.danger}`}>
                <Shield size={24} />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{stats?.isValid ? '✓' : '✗'}</div>
                <div className={styles.statLabel}>Chain Valid</div>
              </div>
            </div>
          </div>
        </div>

        {stats?.latestBlockHash && (
          <div className="card animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            <h3 className="text-lg font-semibold mb-4">Latest Block Information</h3>
            <div className="grid grid-2">
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>Block Hash</label>
                <code className={`${styles.infoValue} ${styles.hash}`}>{stats.latestBlockHash}</code>
              </div>
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>Timestamp</label>
                <span className={styles.infoValue}>
                  {new Date(stats.latestBlockTimestamp).toLocaleString()}
                </span>
              </div>
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>Transactions in Block</label>
                <span className={styles.infoValue}>{stats.latestBlockTransactions}</span>
              </div>
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>Last Updated</label>
                <span className={styles.infoValue}>{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 