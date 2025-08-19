import React, { useState, useEffect } from 'react';
import { blockchainAPI } from '../services/api';
import { Wallet, Search, RefreshCw, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './BalanceChecker.module.css';

const BalanceChecker: React.FC = () => {
  const [searchAddress, setSearchAddress] = useState('');
  const [searchResult, setSearchResult] = useState<{ address: string; balance: number } | null>(null);
  const [allBalances, setAllBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);

  const fetchAllBalances = async () => {
    setLoadingAll(true);
    try {
      const balances = await blockchainAPI.getAllBalances();
      setAllBalances(balances);
    } catch (error) {
      console.error('Error fetching all balances:', error);
      toast.error('Failed to fetch balances');
    } finally {
      setLoadingAll(false);
    }
  };

  useEffect(() => {
    fetchAllBalances();
    
    // Refresh balances every 10 seconds
    const interval = setInterval(fetchAllBalances, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchAddress.trim()) {
      toast.error('Please enter an address');
      return;
    }

    setLoading(true);
    try {
      const result = await blockchainAPI.getBalance(searchAddress.trim());
      setSearchResult(result);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch balance');
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSearch = (address: string) => {
    setSearchAddress(address);
    handleSearchBalance({ preventDefault: () => {} } as React.FormEvent);
  };

  const getFilteredBalances = () => {
    return Object.entries(allBalances)
      .filter(([address, balance]) => balance > 0 && address !== 'SYSTEM')
      .sort(([, a], [, b]) => b - a); // Sort by balance descending
  };

  const getTotalCirculatingSupply = () => {
    return Object.entries(allBalances)
      .filter(([address]) => address !== 'SYSTEM')
      .reduce((total, [, balance]) => total + balance, 0);
  };

  const filteredBalances = getFilteredBalances();
  const circulatingSupply = getTotalCirculatingSupply();

  return (
    <div className="card">
      <div className={styles.header}>
        <h2 className="text-xl font-semibold mb-2">💰 Balance Checker</h2>
        <p className="text-gray text-sm mb-6">Check account balances and view all addresses</p>
      </div>

      {/* Search Section */}
      <div className={styles.searchSection}>
        <form onSubmit={handleSearchBalance} className={styles.searchForm}>
          <div className="form-group">
            <label htmlFor="searchAddress" className="label">
              Search Address
            </label>
            <div className={styles.searchInput}>
              <input
                type="text"
                id="searchAddress"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                placeholder="e.g., Alice"
                className="input"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Search size={16} />
                )}
              </button>
            </div>
          </div>
        </form>

        {searchResult && (
          <div className={`${styles.searchResult} animate-fadeIn`}>
            <div className={styles.balanceCard}>
              <div className={styles.balanceInfo}>
                <Wallet size={20} />
                <div>
                  <div className={styles.balanceAddress}>{searchResult.address}</div>
                  <div className={styles.balanceAmount}>{searchResult.balance.toFixed(2)} coins</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className={styles.summarySection}>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <TrendingUp size={20} className="text-primary" />
            <div>
              <div className={styles.summaryValue}>{filteredBalances.length}</div>
              <div className={styles.summaryLabel}>Active Addresses</div>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <Wallet size={20} className="text-secondary" />
            <div>
              <div className={styles.summaryValue}>{circulatingSupply.toFixed(2)}</div>
              <div className={styles.summaryLabel}>Circulating Supply</div>
            </div>
          </div>
        </div>
      </div>

      {/* All Balances Section */}
      <div className={styles.balancesSection}>
        <div className={styles.balancesHeader}>
          <h3 className="text-lg font-semibold">All Account Balances</h3>
          <button
            onClick={fetchAllBalances}
            disabled={loadingAll}
            className="btn btn-outline btn-sm"
          >
            {loadingAll ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Refresh
          </button>
        </div>

        {loadingAll ? (
          <div className={styles.loadingState}>
            <RefreshCw size={24} className="animate-spin" />
            <p>Loading balances...</p>
          </div>
        ) : filteredBalances.length === 0 ? (
          <div className={styles.emptyState}>
            <Wallet size={48} />
            <p>No account balances found</p>
            <p className="text-sm text-gray">Start by adding some transactions</p>
          </div>
        ) : (
          <div className={styles.balancesList}>
            {filteredBalances.map(([address, balance]) => (
              <div
                key={address}
                className={styles.balanceItem}
                onClick={() => handleQuickSearch(address)}
              >
                <div className={styles.balanceItemInfo}>
                  <Wallet size={16} />
                  <span className={styles.addressName}>{address}</span>
                </div>
                <div className={styles.balanceItemAmount}>
                  {balance.toFixed(2)} coins
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Search Buttons */}
        {filteredBalances.length > 0 && (
          <div className={styles.quickSearchSection}>
            <p className="text-sm text-gray mb-2">Quick search:</p>
            <div className={styles.quickSearchButtons}>
              {filteredBalances.slice(0, 5).map(([address]) => (
                <button
                  key={address}
                  onClick={() => handleQuickSearch(address)}
                  className="btn btn-outline btn-sm"
                >
                  {address}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BalanceChecker; 