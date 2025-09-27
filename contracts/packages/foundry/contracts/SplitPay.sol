pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SplitPay {
    address public immutable PYUSD;

    constructor(address _pyusd) {
        PYUSD = _pyusd;
    }
    
    event GroupSettled(
        string groupId,
        address[] debtors,
        address[] creditors,
        uint256[] amounts,
        uint256 timestamp
    );
    
    function settleGroup(
        string memory groupId,
        address[] memory debtors,
        address[] memory creditors,
        uint256[] memory amounts
    ) external {
        require(debtors.length == creditors.length, "Array length mismatch");
        require(creditors.length == amounts.length, "Array length mismatch");
        
        IERC20 pyusd = IERC20(PYUSD);
        
        for(uint i = 0; i < debtors.length; i++) {
            require(
                pyusd.transferFrom(debtors[i], creditors[i], amounts[i]),
                "Transfer failed"
            );
        }
        
        emit GroupSettled(
            groupId, 
            debtors, 
            creditors, 
            amounts, 
            block.timestamp
        );
    }
}