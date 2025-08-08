// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {GeoToken} from "../src/GeoToken.sol";

contract GeoTokenTest is Test {
    GeoToken geo;
    address alice = address(0xA11CE);

    function setUp() public {
        geo = new GeoToken("GEO", "GEO", 1_000e18, address(this));
    }

    function testClaimOnce() public {
        vm.prank(alice);
        geo.claim();
        assertEq(geo.balanceOf(alice), 1_000e18);

        vm.prank(alice);
        vm.expectRevert(bytes("Already claimed"));
        geo.claim();
    }
}


