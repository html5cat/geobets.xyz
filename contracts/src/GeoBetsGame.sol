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
    }

    struct PlayerBet {
        // Commit hash: keccak256(abi.encode(latE6, lonE6, confidenceBps, salt))
        bytes32 commit;
        uint96 amount;
        bool revealed;
        // Revealed data cached for settlement
        int32 latE6;
        int32 lonE6;
        uint16 confidenceBps; // 0 - 10000 (basis points)
    }

    // gameId => Game
    mapping(uint256 => Game) public games;
    // gameId => player => bet
    mapping(uint256 => mapping(address => PlayerBet)) public bets;

    uint256 public nextGameId = 1;

    event GameCreated(uint256 indexed gameId, address indexed host, address token, uint64 commitDeadline, uint64 revealDeadline);
    event PlayerCommitted(uint256 indexed gameId, address indexed player, uint256 amount);
    event PlayerRevealed(uint256 indexed gameId, address indexed player, int32 latE6, int32 lonE6, uint16 confidenceBps);
    event SolutionRevealed(uint256 indexed gameId, int32 latE6, int32 lonE6);
    event Settled(uint256 indexed gameId);

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
        g.token.safeTransferFrom(msg.sender, address(this), amount);
        emit PlayerCommitted(gameId, msg.sender, amount);
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

    // Player reveals their guess and confidence
    function revealGuess(uint256 gameId, int32 latE6, int32 lonE6, uint16 confidenceBps, bytes32 salt) external {
        Game storage g = games[gameId];
        require(block.timestamp >= g.commitDeadline, "commit not over");
        require(block.timestamp <= g.revealDeadline, "reveal over");
        PlayerBet storage b = bets[gameId][msg.sender];
        require(b.commit != bytes32(0), "no commit");
        require(!b.revealed, "already revealed");
        require(confidenceBps <= 10000, "bad conf");
        require(keccak256(abi.encode(latE6, lonE6, confidenceBps, salt)) == b.commit, "commit mismatch");

        b.revealed = true;
        b.latE6 = latE6;
        b.lonE6 = lonE6;
        b.confidenceBps = confidenceBps;
        emit PlayerRevealed(gameId, msg.sender, latE6, lonE6, confidenceBps);
    }

    // Approximate distance using a simple equirectangular on degrees without cosine scaling for longitude.
    // Good enough for game payouts; returns meters. Inputs are degrees scaled by 1e6.
    function distanceMeters(int32 lat1E6, int32 lon1E6, int32 lat2E6, int32 lon2E6) public pure returns (uint256) {
        int256 dLatE6 = int256(int64(lat2E6)) - int256(int64(lat1E6));
        int256 dLonE6 = int256(int64(lon2E6)) - int256(int64(lon1E6));
        // meters per degree ~ 111,320
        int256 metersPerDeg = 111_320;
        int256 dLatM = (dLatE6 * metersPerDeg) / 1e6;
        int256 dLonM = (dLonE6 * metersPerDeg) / 1e6; // ignores cos(latitude)
        uint256 distSquared = uint256((dLatM * dLatM) + (dLonM * dLonM));
        return _sqrt(distSquared);
    }

    function _sqrt(uint256 x) internal pure returns (uint256 y) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    // Simple payout curve: closer distance gets higher multiplier up to 2x, fades to 0x beyond 2000km.
    // confidenceBps increases stake linearly.
    function payoutMultiplierBps(uint256 distanceM) public pure returns (uint16) {
        // 0m => 20000 bps (2.0x), 2000km => 0 bps
        if (distanceM >= 2_000_000) return 0;
        uint256 bps = 20000 - (distanceM * 20000) / 2_000_000;
        return uint16(bps);
    }

    // Anyone can settle after reveal window; distributes escrow proportionally by multipliers among revealed players.
    function settle(uint256 gameId, address[] calldata players) external {
        Game storage g = games[gameId];
        require(block.timestamp > g.revealDeadline, "not ended");
        require(g.solutionRevealed, "no solution");

        uint256 totalWeighted;
        uint256[] memory weights = new uint256[](players.length);
        for (uint256 i = 0; i < players.length; i++) {
            PlayerBet storage b = bets[gameId][players[i]];
            if (!b.revealed || b.amount == 0) continue;
            uint256 d = distanceMeters(b.latE6, b.lonE6, g.solutionLatE6, g.solutionLonE6);
            uint256 mulBps = payoutMultiplierBps(d);
            uint256 weight = (uint256(b.amount) * mulBps * b.confidenceBps) / 1e4; // scale by bps
            weights[i] = weight;
            totalWeighted += weight;
        }

        uint256 escrow = g.totalEscrow;
        g.totalEscrow = 0; // prevent reentrancy on re-settlement

        if (totalWeighted == 0) {
            // If nobody revealed or all too far, funds return to host
            g.token.safeTransfer(g.host, escrow);
            emit Settled(gameId);
            return;
        }

        for (uint256 i = 0; i < players.length; i++) {
            uint256 weight = weights[i];
            if (weight == 0) continue;
            uint256 share = (escrow * weight) / totalWeighted;
            g.token.safeTransfer(players[i], share);
        }
        emit Settled(gameId);
    }
}


