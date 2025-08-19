package com.example.ledger.model;

import java.time.LocalDateTime;
import java.util.UUID;

public class Transaction {
    private String transactionId;
    private String sender;
    private String receiver;
    private double amount;
    private LocalDateTime timestamp;
    
    // New: optional classification and metadata
    private String type; // e.g., PAYMENT (default), REGISTER
    private String data; // e.g., password hash for REGISTER

    // Constructor
    public Transaction(String sender, String receiver, double amount) {
        this.transactionId = UUID.randomUUID().toString();
        this.sender = sender;
        this.receiver = receiver;
        this.amount = amount;
        this.timestamp = LocalDateTime.now();
        this.type = "PAYMENT";
        this.data = null;
    }

    // Convenience constructor for typed transactions
    public Transaction(String sender, String receiver, double amount, String type, String data) {
        this.transactionId = UUID.randomUUID().toString();
        this.sender = sender;
        this.receiver = receiver;
        this.amount = amount;
        this.timestamp = LocalDateTime.now();
        this.type = type;
        this.data = data;
    }

    // Getters & Setters
    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public String getReceiver() {
        return receiver;
    }

    public void setReceiver(String receiver) {
        this.receiver = receiver;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getData() { return data; }
    public void setData(String data) { this.data = data; }

    /**
     * Check if this is a coinbase transaction (mining reward)
     */
    public boolean isCoinbase() {
        return "SYSTEM".equals(sender) && amount > 0 && (type == null || "PAYMENT".equals(type));
    }

    /**
     * Check if this is a registration transaction
     */
    public boolean isRegistration() {
        return "REGISTER".equals(type);
    }

    @Override
    public String toString() {
        return "Transaction{" +
                "transactionId='" + transactionId + '\'' +
                ", sender='" + sender + '\'' +
                ", receiver='" + receiver + '\'' +
                ", amount=" + amount +
                ", timestamp=" + timestamp +
                ", type='" + type + '\'' +
                '}';
    }
}
