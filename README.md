# SplitPay

<p align="center">
  <img src="cover-image.png" alt="Logo" style="width: 50%;" />
</p>

<br/>

SplitPay reimagines group expense settlement for the Web3 era. Just like Splitwise, you can track who paid for dinner, split Uber rides, and manage group expenses - but with a game-changing twist: our debt simplification algorithm reduces the number of payments needed by up to 75%. 

The Problem: In a typical friend group with multiple expenses, settling up requires numerous separate transfers. Four friends with 8 shared expenses might need 12 individual payments. 

Example scenario: Alice, Bob, Charlie, and Diana Expenses:
Hotel Room: $400 (paid by Alice) Group Dinner: $240 (paid by Bob) Uber Rides: $80 (paid by Charlie) Show Tickets: $360 (paid by Diana)
The Magic of Simplification Without SplitPay: 12 separate transactions would be needed as everyone pays everyone else for their share of each expense. With SplitPay: Only 3 transactions are needed:
Charlie → Alice: $110 Diana → Alice: $180 Bob → Diana: $20

Our Solution: SplitPay's algorithm simplifies this to just 3-4 optimized transfers. Then, with one click, everyone gets paid instantly using PayPal's PYUSD stablecoin. No more "I'll Venmo you later" or forgotten IOUs.

### Key Features:

- Add expenses and split them equally or custom amounts
- Visual debt simplification showing exactly how we reduce transfers
- One-click settlement with PYUSD on Ethereum Pay anyone using their ENS name (alice.eth instead of 0x...)
- Permanent receipts stored on Hedera for taxes/accounting

Perfect for hackathon teams, travel groups, shared housing, or any situation where multiple people share expenses.

### Contract deployments

https://hashscan.io/testnet/contract/0.0.6917079
https://sepolia.etherscan.io/address/0xac40e4674343Ea7BB00A18E3E94849CFa07dB167

### Run the application

#### Frontend

1. cd frontend && pnpm i
2. pnpm dev

#### Smart contracts

Deploy locally using Anvil

1. cd contracts && yarn compile
2. yarn chain
3. yarn deploy

Hedera contracts

1. cd hedera
2. npx hardhat compile
3. npx hardhat deploy
