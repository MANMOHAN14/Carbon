// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BlueCarbonToken (BCC)
 * @dev ERC-20 token for fractional carbon credit trading
 * 1 BCC = 0.001 tCO2 (1000 BCC = 1 Carbon Credit NFT)
 */
contract BlueCarbonToken is ERC20, ERC20Burnable, Pausable, Ownable {
    uint256 public constant DECIMALS = 18;
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**DECIMALS; // 1M BCC
    uint256 public constant BCC_PER_CARBON_CREDIT = 1000; // 1000 BCC = 1 tCO2
    
    // Mapping of verified projects to their BCC allocation
    mapping(address => uint256) public projectAllocations;
    mapping(address => bool) public verifiedProjects;
    
    // Events
    event ProjectVerified(address indexed project, uint256 allocation);
    event BCCMinted(address indexed to, uint256 amount, string reason);
    event BCCBurned(address indexed from, uint256 amount, string reason);
    
    constructor() ERC20("Blue Carbon Coin", "BCC") {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    /**
     * @dev Mint BCC tokens for verified carbon sequestration
     * @param to Address to mint tokens to
     * @param carbonCredits Amount of carbon credits (in tCO2)
     * @param projectId Project identifier
     */
    function mintForCarbonSequestration(
        address to,
        uint256 carbonCredits,
        string memory projectId
    ) external onlyOwner {
        require(verifiedProjects[to], "Project not verified");
        uint256 bccAmount = carbonCredits * BCC_PER_CARBON_CREDIT * 10**DECIMALS;
        _mint(to, bccAmount);
        emit BCCMinted(to, bccAmount, projectId);
    }
    
    /**
     * @dev Verify a project for BCC minting
     * @param project Project address
     * @param allocation Maximum BCC allocation
     */
    function verifyProject(address project, uint256 allocation) external onlyOwner {
        verifiedProjects[project] = true;
        projectAllocations[project] = allocation;
        emit ProjectVerified(project, allocation);
    }
    
    /**
     * @dev Burn BCC tokens when carbon credits are retired
     * @param amount Amount of BCC to burn
     * @param reason Reason for burning
     */
    function burnForRetirement(uint256 amount, string memory reason) external {
        _burn(msg.sender, amount);
        emit BCCBurned(msg.sender, amount, reason);
    }
    
    /**
     * @dev Convert BCC to carbon credits (for NFT minting)
     * @param bccAmount Amount of BCC to convert
     * @return carbonCredits Amount of carbon credits
     */
    function convertBCCToCarbonCredits(uint256 bccAmount) external pure returns (uint256) {
        return bccAmount / (BCC_PER_CARBON_CREDIT * 10**DECIMALS);
    }
    
    /**
     * @dev Pause token transfers (emergency)
     */
    function pause() public onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause token transfers
     */
    function unpause() public onlyOwner {
        _unpause();
    }
    
    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }
}
