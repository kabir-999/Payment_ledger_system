# 🔗 Blockchain Payment Ledger

A **Java-based blockchain implementation** for secure, immutable financial transactions. This project demonstrates core blockchain concepts including Proof of Work mining, transaction validation, and tamper-proof record keeping.

## 🌟 Features

### Core Blockchain Features
- **Immutable Ledger**: Once transactions are mined into blocks, they cannot be altered
- **Proof of Work**: Mining algorithm with adjustable difficulty
- **Chain Validation**: Cryptographic integrity verification
- **Genesis Block**: Automatic initialization with first block
- **SHA-256 Hashing**: Secure cryptographic hash functions

### Transaction Management
- **Balance Tracking**: Real-time account balance calculation
- **Double-Spend Prevention**: Validates sufficient funds before transactions
- **Transaction History**: Complete audit trail for any address
- **Mining Rewards**: Automatic coinbase transactions for miners
- **Pending Pool**: Transaction queue before mining

### REST API
- **Complete API**: Full CRUD operations via REST endpoints
- **JSON/Form Support**: Multiple request formats
- **Error Handling**: Comprehensive validation and error responses
- **Real-time Stats**: Live blockchain statistics

### Web Interface
- **Modern UI**: Responsive, mobile-friendly design
- **Real-time Updates**: Auto-refreshing statistics
- **Interactive Mining**: Visual mining process with timing
- **Balance Checker**: Multi-address balance lookup
- **Chain Visualization**: Complete blockchain explorer

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   REST API      │    │   Blockchain    │
│   (HTML/JS)     │◄──►│  (Spring Boot)  │◄──►│   Service       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                        ┌─────────────────┐    ┌─────────────────┐
                        │   Transaction   │    │     Block       │
                        │     Pool        │◄──►│   Structure     │
                        └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- **Java 17+**
- **Maven 3.6+**
- **Web Browser** (for UI)

### 1. Clone and Build
```bash
git clone <repository-url>
cd payment_ledger
mvn clean compile
```

### 2. Run the Application
```bash
mvn spring-boot:run
```

### 3. Access the System
- **Web Interface**: http://localhost:8080
- **API Documentation**: http://localhost:8080/api/ledger/health
- **Statistics**: http://localhost:8080/api/ledger/stats

## 📚 API Reference

### Base URL
```
http://localhost:8080/api/ledger
```

### Core Endpoints

#### 🔍 Get Blockchain Stats
```http
GET /stats
```
**Response:**
```json
{
  "totalBlocks": 3,
  "totalTransactions": 8,
  "pendingTransactions": 2,
  "isValid": true,
  "latestBlockHash": "0000a1b2c3d4...",
  "latestBlockTimestamp": "2024-01-15T10:30:00"
}
```

#### 💸 Add Transaction
```http
POST /transaction
Content-Type: application/x-www-form-urlencoded

sender=Alice&receiver=Bob&amount=50.0
```
**Response:**
```json
{
  "status": "success",
  "message": "Transaction added to pending pool. Transaction ID: abc-123-def"
}
```

#### ⛏️ Mine Block
```http
POST /mine?minerAddress=Miner1
```
**Response:**
```json
{
  "status": "success",
  "message": "Block mined successfully",
  "blockIndex": 2,
  "blockHash": "0000a1b2c3d4e5f6...",
  "miningTime": 1250,
  "nonce": 45231
}
```

#### 💰 Check Balance
```http
GET /balance/Alice
```
**Response:**
```json
{
  "address": "Alice",
  "balance": 75.50
}
```

#### 🔗 Get Complete Blockchain
```http
GET /chain
```
**Response:**
```json
[
  {
    "index": 0,
    "timestamp": "2024-01-15T10:00:00",
    "transactions": [...],
    "previousHash": "0",
    "hash": "abc123def456...",
    "nonce": 0,
    "difficulty": 0,
    "miningTime": 0
  }
]
```

### Additional Endpoints
- `GET /summary` - Blockchain summary
- `GET /pending` - Pending transactions
- `GET /validate` - Validate chain integrity
- `GET /balances` - All account balances
- `GET /history/{address}` - Transaction history
- `GET /block/{index}` - Specific block details
- `POST /init-sample-data` - Initialize test data

## 🎯 Usage Examples

### Example 1: Basic Transaction Flow
```bash
# 1. Add initial funds
curl -X POST "http://localhost:8080/api/ledger/transaction" \
  -d "sender=SYSTEM&receiver=Alice&amount=100"

# 2. Mine the block
curl -X POST "http://localhost:8080/api/ledger/mine?minerAddress=Miner1"

# 3. Alice sends money to Bob
curl -X POST "http://localhost:8080/api/ledger/transaction" \
  -d "sender=Alice&receiver=Bob&amount=50"

# 4. Mine another block
curl -X POST "http://localhost:8080/api/ledger/mine?minerAddress=Miner2"

# 5. Check balances
curl "http://localhost:8080/api/ledger/balance/Alice"  # Should show 50
curl "http://localhost:8080/api/ledger/balance/Bob"    # Should show 50
```

