// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

/// @title GEO Token
/// @notice Simple ERC20 with a one-time faucet claim per address. Minted to users when they first connect.
contract GeoToken is ERC20, Ownable {
    // Tracks whether an address already claimed the initial allocation
    mapping(address => bool) public hasClaimed;

    // Initial allocation minted on first claim (e.g., 1,000 GEO)
    uint256 public immutable initialAllocation;

    event Claimed(address indexed account, uint256 amount);

    constructor(string memory name_, string memory symbol_, uint256 initialAllocation_, address owner_)
        ERC20(name_, symbol_)
        Ownable(owner_)
    {
        initialAllocation = initialAllocation_;
    }

    /// @notice Mint the initial allocation to `msg.sender` if not already claimed.
    function claim() external {
        require(!hasClaimed[msg.sender], "Already claimed");
        hasClaimed[msg.sender] = true;
        _mint(msg.sender, initialAllocation);
        emit Claimed(msg.sender, initialAllocation);
    }

    /// @notice Owner can airdrop additional tokens if needed (e.g., tournaments, rewards).
    function airdrop(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}


