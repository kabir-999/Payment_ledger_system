import axios from 'axios';
import type { Block, BlockchainStats, Balance, MiningResponse, ValidationResponse, Transaction } from '../types/blockchain';

const API_BASE_URL = 'http://localhost:8080/api/ledger';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const blockchainAPI = {
  // Auth-like endpoints stored on-chain
  signup: async (email: string, password: string, name?: string) => {
    const response = await api.post('/signup', null, {
      params: { email, password, ...(name ? { name } : {}) },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data as { status: string; message: string; blockIndex?: number; publicKey?: string; privateKey?: string };
  },
  login: async (email: string, password: string) => {
    const response = await api.post('/login', null, {
      params: { email, password },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data as { status: string; message: string; balance?: number; publicKey?: string };
  },
  getUserName: async (email: string) => {
    const response = await api.get('/user/name', { params: { email } });
    return response.data as { email: string; name?: string };
  },
  getUserPublicKey: async (email: string) => {
    const response = await api.get('/user/public-key', { params: { email } });
    return response.data as { email: string; publicKey?: string };
  },

  // Get blockchain statistics
  getStats: async (): Promise<BlockchainStats> => {
    const response = await api.get('/stats');
    return response.data;
  },

  // Get complete blockchain
  getBlockchain: async (): Promise<Block[]> => {
    const response = await api.get('/chain');
    return response.data;
  },

  // Add a new transaction
  addTransaction: async (sender: string, receiver: string, amount: number) => {
    const response = await api.post('/transaction', null, {
      params: { sender, receiver, amount },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  // Add transaction with JSON body
  addTransactionJSON: async (sender: string, receiver: string, amount: number) => {
    const response = await api.post('/transaction/json', {
      sender,
      receiver,
      amount,
    });
    return response.data;
  },

  // Mine a new block
  mineBlock: async (minerAddress: string): Promise<MiningResponse> => {
    const response = await api.post('/mine', null, {
      params: { minerAddress },
    });
    return response.data;
  },

  // Get pending transactions
  getPendingTransactions: async (): Promise<Transaction[]> => {
    const response = await api.get('/pending');
    return response.data;
  },

  // Validate blockchain
  validateChain: async (): Promise<ValidationResponse> => {
    const response = await api.get('/validate');
    return response.data;
  },

  // Get balance for specific address
  getBalance: async (address: string): Promise<Balance> => {
    const response = await api.get(`/balance/${address}`);
    return response.data;
  },

  // Get all balances
  getAllBalances: async (): Promise<Record<string, number>> => {
    const response = await api.get('/balances');
    return response.data;
  },

  // Get transaction history for address
  getTransactionHistory: async (address: string): Promise<Transaction[]> => {
    const response = await api.get(`/history/${address}`);
    return response.data;
  },

  // Get specific block by index
  getBlock: async (index: number): Promise<Block> => {
    const response = await api.get(`/block/${index}`);
    return response.data;
  },

  // Initialize sample data
  initSampleData: async () => {
    const response = await api.post('/init-sample-data');
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },
}; 