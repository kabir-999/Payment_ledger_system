package com.example.ledger.controller;

import com.example.ledger.model.Block;
import com.example.ledger.model.Transaction;
import com.example.ledger.service.BlockchainService;
import com.example.ledger.model.ChainSummary;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.SecureRandom;
import java.util.Base64;

@RestController
@RequestMapping("/api/ledger")
@CrossOrigin(origins = "*") // Allow frontend access
public class LedgerController {

    private final BlockchainService blockchainService;

    public LedgerController(BlockchainService blockchainService) {
        this.blockchainService = blockchainService;
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Hash error", e);
        }
    }

    private static Map<String, String> generateKeyPairBase64() {
        try {
            KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
            kpg.initialize(2048, SecureRandom.getInstanceStrong());
            KeyPair kp = kpg.generateKeyPair();
            String pub = Base64.getEncoder().encodeToString(kp.getPublic().getEncoded());
            String priv = Base64.getEncoder().encodeToString(kp.getPrivate().getEncoded());
            Map<String, String> out = new HashMap<>();
            out.put("publicKey", pub);
            out.put("privateKey", priv);
            return out;
        } catch (Exception e) {
            throw new RuntimeException("Key generation failed", e);
        }
    }

    // --- Auth-like endpoints backed by blockchain ---

    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(@RequestParam String email,
                                                      @RequestParam String password,
                                                      @RequestParam(required = false) String name) {
        Map<String, Object> res = new HashMap<>();
        try {
            if (blockchainService.isUserRegistered(email)) {
                res.put("status", "error");
                res.put("message", "Email already registered");
                return ResponseEntity.badRequest().body(res);
            }
            String pwdHash = sha256(password);
            Transaction reg = new Transaction("SYSTEM", email, 0.0, "REGISTER", pwdHash);
            blockchainService.addPendingDirect(reg);
            if (name != null && !name.isBlank()) {
                blockchainService.setUserName(email, name.trim());
            }

            // Generate keypair and store public key on-chain
            Map<String, String> keys = generateKeyPairBase64();
            String publicKey = keys.get("publicKey");
            String privateKey = keys.get("privateKey");
            blockchainService.setUserPublicKey(email, publicKey);

            // Initial funding
            Transaction grant = new Transaction("SYSTEM", email, 4500.0);
            blockchainService.addPendingDirect(grant);
            Block mined = blockchainService.mineBlock("Registrar");

            res.put("status", "success");
            res.put("message", "User registered, keys created, and funded");
            res.put("blockIndex", mined.getIndex());
            res.put("publicKey", publicKey);
            res.put("privateKey", privateKey);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            res.put("status", "error");
            res.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(res);
        }
    }

    @GetMapping("/user/name")
    public ResponseEntity<Map<String, Object>> getUserName(@RequestParam String email) {
        String name = blockchainService.getUserName(email);
        Map<String, Object> res = new HashMap<>();
        res.put("email", email);
        res.put("name", name);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/user/public-key")
    public ResponseEntity<Map<String, Object>> getUserPublicKey(@RequestParam String email) {
        String pub = blockchainService.getUserPublicKey(email);
        Map<String, Object> res = new HashMap<>();
        res.put("email", email);
        res.put("publicKey", pub);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestParam String email,
                                                     @RequestParam String password) {
        Map<String, Object> res = new HashMap<>();
        try {
            if (!blockchainService.isUserRegistered(email)) {
                res.put("status", "error");
                res.put("message", "User not found");
                return ResponseEntity.badRequest().body(res);
            }
            boolean ok = blockchainService.verifyUserPassword(email, sha256(password));
            if (!ok) {
                res.put("status", "error");
                res.put("message", "Invalid credentials");
                return ResponseEntity.badRequest().body(res);
            }
            res.put("status", "success");
            res.put("message", "Login successful");
            // Optionally return current balance
            res.put("balance", blockchainService.getBalance(email));
            // Also return public key if present
            res.put("publicKey", blockchainService.getUserPublicKey(email));
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            res.put("status", "error");
            res.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(res);
        }
    }

    /**
     * Get blockchain summary
     */
    @GetMapping("/summary")
    public ResponseEntity<ChainSummary> getChainSummary() {
        return ResponseEntity.ok(blockchainService.getChainSummary());
    }

    /**
     * Get the complete blockchain
     */
    @GetMapping("/chain")
    public ResponseEntity<List<Block>> getBlockchain() {
        return ResponseEntity.ok(blockchainService.getBlockchain());
    }

    /**
     * Add a new transaction to pending pool
     */
    @PostMapping("/transaction")
    public ResponseEntity<Map<String, String>> addTransaction(
            @RequestParam String sender,
            @RequestParam String receiver,
            @RequestParam double amount) {

        String result = blockchainService.addTransaction(sender, receiver, amount);
        Map<String, String> response = new HashMap<>();

        if (result.startsWith("Error:")) {
            response.put("status", "error");
            response.put("message", result);
            return ResponseEntity.badRequest().body(response);
        } else {
            response.put("status", "success");
            response.put("message", result);
            return ResponseEntity.ok(response);
        }
    }

    /**
     * Add transaction with JSON body
     */
    @PostMapping("/transaction/json")
    public ResponseEntity<Map<String, String>> addTransactionJson(@RequestBody TransactionRequest request) {
        String result = blockchainService.addTransaction(request.getSender(), request.getReceiver(), request.getAmount());
        Map<String, String> response = new HashMap<>();

        if (result.startsWith("Error:")) {
            response.put("status", "error");
            response.put("message", result);
            return ResponseEntity.badRequest().body(response);
        } else {
            response.put("status", "success");
            response.put("message", result);
            return ResponseEntity.ok(response);
        }
    }

    /**
     * Mine a new block
     */
    @PostMapping("/mine")
    public ResponseEntity<Map<String, Object>> mineBlock(@RequestParam String minerAddress) {
        try {
            Block newBlock = blockchainService.mineBlock(minerAddress);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Block mined successfully");
            response.put("block", newBlock);
            response.put("blockIndex", newBlock.getIndex());
            response.put("blockHash", newBlock.getHash());
            response.put("miningTime", newBlock.getMiningTime());
            response.put("nonce", newBlock.getNonce());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Get pending transactions
     */
    @GetMapping("/pending")
    public ResponseEntity<List<Transaction>> getPendingTransactions() {
        return ResponseEntity.ok(blockchainService.getPendingTransactions());
    }

    /**
     * Validate the blockchain
     */
    @GetMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateBlockchain() {
        boolean isValid = blockchainService.validateChain();
        Map<String, Object> response = new HashMap<>();
        response.put("valid", isValid);
        response.put("message", isValid ? "Blockchain is valid" : "Blockchain is corrupted");
        return ResponseEntity.ok(response);
    }

    /**
     * Get balance for a specific address
     */
    @GetMapping("/balance/{address}")
    public ResponseEntity<Map<String, Object>> getBalance(@PathVariable String address) {
        double balance = blockchainService.getBalance(address);
        Map<String, Object> response = new HashMap<>();
        response.put("address", address);
        response.put("balance", balance);
        return ResponseEntity.ok(response);
    }

    /**
     * Get all balances
     */
    @GetMapping("/balances")
    public ResponseEntity<Map<String, Double>> getAllBalances() {
        return ResponseEntity.ok(blockchainService.getAllBalances());
    }

    /**
     * Get transaction history for an address
     */
    @GetMapping("/history/{address}")
    public ResponseEntity<List<Transaction>> getTransactionHistory(@PathVariable String address) {
        return ResponseEntity.ok(blockchainService.getTransactionHistory(address));
    }

    /**
     * Get blockchain statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getBlockchainStats() {
        List<Block> blockchain = blockchainService.getBlockchain();
        Map<String, Object> stats = new HashMap<>();

        stats.put("totalBlocks", blockchain.size());
        stats.put("totalTransactions", blockchainService.getTotalTransactions());
        stats.put("pendingTransactions", blockchainService.getPendingTransactions().size());
        stats.put("isValid", blockchainService.validateChain());

        if (!blockchain.isEmpty()) {
            Block latestBlock = blockchain.get(blockchain.size() - 1);
            stats.put("latestBlockHash", latestBlock.getHash());
            stats.put("latestBlockTimestamp", latestBlock.getTimestamp());
            stats.put("latestBlockTransactions", latestBlock.getTransactionCount());
        }

        return ResponseEntity.ok(stats);
    }

    /**
     * Get a specific block by index
     */
    @GetMapping("/block/{index}")
    public ResponseEntity<Block> getBlock(@PathVariable int index) {
        List<Block> blockchain = blockchainService.getBlockchain();

        if (index < 0 || index >= blockchain.size()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(blockchain.get(index));
    }

    /**
     * Initialize blockchain with sample data for testing
     */
    @PostMapping("/init-sample-data")
    public ResponseEntity<Map<String, String>> initSampleData() {
        // Add some sample transactions
        blockchainService.addTransaction("SYSTEM", "Alice", 100.0);
        blockchainService.addTransaction("SYSTEM", "Bob", 50.0);
        blockchainService.mineBlock("Miner1");

        blockchainService.addTransaction("Alice", "Bob", 25.0);
        blockchainService.addTransaction("Bob", "Charlie", 15.0);
        blockchainService.mineBlock("Miner2");

        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Sample data initialized successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "healthy");
        response.put("service", "Blockchain Payment Ledger");
        response.put("version", "1.0.0");
        return ResponseEntity.ok(response);
    }

    // Inner class for JSON transaction requests
    public static class TransactionRequest {
        private String sender;
        private String receiver;
        private double amount;

        // Constructors
        public TransactionRequest() {}

        public TransactionRequest(String sender, String receiver, double amount) {
            this.sender = sender;
            this.receiver = receiver;
            this.amount = amount;
        }

        // Getters and setters
        public String getSender() { return sender; }
        public void setSender(String sender) { this.sender = sender; }

        public String getReceiver() { return receiver; }
        public void setReceiver(String receiver) { this.receiver = receiver; }

        public double getAmount() { return amount; }
        public void setAmount(double amount) { this.amount = amount; }
    }
}
