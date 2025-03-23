// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./lib/BrevisAppZkOnly.sol";

contract MuslimGoZakat is BrevisAppZkOnly, Ownable {
    event ZakatVerified(uint64 blockNum, address account, uint256 assetValue, uint256 zakatAmount);
    
    bytes32 public vkHash;
    mapping(address => uint256) public lastVerifiedAssets;
    mapping(address => uint256) public zakatContributions;
    
    constructor(address _brevisRequest) BrevisAppZkOnly(_brevisRequest) Ownable(msg.sender) {}

    function handleProofResult(bytes32 _vkHash, bytes calldata _circuitOutput) internal override {
        // Verify the verifying key
        require(vkHash == _vkHash, "invalid vk");
        
        // Decode output from the circuit
        (address accountAddr, uint64 blockNum, uint256 assetValue) = decodeOutput(_circuitOutput);
        
        // Calculate Zakat (2.5% of assets)
        uint256 zakatAmount = (assetValue * 25) / 1000;
        
        // Update user's verified assets and Zakat obligations
        lastVerifiedAssets[accountAddr] = assetValue;
        
        emit ZakatVerified(blockNum, accountAddr, assetValue, zakatAmount);
    }
    
    function contributeZakat() external payable {
        require(lastVerifiedAssets[msg.sender] > 0, "Assets not verified");
        require(msg.value > 0, "Must contribute something");
        
        zakatContributions[msg.sender] += msg.value;
    }

    function distributeZakat(address[] calldata charities, uint256[] calldata amounts) external onlyOwner {
        require(charities.length == amounts.length, "Arrays must match");
        
        uint256 totalAmount = 0;
        for (uint i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(address(this).balance >= totalAmount, "Insufficient balance");
        
        for (uint i = 0; i < charities.length; i++) {
            (bool success, ) = charities[i].call{value: amounts[i]}("");
            require(success, "Transfer failed");
        }
    }

    function decodeOutput(bytes calldata o) internal pure returns (address, uint64, uint256) {
        uint64 blockNum = uint64(bytes8(o[0:8]));
        address userAddr = address(bytes20(o[8:28]));
        uint256 assetValue = uint256(bytes32(o[28:60]));
        return (userAddr, blockNum, assetValue);
    }

    function setVkHash(bytes32 _vkHash) external onlyOwner {
        vkHash = _vkHash;
    }
    
    // Allow contract to receive ETH
    receive() external payable {}
}