// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SplitPayReceipts {
    
    struct Receipt {
        string groupId;
        string ethTxHash;
        uint256 totalAmount;
        uint256 originalDebts;
        uint256 simplifiedDebts;
        address settledBy;
        uint256 timestamp;
        bool exists;
    }
    
    mapping(bytes32 => Receipt) public receipts;
    mapping(address => bytes32[]) public userReceipts;
    bytes32[] public allReceipts;
    
    uint256 public totalReceipts;
    
    event ReceiptStored(
        bytes32 indexed receiptId,
        string indexed groupId,
        string ethTxHash,
        uint256 totalAmount,
        address indexed settledBy,
        uint256 timestamp
    );
    
    function storeReceipt(
        string memory groupId,
        string memory ethTxHash,
        uint256 totalAmount,
        uint256 originalDebts,
        uint256 simplifiedDebts
    ) external returns (bytes32) {
        require(bytes(groupId).length > 0, "Group ID required");
        require(bytes(ethTxHash).length > 0, "ETH transaction hash required");
        require(totalAmount > 0, "Total amount must be positive");
        
        bytes32 receiptId = keccak256(
            abi.encodePacked(groupId, ethTxHash, msg.sender, block.timestamp)
        );
        
        require(!receipts[receiptId].exists, "Receipt already exists");
        
        receipts[receiptId] = Receipt({
            groupId: groupId,
            ethTxHash: ethTxHash,
            totalAmount: totalAmount,
            originalDebts: originalDebts,
            simplifiedDebts: simplifiedDebts,
            settledBy: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });
        
        userReceipts[msg.sender].push(receiptId);
        allReceipts.push(receiptId);
        totalReceipts++;
        
        emit ReceiptStored(
            receiptId,
            groupId,
            ethTxHash,
            totalAmount,
            msg.sender,
            block.timestamp
        );
        
        return receiptId;
    }
    
    function getReceipt(bytes32 receiptId) external view returns (
        string memory groupId,
        string memory ethTxHash,
        uint256 totalAmount,
        uint256 originalDebts,
        uint256 simplifiedDebts,
        address settledBy,
        uint256 timestamp
    ) {
        Receipt storage receipt = receipts[receiptId];
        require(receipt.exists, "Receipt not found");
        
        return (
            receipt.groupId,
            receipt.ethTxHash,
            receipt.totalAmount,
            receipt.originalDebts,
            receipt.simplifiedDebts,
            receipt.settledBy,
            receipt.timestamp
        );
    }
    
    function getUserReceipts(address user) external view returns (bytes32[] memory) {
        return userReceipts[user];
    }
    
    function getTotalReceipts() external view returns (uint256) {
        return totalReceipts;
    }
    
    function receiptExists(bytes32 receiptId) external view returns (bool) {
        return receipts[receiptId].exists;
    }
    
    function getSavingsPercentage(bytes32 receiptId) external view returns (uint256) {
        Receipt storage receipt = receipts[receiptId];
        require(receipt.exists, "Receipt not found");
        
        if (receipt.originalDebts == 0) return 0;
        
        return ((receipt.originalDebts - receipt.simplifiedDebts) * 100) / receipt.originalDebts;
    }
}