### Example 2: Using the Web Interface
1. Open http://localhost:8080
2. Click "Initialize Sample Data" for demo transactions
3. Create transactions using the form
4. Mine blocks to confirm transactions
5. Check balances and view the blockchain

## 🔧 Configuration

### Application Properties
```yaml
# src/main/resources/application.yml
server:
  port: 8080

ledger:
  difficulty: 4      # Mining difficulty (number of leading zeros)
  miningReward: 10.0 # Reward for mining a block
```

### Mining Difficulty
- **Difficulty 1**: ~1ms mining time
- **Difficulty 2**: ~10ms mining time
- **Difficulty 3**: ~100ms mining time
- **Difficulty 4**: ~1-5 seconds mining time
- **Difficulty 5+**: Several seconds to minutes

## 🧪 Testing

### Run All Tests
```bash
mvn test
```

### Test Coverage
- ✅ Genesis block creation
- ✅ Transaction validation
- ✅ Balance tracking
- ✅ Proof of Work mining
- ✅ Chain validation
- ✅ Error handling
- ✅ API endpoints

### Example Test Scenarios
```java
@Test
void testCompleteTransactionFlow() {
    // Add funds
    blockchainService.addTransaction("SYSTEM", "Alice", 100.0);
    blockchainService.mineBlock("Miner1");
    
    // Verify balance
    assertEquals(100.0, blockchainService.getBalance("Alice"));
    
    // Send money
    blockchainService.addTransaction("Alice", "Bob", 50.0);
    blockchainService.mineBlock("Miner2");
    
    // Verify final balances
    assertEquals(50.0, blockchainService.getBalance("Alice"));
    assertEquals(50.0, blockchainService.getBalance("Bob"));
}
```

## 🔒 Security Features

### Immutability
- **Hash Chaining**: Each block references the previous block's hash
- **Tamper Detection**: Any modification breaks the chain validation
- **Cryptographic Integrity**: SHA-256 ensures data authenticity

### Transaction Security
- **Balance Validation**: Prevents spending more than available
- **Double-Spend Prevention**: Transactions validated before mining
- **Unique IDs**: Each transaction has a unique identifier

### Mining Security
- **Proof of Work**: Computational proof required for block creation
- **Difficulty Adjustment**: Configurable mining complexity
- **Nonce Verification**: Mining process validation

## 🎨 Frontend Features

### Dashboard
- **Real-time Statistics**: Live blockchain metrics
- **Visual Indicators**: Chain validity status
- **Auto-refresh**: Updates every 10 seconds

### Transaction Management
- **Form Validation**: Client-side input validation
- **Error Handling**: User-friendly error messages
- **Success Feedback**: Transaction confirmation

### Blockchain Explorer
- **Block Visualization**: Complete block details
- **Transaction Details**: Individual transaction information
- **Hash Display**: Truncated hashes with full details on hover
- **Mining Information**: Nonce, difficulty, and timing data

## 🛠️ Development

### Project Structure
```
src/
├── main/java/com/example/ledger/
│   ├── controller/          # REST API endpoints
│   ├── model/              # Data models (Block, Transaction, etc.)
│   ├── service/            # Business logic
│   └── LedgerApplication.java
├── main/resources/
│   ├── application.yml     # Configuration
│   └── static/index.html   # Web interface
└── test/java/              # Test suites
```

### Key Classes
- **`BlockchainService`**: Core blockchain operations
- **`Block`**: Individual block with mining capabilities
- **`Transaction`**: Payment transaction model
- **`Blockchain`**: Chain management and validation
- **`LedgerController`**: REST API endpoints

## 🔄 Future Enhancements

### Potential Improvements
- [ ] **Persistence**: Save blockchain to file/database
- [ ] **Network Protocol**: Multi-node blockchain network
- [ ] **Digital Signatures**: Cryptographic transaction signing
- [ ] **Smart Contracts**: Programmable transaction logic
- [ ] **Merkle Trees**: Efficient transaction verification
- [ ] **Wallet System**: User account management
- [ ] **Transaction Fees**: Dynamic fee calculation

### Performance Optimizations
- [ ] **Parallel Mining**: Multi-threaded mining
- [ ] **Block Size Limits**: Transaction capacity management
- [ ] **Memory Optimization**: Efficient data structures
- [ ] **Caching**: Frequently accessed data caching

## 📝 Educational Value

This project demonstrates:
- **Blockchain Fundamentals**: Hash chains, immutability, consensus
- **Cryptographic Concepts**: SHA-256, Proof of Work, nonces
- **Distributed Systems**: Decentralized ledger principles
- **Software Architecture**: Clean separation of concerns
- **API Design**: RESTful service patterns
- **Testing Practices**: Comprehensive test coverage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is for educational purposes. Feel free to use and modify as needed.

---

**Built with ❤️ using Java, Spring Boot, and modern web technologies**
