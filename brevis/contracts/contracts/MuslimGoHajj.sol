// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./lib/BrevisAppZkOnly.sol";

contract MuslimGoHajj is BrevisAppZkOnly, Ownable {
    struct SavingsAccount {
        uint256 goal;
        uint256 balance;
        uint256 lastUpdateTime;
        bool isActive;
    }
    
    bytes32 public vkHash;
    mapping(address => SavingsAccount) public accounts;
    mapping(address => bool) public verifiedPremiumUsers;
    
    event AccountCreated(address indexed user, uint256 goal);
    event DepositMade(address indexed user, uint256 amount, uint256 newBalance);
    event GoalReached(address indexed user, uint256 totalAmount);
    event FundsWithdrawn(address indexed user, uint256 amount);
    
    constructor(address _brevisRequest) BrevisAppZkOnly(_brevisRequest) Ownable(msg.sender) {}

    function handleProofResult(bytes32 _vkHash, bytes calldata _circuitOutput) internal override {
        require(vkHash == _vkHash, "invalid vk");
        
        // Decode output from the circuit - includes premium status verification
        (address userAddr, uint64 blockNum, uint256 isPremium) = decodeOutput(_circuitOutput);
        
        // Verify user is premium tier
        require(isPremium == 1, "Not a premium user");
        
        // Mark user as verified premium
        verifiedPremiumUsers[userAddr] = true;
    }
    
    function createAccount(uint256 goalAmount) external {
        require(verifiedPremiumUsers[msg.sender], "Must be verified premium user");
        require(!accounts[msg.sender].isActive, "Account already exists");
        require(goalAmount > 0, "Goal must be positive");
        
        accounts[msg.sender] = SavingsAccount({
            goal: goalAmount,
            balance: 0,
            lastUpdateTime: block.timestamp,
            isActive: true
        });
        
        emit AccountCreated(msg.sender, goalAmount);
    }
    
    function deposit() external payable {
        require(accounts[msg.sender].isActive, "No active account");
        require(msg.value > 0, "Must deposit something");
        
        SavingsAccount storage account = accounts[msg.sender];
        account.balance += msg.value;
        account.lastUpdateTime = block.timestamp;
        
        emit DepositMade(msg.sender, msg.value, account.balance);
        
        if (account.balance >= account.goal) {
            emit GoalReached(msg.sender, account.balance);
        }
    }
    
    function withdraw(uint256 amount) external {
        SavingsAccount storage account = accounts[msg.sender];
        require(account.isActive, "No active account");
        require(amount <= account.balance, "Insufficient balance");
        
        account.balance -= amount;
        account.lastUpdateTime = block.timestamp;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit FundsWithdrawn(msg.sender, amount);
    }

    function decodeOutput(bytes calldata o) internal pure returns (address, uint64, uint256) {
        uint64 blockNum = uint64(bytes8(o[0:8]));
        address userAddr = address(bytes20(o[8:28]));
        uint256 isPremium = uint256(bytes32(o[28:60]));
        return (userAddr, blockNum, isPremium);
    }

    function setVkHash(bytes32 _vkHash) external onlyOwner {
        vkHash = _vkHash;
    }
    
    // Allow contract to receive ETH
    receive() external payable {}
}