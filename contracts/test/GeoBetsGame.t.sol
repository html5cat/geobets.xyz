// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {GeoToken} from "../src/GeoToken.sol";
import {GeoBetsGame} from "../src/GeoBetsGame.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract GeoBetsGameTest is Test {
    GeoToken geo;
    GeoBetsGame game;
    address host = address(this);
    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    function setUp() public {
        geo = new GeoToken("GEO", "GEO", 1_000e18, address(this));
        game = new GeoBetsGame(address(this));

        // fund players
        geo.airdrop(alice, 1_000e18);
        geo.airdrop(bob, 1_000e18);
    }

    function testCommitRevealSettle() public {
        // solution: 37.7749,-122.4194 (scaled)
        int32 lat = int32(37_774900);
        int32 lon = int32(-122_419400);
        bytes32 secret = keccak256("s");
        bytes32 solutionCommit = keccak256(abi.encode(lat, lon, secret));

        uint64 nowTs = uint64(block.timestamp);
        uint64 commitDeadline = nowTs + 1 hours;
        uint64 revealDeadline = commitDeadline + 1 hours;

        uint256 gameId = game.createGame(solutionCommit, IERC20(address(geo)), commitDeadline, revealDeadline);

        // Alice commit (very close to solution)
        {
            int32 aLat = int32(37_774900); // exact
            int32 aLon = int32(-122_419400); // exact
            bytes32 salt = keccak256("a");
            bytes32 c = keccak256(abi.encode(aLat, aLon, salt));
            vm.prank(alice);
            geo.approve(address(game), 100e18);
            vm.prank(alice);
            game.commitGuess(gameId, c, 100e18);
        }

        // Bob commit (nearby but not perfect)
        {
            int32 bLat = int32(37_600000);
            int32 bLon = int32(-122_200000);
            bytes32 salt = keccak256("b");
            bytes32 c = keccak256(abi.encode(bLat, bLon, salt));
            vm.prank(bob);
            geo.approve(address(game), 100e18);
            vm.prank(bob);
            game.commitGuess(gameId, c, 100e18);
        }

        // time travel to reveal
        vm.warp(commitDeadline + 1);

        // host reveal
        game.revealSolution(gameId, lat, lon, secret);

        // players reveal
        {
            int32 aLat = int32(37_774900);
            int32 aLon = int32(-122_419400);
            bytes32 salt = keccak256("a");
            vm.prank(alice);
            game.revealGuess(gameId, aLat, aLon, salt);
        }
        {
            int32 bLat = int32(37_600000);
            int32 bLon = int32(-122_200000);
            bytes32 salt = keccak256("b");
            vm.prank(bob);
            game.revealGuess(gameId, bLat, bLon, salt);
        }

        // settle after deadline with off-chain computed shares (e.g., Alice better -> share 2, Bob -> 1)
        vm.warp(revealDeadline + 1);
        address[] memory players = new address[](2);
        players[0] = alice;
        players[1] = bob;
        uint256[] memory shares = new uint256[](2);
        shares[0] = 2;
        shares[1] = 1;
        uint256 balanceBefore = geo.balanceOf(alice) + geo.balanceOf(bob);
        game.settleWithShares(gameId, players, shares);
        uint256 balanceAfter = geo.balanceOf(alice) + geo.balanceOf(bob);
        assertEq(balanceAfter, balanceBefore + 200e18); // escrow 200 went out
    }
}


