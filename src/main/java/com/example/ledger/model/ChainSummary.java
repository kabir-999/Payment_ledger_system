package com.example.ledger.model;

public class ChainSummary {
    private int totalBlocks;
    private boolean valid;
    private String latestBlockHash;

    public ChainSummary(int totalBlocks, boolean valid, String latestBlockHash) {
        this.totalBlocks = totalBlocks;
        this.valid = valid;
        this.latestBlockHash = latestBlockHash;
    }

    // Getters and setters
    public int getTotalBlocks() {
        return totalBlocks;
    }

    public void setTotalBlocks(int totalBlocks) {
        this.totalBlocks = totalBlocks;
    }

    public boolean isValid() {
        return valid;
    }

    public void setValid(boolean valid) {
        this.valid = valid;
    }

    public String getLatestBlockHash() {
        return latestBlockHash;
    }

    public void setLatestBlockHash(String latestBlockHash) {
        this.latestBlockHash = latestBlockHash;
    }
}
