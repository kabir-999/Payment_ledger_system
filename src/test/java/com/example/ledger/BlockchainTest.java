package com.example.ledger;

import com.example.ledger.model.Block;
import com.example.ledger.model.Blockchain;
import com.example.ledger.model.Transaction;
import com.example.ledger.service.BlockchainService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class BlockchainTest {

    private BlockchainService blockchainService;
    private Blockchain blockchain;

    @BeforeEach
    void setUp() {
        blockchainService = new BlockchainService(4, 10.0);
        blockchain = new Blockchain();
    }

    @Test
    void testGenesisBlockCreation() {
        List<Block> chain = blockchain.getChain();
        assertNotNull(chain);
        assertEquals(1, chain.size());
        
        Block genesisBlock = chain.get(0);
        assertEquals(0, genesisBlock.getIndex());
        assertEquals("0", genesisBlock.getPreviousHash());
        assertNotNull(genesisBlock.getHash());
        assertFalse(genesisBlock.getHash().isEmpty());
    }

    @Test
    void testTransactionCreation() {
        Transaction transaction = new Transaction("Alice", "Bob", 50.0);
        
        assertNotNull(transaction.getTransactionId());
        assertEquals("Alice", transaction.getSender());
        assertEquals("Bob", transaction.getReceiver());
        assertEquals(50.0, transaction.getAmount());
        assertNotNull(transaction.getTimestamp());
        assertFalse(transaction.isCoinbase());
    }

    @Test
    void testCoinbaseTransaction() {
        Transaction coinbaseTransaction = new Transaction("SYSTEM", "Miner1", 10.0);
        assertTrue(coinbaseTransaction.isCoinbase());
    }

    @Test
    void testAddValidTransaction() {
        // First, add some initial balance
        String result1 = blockchainService.addTransaction("SYSTEM", "Alice", 100.0);
        assertTrue(result1.contains("Transaction added"));
        
        // Mine the block to update balances
        blockchainService.mineBlock("Miner1");
        
        // Now Alice should be able to send money
        String result2 = blockchainService.addTransaction("Alice", "Bob", 50.0);
        assertTrue(result2.contains("Transaction added"));
    }

    @Test
    void testAddInvalidTransaction() {
        // Test null sender
        String result1 = blockchainService.addTransaction(null, "Bob", 50.0);
        assertTrue(result1.startsWith("Error:"));
        
        // Test null receiver
        String result2 = blockchainService.addTransaction("Alice", null, 50.0);
        assertTrue(result2.startsWith("Error:"));
        
        // Test negative amount
        String result3 = blockchainService.addTransaction("Alice", "Bob", -10.0);
        assertTrue(result3.startsWith("Error:"));
        
        // Test zero amount
        String result4 = blockchainService.addTransaction("Alice", "Bob", 0.0);
        assertTrue(result4.startsWith("Error:"));
        
        // Test same sender and receiver
        String result5 = blockchainService.addTransaction("Alice", "Alice", 50.0);
        assertTrue(result5.startsWith("Error:"));
    }

    @Test
    void testInsufficientBalance() {
        String result = blockchainService.addTransaction("Alice", "Bob", 100.0);
        assertTrue(result.contains("Insufficient balance"));
    }

    @Test
    void testBlockMining() {
        // Add some transactions
        blockchainService.addTransaction("SYSTEM", "Alice", 100.0);
        blockchainService.addTransaction("SYSTEM", "Bob", 50.0);
        
        int initialBlockCount = blockchainService.getBlockchain().size();
        
        // Mine a block
        Block newBlock = blockchainService.mineBlock("Miner1");
        
        assertNotNull(newBlock);
        assertEquals(initialBlockCount, newBlock.getIndex());
        assertTrue(newBlock.getTransactionCount() > 0);
        assertEquals(initialBlockCount + 1, blockchainService.getBlockchain().size());
        
        // Check if pending transactions are cleared
        assertTrue(blockchainService.getPendingTransactions().isEmpty());
    }

    @Test
    void testMiningWithoutTransactions() {
        assertThrows(RuntimeException.class, () -> {
            blockchainService.mineBlock("Miner1");
        });
    }

    @Test
    void testProofOfWork() {
        List<Transaction> transactions = new ArrayList<>();
        transactions.add(new Transaction("Alice", "Bob", 50.0));
        
        Block block = new Block(1, transactions, "previousHash", 2);
        block.mineBlock(2);
        
        // Check if block hash starts with required number of zeros
        assertTrue(block.getHash().startsWith("00"));
        assertTrue(block.getNonce() > 0);
        assertTrue(block.getMiningTime() > 0);
        assertTrue(block.isValidBlock());
    }

    @Test
    void testBlockValidation() {
        List<Transaction> transactions = new ArrayList<>();
        transactions.add(new Transaction("Alice", "Bob", 50.0));
        
        Block block = new Block(1, transactions, "previousHash", 2);
        block.mineBlock(2);
        
        // Valid block
        assertTrue(block.isValidBlock());
        
        // Tamper with the block
        block.setHash("invalid_hash");
        assertFalse(block.isValidBlock());
    }

    @Test
    void testBlockchainValidation() {
        // Initially valid
        assertTrue(blockchainService.validateChain());
        
        // Add and mine some blocks
        blockchainService.addTransaction("SYSTEM", "Alice", 100.0);
        blockchainService.mineBlock("Miner1");
        
        blockchainService.addTransaction("Alice", "Bob", 50.0);
        blockchainService.mineBlock("Miner2");
        
        // Should still be valid
        assertTrue(blockchainService.validateChain());
    }

    @Test
    void testBalanceTracking() {
        // Initial balance should be 0
        assertEquals(0.0, blockchainService.getBalance("Alice"));
        
        // Add money to Alice
        blockchainService.addTransaction("SYSTEM", "Alice", 100.0);
        blockchainService.mineBlock("Miner1");
        
        // Check Alice's balance
        assertEquals(100.0, blockchainService.getBalance("Alice"));
        
        // Alice sends money to Bob
        blockchainService.addTransaction("Alice", "Bob", 30.0);
        blockchainService.mineBlock("Miner2");
        
        // Check balances after transaction
        assertEquals(70.0, blockchainService.getBalance("Alice"));
        assertEquals(30.0, blockchainService.getBalance("Bob"));
        
        // Check miner rewards
        assertTrue(blockchainService.getBalance("Miner1") >= 10.0);
        assertTrue(blockchainService.getBalance("Miner2") >= 10.0);
    }

    @Test
    void testTransactionHistory() {
        // Add transactions
        blockchainService.addTransaction("SYSTEM", "Alice", 100.0);
        blockchainService.mineBlock("Miner1");
        
        blockchainService.addTransaction("Alice", "Bob", 30.0);
        blockchainService.addTransaction("Alice", "Charlie", 20.0);
        blockchainService.mineBlock("Miner2");
        
        // Check Alice's transaction history
        List<Transaction> aliceHistory = blockchainService.getTransactionHistory("Alice");
        assertTrue(aliceHistory.size() >= 3); // Received from SYSTEM, sent to Bob, sent to Charlie
        
        // Check Bob's transaction history
        List<Transaction> bobHistory = blockchainService.getTransactionHistory("Bob");
        assertTrue(bobHistory.size() >= 1); // Received from Alice
    }

    @Test
    void testGetAllBalances() {
        // Add some transactions and mine
        blockchainService.addTransaction("SYSTEM", "Alice", 100.0);
        blockchainService.addTransaction("SYSTEM", "Bob", 50.0);
        blockchainService.mineBlock("Miner1");
        
        var balances = blockchainService.getAllBalances();
        
        assertTrue(balances.containsKey("Alice"));
        assertTrue(balances.containsKey("Bob"));
        assertTrue(balances.containsKey("Miner1"));
        
        assertEquals(100.0, balances.get("Alice"));
        assertEquals(50.0, balances.get("Bob"));
        assertTrue(balances.get("Miner1") >= 10.0); // Mining reward
    }

    @Test
    void testTotalTransactionCount() {
        assertEquals(1, blockchainService.getTotalTransactions()); // Genesis block transaction
        
        blockchainService.addTransaction("SYSTEM", "Alice", 100.0);
        blockchainService.addTransaction("SYSTEM", "Bob", 50.0);
        blockchainService.mineBlock("Miner1");
        
        // Should have genesis transaction + 2 added transactions + 1 mining reward = 4 total
        assertEquals(4, blockchainService.getTotalTransactions());
    }

    @Test
    void testHashCalculation() {
        List<Transaction> transactions = new ArrayList<>();
        transactions.add(new Transaction("Alice", "Bob", 50.0));
        
        Block block1 = new Block(1, transactions, "previousHash");
        Block block2 = new Block(1, transactions, "previousHash");
        
        // Same data should produce same hash initially
        // But since transactions have unique IDs with timestamps, hashes will be different
        assertNotNull(block1.getHash());
        assertNotNull(block2.getHash());
    }

    @Test
    void testChainSummary() {
        var summary = blockchainService.getChainSummary();
        
        assertNotNull(summary);
        assertTrue(summary.getTotalBlocks() > 0);
        assertTrue(summary.isValid());
        assertNotNull(summary.getLatestBlockHash());
    }

    @Test
    void testBlockTransactionValue() {
        List<Transaction> transactions = new ArrayList<>();
        transactions.add(new Transaction("Alice", "Bob", 50.0));
        transactions.add(new Transaction("Bob", "Charlie", 25.0));
        
        Block block = new Block(1, transactions, "previousHash");
        
        assertEquals(75.0, block.getTotalTransactionValue());
        assertEquals(2, block.getTransactionCount());
    }
} 