import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import MiningPanel from './components/MiningPanel';
import BalanceChecker from './components/BalanceChecker';
import './styles/global.css';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Function to trigger refresh of all components when blockchain changes
  const handleBlockchainUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="app">
      {/* Dashboard - Always at top */}
      <Dashboard key={`dashboard-${refreshKey}`} />
      
      <div className="container">
        {/* Main Content Grid */}
        <div className="grid grid-2 mt-8 mb-8">
          <TransactionForm onTransactionAdded={handleBlockchainUpdate} />
          <MiningPanel onBlockMined={handleBlockchainUpdate} />
        </div>

        {/* Balance Checker - Full Width */}
        <div className="mb-8">
          <BalanceChecker key={`balance-${refreshKey}`} />
        </div>

        {/* Footer Information */}
        <div className="card text-center mb-8">
          <h2 className="text-xl font-semibold mb-4">🔗 Blockchain Payment Ledger</h2>
          <p className="text-gray mb-4">
            A complete blockchain implementation with Java backend and React frontend.
            All data is stored and managed by the Java backend - no hardcoded values!
          </p>
          
          <div className="grid grid-3">
            <div className="info-section">
              <h3 className="font-semibold text-primary mb-2">💸 Transactions</h3>
              <p className="text-sm text-gray">
                Create transactions with balance validation and double-spend prevention
              </p>
            </div>
            
            <div className="info-section">
              <h3 className="font-semibold text-secondary mb-2">⛏️ Mining</h3>
              <p className="text-sm text-gray">
                Proof-of-Work mining with configurable difficulty and mining rewards
              </p>
            </div>
            
            <div className="info-section">
              <h3 className="font-semibold text-warning mb-2">💰 Balances</h3>
              <p className="text-sm text-gray">
                Real-time balance tracking and account management
              </p>
            </div>
          </div>

          <div className="status status-info mt-4">
            <span>Backend: Java Spring Boot | Frontend: React TypeScript | Database: In-Memory Java Collections</span>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--bg-primary)',
            color: 'var(--gray-800)',
            border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-lg)',
          },
          success: {
            iconTheme: {
              primary: 'var(--success)',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--danger)',
              secondary: 'white',
            },
          },
        }}
      />
    </div>
  );
}

export default App;
