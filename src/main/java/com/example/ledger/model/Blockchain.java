package com.example.ledger.model;

import java.util.ArrayList;
import java.util.List;

public class Blockchain {
    private List<Block> chain;

    // Constructor: initialize blockchain with genesis block
    public Blockchain() {
        chain = new ArrayList<>();
        chain.add(createGenesisBlock());
    }

    // Genesis block (first block in chain)
    private Block createGenesisBlock() {
        List<Transaction> genesisTransactions = new ArrayList<>();
        genesisTransactions.add(new Transaction("SYSTEM", "FirstUser", 0.0)); // dummy tx
        return new Block(0, genesisTransactions, "0");
    }

    // Get latest block
    public Block getLatestBlock() {
        return chain.get(chain.size() - 1);
    }

    // Add new block
    public void addBlock(List<Transaction> transactions) {
        Block newBlock = new Block(chain.size(), transactions, getLatestBlock().getHash());
        chain.add(newBlock);
    }

    // Verify integrity of blockchain
    public boolean isChainValid() {
        for (int i = 1; i < chain.size(); i++) {
            Block current = chain.get(i);
            Block previous = chain.get(i - 1);

            // Check if hash is still valid
            if (!current.getHash().equals(current.calculateHash())) {
                return false;
            }

            // Check if previousHash matches
            if (!current.getPreviousHash().equals(previous.getHash())) {
                return false;
            }
        }
        return true;
    }

    // Get entire chain
    public List<Block> getChain() {
        return chain;
    }

    @Override
    public String toString() {
        return "Blockchain{" +
                "chain=" + chain +
                '}';
    }
}
