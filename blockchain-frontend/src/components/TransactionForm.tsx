import React, { useState } from 'react';
import { blockchainAPI } from '../services/api';
import { Send, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './TransactionForm.module.css';

interface TransactionFormProps {
  onTransactionAdded?: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onTransactionAdded }) => {
  const [formData, setFormData] = useState({
    sender: '',
    receiver: '',
    amount: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sender || !formData.receiver || !formData.amount) {
      toast.error('Please fill in all fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (formData.sender === formData.receiver) {
      toast.error('Sender and receiver cannot be the same');
      return;
    }

    setLoading(true);
    
    try {
      const result = await blockchainAPI.addTransaction(
        formData.sender,
        formData.receiver,
        amount
      );

      if (result.status === 'success') {
        toast.success(result.message);
        setFormData({ sender: '', receiver: '', amount: '' });
        onTransactionAdded?.();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  const quickFillButtons = [
    { label: 'SYSTEM → Alice', sender: 'SYSTEM', receiver: 'Alice', amount: '100' },
    { label: 'Alice → Bob', sender: 'Alice', receiver: 'Bob', amount: '50' },
    { label: 'Bob → Charlie', sender: 'Bob', receiver: 'Charlie', amount: '25' },
  ];

  const handleQuickFill = (sender: string, receiver: string, amount: string) => {
    setFormData({ sender, receiver, amount });
  };

  return (
    <div className="card">
      <div className={styles.formHeader}>
        <h2 className="text-xl font-semibold mb-2">💸 Create Transaction</h2>
        <p className="text-gray text-sm mb-6">Add a new transaction to the pending pool</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.formRow}>
          <div className="form-group">
            <label htmlFor="sender" className="label">
              Sender Address
            </label>
            <input
              type="text"
              id="sender"
              name="sender"
              value={formData.sender}
              onChange={handleInputChange}
              placeholder="e.g., Alice"
              className="input"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="receiver" className="label">
              Receiver Address
            </label>
            <input
              type="text"
              id="receiver"
              name="receiver"
              value={formData.receiver}
              onChange={handleInputChange}
              placeholder="e.g., Bob"
              className="input"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="amount" className="label">
              Amount
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              className="input"
              disabled={loading}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`btn btn-primary ${loading ? styles.loading : ''}`}
        >
          {loading ? (
            <>
              <Loader size={16} className="animate-spin" />
              Adding Transaction...
            </>
          ) : (
            <>
              <Send size={16} />
              Add Transaction
            </>
          )}
        </button>
      </form>

      <div className={`${styles.quickFillSection} mt-6`}>
        <h3 className="text-sm font-semibold mb-3 text-gray">Quick Fill Examples</h3>
        <div className={styles.quickFillButtons}>
          {quickFillButtons.map((button, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleQuickFill(button.sender, button.receiver, button.amount)}
              className={`btn btn-outline ${styles.btnSm}`}
              disabled={loading}
            >
              {button.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TransactionForm; 