// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

/// @title GeoBets Game (commit-reveal geoguesser with ERC20 escrow)
/// @notice Trustless flow: owner commits solution hash, players submit commits, then reveal, then settle by distance.
contract GeoBetsGame is Ownable {
    using SafeERC20 for IERC20;

    struct Game {
        // Owner commits bytes32 hash of the solution: keccak256(abi.encode(latE6, lonE6, secret))
        bytes32 solutionCommit;
        // ERC20 token used for escrow
        IERC20 token;
        // Unix timestamp when committing closes (no new player commits)
        uint64 commitDeadline;
        // Unix timestamp when reveal closes (no more reveals)
        uint64 revealDeadline;
        // Whether solution has been revealed
        bool solutionRevealed;
        // Solution coordinates scaled by 1e6
        int32 solutionLatE6;
        int32 solutionLonE6;
        // Total escrowed amount
        uint256 totalEscrow;
        // Creator/host who can trigger settlement after reveal window
        address host;
    // Number of participants (committed players)
    uint32 participantCount;
    }

    struct PlayerBet {
        // Commit hash: keccak256(abi.encode(latE6, lonE6, salt))
        bytes32 commit;
        uint96 amount;
        bool revealed;
        // Revealed data cached for settlement
        int32 latE6;
        int32 lonE6;
    }

    // gameId => Game
    mapping(uint256 => Game) public games;
    // gameId => player => bet
    mapping(uint256 => mapping(address => PlayerBet)) public bets;

    uint256 public nextGameId = 1;

    event GameCreated(uint256 indexed gameId, address indexed host, address token, uint64 commitDeadline, uint64 revealDeadline);
    event PlayerCommitted(uint256 indexed gameId, address indexed player, uint256 amount);
    /// @notice Extended commit event with participant count & total escrow for easier indexing
    event PlayerCommittedStats(uint256 indexed gameId, uint32 participantCount, uint256 totalEscrow);
    event PlayerRevealed(uint256 indexed gameId, address indexed player, int32 latE6, int32 lonE6);
    event SolutionRevealed(uint256 indexed gameId, int32 latE6, int32 lonE6);
    event Settled(uint256 indexed gameId);
    event SettledWithShares(uint256 indexed gameId, address indexed player, uint256 share, uint256 amount);

    constructor(address owner_) Ownable(owner_) {}

    // Admin/host commits to a solution and game timings
    function createGame(bytes32 solutionCommit, IERC20 token, uint64 commitDeadline, uint64 revealDeadline)
        external
        returns (uint256 gameId)
    {
        require(solutionCommit != bytes32(0), "bad commit");
        require(address(token) != address(0), "bad token");
        require(commitDeadline > block.timestamp && revealDeadline > commitDeadline, "bad deadlines");
        gameId = nextGameId++;
        games[gameId] = Game({
            solutionCommit: solutionCommit,
            token: token,
            commitDeadline: commitDeadline,
            revealDeadline: revealDeadline,
            solutionRevealed: false,
            solutionLatE6: 0,
            solutionLonE6: 0,
            totalEscrow: 0,
            host: msg.sender
        });
        emit GameCreated(gameId, msg.sender, address(token), commitDeadline, revealDeadline);
    }

    // Player commits with escrowed amount pre-approved
    function commitGuess(uint256 gameId, bytes32 betCommit, uint96 amount) external {
        Game storage g = games[gameId];
        require(g.commitDeadline != 0, "no game");
        require(block.timestamp <= g.commitDeadline, "commit over");
        require(bets[gameId][msg.sender].commit == bytes32(0), "already committed");
        require(amount > 0, "amount=0");

        bets[gameId][msg.sender].commit = betCommit;
        bets[gameId][msg.sender].amount = amount;

        g.totalEscrow += amount;
    unchecked { g.participantCount += 1; }
        g.token.safeTransferFrom(msg.sender, address(this), amount);
        emit PlayerCommitted(gameId, msg.sender, amount);
    emit PlayerCommittedStats(gameId, g.participantCount, g.totalEscrow);
    }

    // Host reveals the solution coordinates with a secret proving the commit
    function revealSolution(uint256 gameId, int32 latE6, int32 lonE6, bytes32 secret) external {
        Game storage g = games[gameId];
        require(msg.sender == g.host || msg.sender == owner(), "not host");
        require(block.timestamp >= g.commitDeadline, "commit not over");
        require(block.timestamp <= g.revealDeadline, "reveal over");
        require(!g.solutionRevealed, "already revealed");
        require(keccak256(abi.encode(latE6, lonE6, secret)) == g.solutionCommit, "commit mismatch");

        g.solutionRevealed = true;
        g.solutionLatE6 = latE6;
        g.solutionLonE6 = lonE6;
        emit SolutionRevealed(gameId, latE6, lonE6);
    }

    // Player reveals their guess
    function revealGuess(uint256 gameId, int32 latE6, int32 lonE6, bytes32 salt) external {
        Game storage g = games[gameId];
        require(block.timestamp >= g.commitDeadline, "commit not over");
        require(block.timestamp <= g.revealDeadline, "reveal over");
        PlayerBet storage b = bets[gameId][msg.sender];
        require(b.commit != bytes32(0), "no commit");
        require(!b.revealed, "already revealed");
        require(keccak256(abi.encode(latE6, lonE6, salt)) == b.commit, "commit mismatch");

        b.revealed = true;
        b.latE6 = latE6;
        b.lonE6 = lonE6;
        emit PlayerRevealed(gameId, msg.sender, latE6, lonE6);
    }
    
    // Off-chain calculation: distribute escrow according to provided shares (weights), proportional split.
    // Host or owner can settle after reveal window.
    function settleWithShares(uint256 gameId, address[] calldata players, uint256[] calldata shares) external {
        Game storage g = games[gameId];
        require(block.timestamp > g.revealDeadline, "not ended");
        require(g.solutionRevealed, "no solution");
        require(msg.sender == g.host || msg.sender == owner(), "not host");
        require(players.length == shares.length, "len mismatch");

        uint256 totalWeighted;
        uint256 maxWeight;
        uint256 maxIdx;
        for (uint256 i = 0; i < players.length; i++) {
            PlayerBet storage b = bets[gameId][players[i]];
            if (!b.revealed || b.amount == 0) continue;
            uint256 weight = shares[i];
            totalWeighted += weight;
            if (weight > maxWeight) { maxWeight = weight; maxIdx = i; }
        }

        uint256 escrow = g.totalEscrow;
        g.totalEscrow = 0; // prevent reentrancy on re-settlement

        if (totalWeighted == 0) {
            // If nobody revealed or all too far, funds return to host
            g.token.safeTransfer(g.host, escrow);
            emit Settled(gameId);
            return;
        }

        uint256 distributed;
        for (uint256 i = 0; i < players.length; i++) {
            uint256 weight = shares[i];
            if (weight == 0) continue;
            uint256 amount = (escrow * weight) / totalWeighted;
            if (amount == 0) continue;
            g.token.safeTransfer(players[i], amount);
            distributed += amount;
            emit SettledWithShares(gameId, players[i], weight, amount);
        }
        // Distribute any dust remainder to the largest-weight player to ensure full escrow payout
        if (escrow > distributed && maxWeight > 0) {
            g.token.safeTransfer(players[maxIdx], escrow - distributed);
        }
        emit Settled(gameId);
    }
}


