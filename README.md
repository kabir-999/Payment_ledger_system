# ChainPay

A secure, immutable payment ledger system built with Java Spring Boot and React. ChainPay provides a transparent and tamper-proof platform for managing financial transactions with complete auditability.

## Live Deployment

- **Backend API**: https://payment-ledger-system.onrender.com
- **Frontend Application**: https://chain-pay.onrender.com

## Features

### Core Functionality
- **User Authentication**: Secure signup and login system with on-chain credential storage
- **Payment Transactions**: Send and receive payments between registered users
- **Transaction Validation**: Prevents transfers to non-existent accounts
- **Balance Management**: Real-time balance tracking for all users
- **Mining System**: Proof-of-Work mining to confirm pending transactions
- **Immutable Records**: All transactions are permanently recorded and cannot be altered
- **Transaction History**: Complete audit trail for all user transactions
- **Public Key Infrastructure**: RSA key pair generation for each user

### Security Features
- Password hashing with SHA-256
- Balance verification before transactions
- Receiver account validation
- Cryptographic transaction signing
- Tamper-proof data storage

## Technology Stack

### Backend
- **Framework**: Spring Boot 3.2.5
- **Language**: Java 17
- **Build Tool**: Maven
- **API**: RESTful endpoints
- **Security**: SHA-256 hashing, RSA encryption

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Icons**: Lucide React

## Project Structure

```
Payment_Ledger_System/
├── src/main/java/com/example/ledger/
│   ├── controller/       # REST API endpoints
│   ├── model/           # Data models (Block, Transaction, etc.)
│   ├── service/         # Business logic
│   └── LedgerApplication.java
├── blockchain-frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API integration
│   │   ├── store/       # State management
│   │   └── types/       # TypeScript definitions
│   └── public/
├── pom.xml              # Maven configuration
└── docker-compose.yml   # Docker orchestration
```

## Getting Started

### Prerequisites
- Java 17 or higher
- Maven 3.6+
- Node.js 20+ and npm
- Git

### Local Development

#### 1. Clone the Repository
```bash
git clone https://github.com/kabir-999/Payment_ledger_system.git
cd Payment_Ledger_System
```

#### 2. Start the Backend
```bash
mvn spring-boot:run
```
The backend will start on http://localhost:8080

#### 3. Start the Frontend
```bash
cd blockchain-frontend
npm install
npm run dev
```
The frontend will start on http://localhost:5173

### Building for Production

#### Backend
```bash
mvn clean package
java -jar target/ledger-1.0.0.jar
```

#### Frontend
```bash
cd blockchain-frontend
npm run build
```
The production build will be in the `dist/` directory.

## API Documentation

### Authentication Endpoints

**Signup**
```
POST /api/ledger/signup
Parameters: email, password, name (optional)
Response: User credentials, public/private keys, initial balance
```

**Login**
```
POST /api/ledger/login
Parameters: email, password
Response: Authentication status, current balance, public key
```

### Transaction Endpoints

**Create Transaction**
```
POST /api/ledger/transaction
Parameters: sender, receiver, amount
Response: Transaction ID and status
```

**Get Transaction History**
```
GET /api/ledger/history/{address}
Response: List of all transactions for the address
```

### Ledger Endpoints

**Get Chain**
```
GET /api/ledger/chain
Response: Complete ledger with all blocks
```

**Mine Block**
```
POST /api/ledger/mine
Parameters: minerAddress
Response: Newly mined block details
```

**Get Balance**
```
GET /api/ledger/balance/{address}
Response: Current balance for the address
```

**Validate Chain**
```
GET /api/ledger/validate
Response: Chain validation status
```

## Configuration

### Environment Variables

**Frontend (.env.production)**
```
VITE_API_URL=https://payment-ledger-system.onrender.com/api/ledger
```

**Backend (application.yml)**
```yaml
ledger:
  difficulty: 4
  miningReward: 10.0
```

## Deployment

### Deploying to Render.com

#### Backend Deployment
1. Push code to GitHub
2. Create new Web Service on Render
3. Connect GitHub repository
4. Configure:
   - Build Command: `mvn clean package -DskipTests`
   - Start Command: `java -jar target/ledger-1.0.0.jar`
   - Environment: Java 17

#### Frontend Deployment
1. Create new Static Site on Render
2. Connect GitHub repository
3. Configure:
   - Build Command: `cd blockchain-frontend && npm install && npm run build`
   - Publish Directory: `blockchain-frontend/dist`
4. Add environment variable:
   - Key: `VITE_API_URL`
   - Value: `https://payment-ledger-system.onrender.com/api/ledger`

## Usage Guide

### Creating an Account
1. Navigate to the frontend application
2. Click "Create Account"
3. Enter your full name, email, and password
4. Save your generated public and private keys securely
5. You will receive an initial balance of 4500 coins

### Sending a Payment
1. Log in with your credentials
2. Navigate to the payment section
3. Enter recipient email and amount
4. Submit the transaction
5. Wait for a miner to confirm the transaction

### Mining Transactions
1. Navigate to the mining panel
2. Enter your miner address
3. Click "Mine Block"
4. Receive mining rewards (10 coins per block)

## Key Concepts

### Immutability
Once a transaction is mined into a block, it cannot be modified or deleted. This ensures complete transparency and prevents fraud.

### Proof of Work
Miners must solve a computational puzzle to add new blocks to the ledger. This secures the network and prevents spam.

### Balance Calculation
User balances are calculated by summing all incoming transactions and subtracting all outgoing transactions from the entire ledger history.

### Transaction Validation
- Sender must have sufficient balance
- Receiver account must exist
- Amount must be positive
- Sender cannot send to themselves

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues, questions, or suggestions, please open an issue on the GitHub repository.

## Acknowledgments

Built with modern web technologies to demonstrate secure, transparent payment processing using immutable ledger principles.
