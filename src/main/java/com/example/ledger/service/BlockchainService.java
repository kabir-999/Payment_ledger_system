package com.example.ledger.service;

import com.example.ledger.model.Block;
import com.example.ledger.model.Blockchain;
import com.example.ledger.model.Transaction;
import com.example.ledger.model.ChainSummary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class BlockchainService {

	private final Blockchain blockchain;
	private final List<Transaction> pendingTransactions;
	private final int miningDifficulty;
	private final double miningReward;

	public BlockchainService(@Value("${ledger.difficulty:4}") int miningDifficulty,
					   @Value("${ledger.miningReward:10.0}") double miningReward) {
		this.blockchain = new Blockchain();
		this.pendingTransactions = new ArrayList<>();
		this.miningDifficulty = miningDifficulty;
		this.miningReward = miningReward;
	}

	/**
	 * Directly add a prepared transaction to the pending pool (bypass balance checks).
	 * Used for system/register/grant/profile flows.
	 */
	public void addPendingDirect(Transaction tx) {
		pendingTransactions.add(tx);
	}

	/**
	 * Check if user already has a REGISTER transaction on-chain
	 */
	public boolean isUserRegistered(String email) {
		for (Block block : blockchain.getChain()) {
			for (Transaction tx : block.getTransactions()) {
				if (tx.isRegistration() && email.equals(tx.getReceiver())) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Verify provided password hash matches the last REGISTER record for the email
	 */
	public boolean verifyUserPassword(String email, String providedHash) {
		String lastHash = null;
		for (Block block : blockchain.getChain()) {
			for (Transaction tx : block.getTransactions()) {
				if (tx.isRegistration() && email.equals(tx.getReceiver())) {
					lastHash = tx.getData();
				}
			}
		}
		return lastHash != null && lastHash.equals(providedHash);
	}

	/**
	 * Store/update user profile name on-chain as PROFILE transaction (SYSTEM -> email, data=name)
	 */
	public void setUserName(String email, String name) {
		Transaction profile = new Transaction("SYSTEM", email, 0.0, "PROFILE", name);
		addPendingDirect(profile);
	}

	/**
	 * Get the latest user profile name for the email from chain
	 */
	public String getUserName(String email) {
		String lastName = null;
		for (Block block : blockchain.getChain()) {
			for (Transaction tx : block.getTransactions()) {
				if ("PROFILE".equals(tx.getType()) && email.equals(tx.getReceiver())) {
					lastName = tx.getData();
				}
			}
		}
		return lastName;
	}

	/**
	 * Store or update user's public key on-chain as PUBKEY transaction (SYSTEM -> email, data=publicKey)
	 */
	public void setUserPublicKey(String email, String publicKey) {
		Transaction pub = new Transaction("SYSTEM", email, 0.0, "PUBKEY", publicKey);
		addPendingDirect(pub);
	}

	/**
	 * Get the latest stored public key for a user from chain
	 */
	public String getUserPublicKey(String email) {
		String lastKey = null;
		for (Block block : blockchain.getChain()) {
			for (Transaction tx : block.getTransactions()) {
				if ("PUBKEY".equals(tx.getType()) && email.equals(tx.getReceiver())) {
					lastKey = tx.getData();
				}
			}
		}
		return lastKey;
	}

	/**
	 * Add a transaction to pending transactions pool
	 */
	public String addTransaction(String sender, String receiver, double amount) {
		// Validation
		if (sender == null || receiver == null) {
			return "Error: Sender and receiver cannot be null";
		}

		if (amount <= 0) {
			return "Error: Amount must be positive";
		}

		if (sender.equals(receiver)) {
			return "Error: Cannot send to yourself";
		}

		// Check if sender has sufficient effective balance (confirmed - pending out), except for SYSTEM
		if (!sender.equals("SYSTEM")) {
			double confirmed = getConfirmedBalance(sender);
			double pendingOut = getPendingOutgoing(sender);
			double effective = confirmed - pendingOut;
			if (effective < amount) {
				return "Error: Insufficient balance. Confirmed: " + confirmed + ", Pending out: " + pendingOut + ", Available: " + effective;
			}
		}

		Transaction transaction = new Transaction(sender, receiver, amount);
		pendingTransactions.add(transaction);

		return "Transaction added to pending pool. Transaction ID: " + transaction.getTransactionId();
	}

	/**
	 * Mine a new block with pending transactions
	 */
	public Block mineBlock(String minerAddress) {
		if (pendingTransactions.isEmpty()) {
			throw new RuntimeException("No pending transactions to mine");
		}

		// Add mining reward transaction (coinbase) so it persists as part of the chain
		Transaction rewardTransaction = new Transaction("SYSTEM", minerAddress, miningReward);
		List<Transaction> transactionsToMine = new ArrayList<>(pendingTransactions);
		transactionsToMine.add(rewardTransaction);

		// Create and "mine" the block
		Block newBlock = new Block(
			blockchain.getChain().size(),
			transactionsToMine,
			blockchain.getLatestBlock().getHash(),
			miningDifficulty
		);
		newBlock.mineBlock(miningDifficulty);

		// Append to blockchain (note: underlying model rebuilds block; PoW is educational here)
		blockchain.addBlock(transactionsToMine);

		// Clear pending transactions
		pendingTransactions.clear();

		return newBlock;
	}

	/**
	 * Get the complete blockchain
	 */
	public List<Block> getBlockchain() {
		return blockchain.getChain();
	}

	/**
	 * Get pending transactions
	 */
	public List<Transaction> getPendingTransactions() {
		return new ArrayList<>(pendingTransactions);
	}

	/**
	 * Validate the entire blockchain
	 */
	public boolean validateChain() {
		return blockchain.isChainValid();
	}

	/**
	 * Get blockchain summary
	 */
	public ChainSummary getChainSummary() {
		return new ChainSummary(
			blockchain.getChain().size(),
			blockchain.isChainValid(),
			blockchain.getLatestBlock().getHash()
		);
	}

	/**
	 * Confirmed balance from the chain (sum of received - sent over all blocks)
	 */
	private double getConfirmedBalance(String address) {
		double balance = 0.0;
		for (Block block : blockchain.getChain()) {
			for (Transaction tx : block.getTransactions()) {
				if (address.equals(tx.getReceiver())) {
					balance += tx.getAmount();
				}
				if (address.equals(tx.getSender())) {
					// exclude SYSTEM spends; only real addresses spend
					if (!"SYSTEM".equals(address)) {
						balance -= tx.getAmount();
					}
				}
			}
		}
		return balance;
	}

	/**
	 * Sum of pending outgoing transactions for an address
	 */
	private double getPendingOutgoing(String address) {
		double sum = 0.0;
		for (Transaction tx : pendingTransactions) {
			if (address.equals(tx.getSender())) {
				sum += tx.getAmount();
			}
		}
		return sum;
	}

	/**
	 * Public API: confirmed balance (chain-derived). Persist across refresh.
	 */
	public double getBalance(String address) {
		return getConfirmedBalance(address);
	}

	/**
	 * Get all confirmed balances by scanning the chain
	 */
	public Map<String, Double> getAllBalances() {
		Map<String, Double> balances = new HashMap<>();
		for (Block block : blockchain.getChain()) {
			for (Transaction tx : block.getTransactions()) {
				// credit receiver
				balances.put(tx.getReceiver(), balances.getOrDefault(tx.getReceiver(), 0.0) + tx.getAmount());
				// debit sender (except SYSTEM does not track a finite balance)
				if (!"SYSTEM".equals(tx.getSender())) {
					balances.put(tx.getSender(), balances.getOrDefault(tx.getSender(), 0.0) - tx.getAmount());
				}
			}
		}
		return balances;
	}

	/**
	 * Get transaction history for an address
	 */
	public List<Transaction> getTransactionHistory(String address) {
		List<Transaction> history = new ArrayList<>();

		for (Block block : blockchain.getChain()) {
			for (Transaction tx : block.getTransactions()) {
				if (tx.getSender().equals(address) || tx.getReceiver().equals(address)) {
					history.add(tx);
				}
			}
		}

		return history;
	}

	/**
	 * Get total number of transactions in the blockchain
	 */
	public int getTotalTransactions() {
		int total = 0;
		for (Block block : blockchain.getChain()) {
			total += block.getTransactions().size();
		}
		return total;
	}
}