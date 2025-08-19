import React, { useState, useMemo } from 'react';
import type { Transaction } from '../types/blockchain';
import { TrendingUp, TrendingDown, Calendar, Filter } from 'lucide-react';

const CURRENCY = 'ETH';

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom';

interface Stats {
  totalReceived: number;
  totalSpent: number;
  netAmount: number;
  transactionCount: number;
  averageAmount: number;
}

interface TransactionStatsProps {
  transactions: Transaction[];
  currentEmail: string | null;
}

const TransactionStats: React.FC<TransactionStatsProps> = ({ transactions, currentEmail }) => {
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const filteredTransactions = useMemo(() => {
    if (!currentEmail || transactions.length === 0) return [];
    
    const now = new Date();
    let startDate: Date | null = null;
    
    switch (dateFilter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          return transactions.filter(tx => {
            const txDate = new Date(tx.timestamp);
            return txDate >= start && txDate <= end;
          });
        }
        return transactions;
      default:
        return transactions;
    }
    
    if (startDate) {
      return transactions.filter(tx => new Date(tx.timestamp) >= startDate!);
    }
    
    return transactions;
  }, [transactions, dateFilter, customStartDate, customEndDate, currentEmail]);

  const stats = useMemo((): Stats => {
    if (!currentEmail || filteredTransactions.length === 0) {
      return {
        totalReceived: 0,
        totalSpent: 0,
        netAmount: 0,
        transactionCount: 0,
        averageAmount: 0
      };
    }

    const received = filteredTransactions
      .filter(tx => tx.receiver === currentEmail)
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const spent = filteredTransactions
      .filter(tx => tx.sender === currentEmail)
      .reduce((sum, tx) => sum + tx.amount, 0);

    return {
      totalReceived: received,
      totalSpent: spent,
      netAmount: received - spent,
      transactionCount: filteredTransactions.length,
      averageAmount: filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0) / filteredTransactions.length
    };
  }, [filteredTransactions, currentEmail]);

  return (
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
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <TrendingUp size={20} />
        Transaction Stats
      </h2>

      {/* Date Filter */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '500',
          color: '#d1d5db',
          marginBottom: '8px'
        }}>
          <Filter size={16} style={{ marginRight: '8px', display: 'inline' }} />
          Date Range
        </label>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as DateFilter)}
          style={{
            width: '100%',
            padding: '8px',
            background: '#374151',
            border: '1px solid #4b5563',
            borderRadius: '6px',
            color: 'white',
            fontSize: '14px',
            marginBottom: '8px'
          }}
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">This Month</option>
          <option value="custom">Custom Range</option>
        </select>

        {dateFilter === 'custom' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              style={{
                flex: 1,
                padding: '8px',
                background: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '6px',
                color: 'white',
                fontSize: '14px'
              }}
            />
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              style={{
                flex: 1,
                padding: '8px',
                background: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '6px',
                color: 'white',
                fontSize: '14px'
              }}
            />
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Total Received */}
        <div style={{
          padding: '16px',
          background: '#065f46',
          borderRadius: '6px',
          border: '1px solid #10b981'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <TrendingUp size={16} color="#10b981" />
            <span style={{ fontSize: '12px', color: '#d1fae5' }}>Total Received</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
            +{stats.totalReceived.toFixed(2)} {CURRENCY}
          </div>
        </div>

        {/* Total Spent */}
        <div style={{
          padding: '16px',
          background: '#991b1b',
          borderRadius: '6px',
          border: '1px solid #ef4444'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <TrendingDown size={16} color="#ef4444" />
            <span style={{ fontSize: '12px', color: '#fecaca' }}>Total Spent</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
            -{stats.totalSpent.toFixed(2)} {CURRENCY}
          </div>
        </div>

        {/* Net Amount */}
        <div style={{
          padding: '16px',
          background: stats.netAmount >= 0 ? '#065f46' : '#991b1b',
          borderRadius: '6px',
          border: `1px solid ${stats.netAmount >= 0 ? '#10b981' : '#ef4444'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <TrendingUp size={16} color={stats.netAmount >= 0 ? "#10b981" : "#ef4444"} />
            <span style={{ 
              fontSize: '12px', 
              color: stats.netAmount >= 0 ? '#d1fae5' : '#fecaca' 
            }}>
              Net Amount
            </span>
          </div>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: stats.netAmount >= 0 ? '#10b981' : '#ef4444' 
          }}>
            {stats.netAmount >= 0 ? '+' : ''}{stats.netAmount.toFixed(2)} {CURRENCY}
          </div>
        </div>

        {/* Transaction Count */}
        <div style={{
          padding: '16px',
          background: '#374151',
          borderRadius: '6px',
          border: '1px solid #4b5563'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Calendar size={16} color="#9ca3af" />
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Transactions</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
            {stats.transactionCount}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionStats; 