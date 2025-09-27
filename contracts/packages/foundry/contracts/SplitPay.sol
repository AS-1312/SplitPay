/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract SplitPay is Pausable {
    IERC20 public immutable pyusd;

    mapping(address => uint256) public reputationScore;
    mapping(address => uint256) public totalSettlements;
    mapping(address => uint256) public latePayments;

    constructor(IERC20 _pyusd) {
        pyusd = _pyusd;        
    }
    
    event GroupSettled(
        bytes32 groupId,
        address debtors,
        address[] creditors,
        uint256[] amounts,
        uint256 timestamp
    );

    event ReputationUpdated(
        address indexed user,
        uint256 newScore,
        bool wasOnTime
    );

    error CreditorAmountMismatch();
    
    function settleGroup(
        bytes32 groupId,
        address[] calldata creditors,
        uint256[] calldata amounts,
        uint256 dueDate
    ) external whenNotPaused {
        if (creditors.length != amounts.length)
            revert CreditorAmountMismatch();
        
        for(uint i = 0; i < creditors.length; i++) {
            require(
                pyusd.transferFrom(msg.sender, creditors[i], amounts[i]),
                "Transfer failed"
            );
        }

        if (block.timestamp > dueDate) {
            _updateReputation(msg.sender, false);
        } else {
            _updateReputation(msg.sender, true);
        }
        
        emit GroupSettled(
            groupId, 
            msg.sender, 
            creditors, 
            amounts, 
            block.timestamp
        );
    }

    function _updateReputation(address user, bool wasOnTime) private {
        totalSettlements[user]++;
        
        if (wasOnTime) {
            reputationScore[user] += 10;
        } else {
            latePayments[user]++;
            if (reputationScore[user] > 5) {
                reputationScore[user] -= 5;
            }
        }
        
        emit ReputationUpdated(user, reputationScore[user], wasOnTime);
    }

    function getReputationLevel(address user) public view returns (string memory) {
        uint256 score = reputationScore[user];
        uint256 total = totalSettlements[user];
        
        if (total == 0) 
            return "New User";
        
        uint256 percentage = (score * 100) / (total * 10);
        
        if (percentage >= 90) 
            return "Platinum";
        if (percentage >= 80) 
            return "Gold";
        if (percentage >= 70) 
            return "Silver";
        if (percentage >= 60) 
            return "Bronze";

        return "Needs Improvement";
    }
}