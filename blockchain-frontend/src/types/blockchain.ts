export interface Transaction {
  transactionId: string;
  sender: string;
  receiver: string;
  amount: number;
  timestamp: string;
  coinbase: boolean;
}

export interface Block {
  index: number;
  timestamp: string;
  transactions: Transaction[];
  previousHash: string;
  hash: string;
  nonce: number;
  difficulty: number;
  miningTime: number;
  validBlock: boolean;
  totalTransactionValue: number;
  transactionCount: number;
}

export interface BlockchainStats {
  totalBlocks: number;
  totalTransactions: number;
  pendingTransactions: number;
  isValid: boolean;
  latestBlockHash: string;
  latestBlockTimestamp: string;
  latestBlockTransactions: number;
}

export interface Balance {
  address: string;
  balance: number;
}

export interface ApiResponse<T> {
  status: string;
  message: string;
  data?: T;
}

export interface MiningResponse {
  status: string;
  message: string;
  block: Block;
  blockIndex: number;
  blockHash: string;
  miningTime: number;
  nonce: number;
}

export interface ValidationResponse {
  valid: boolean;
  message: string;
} 