// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {GeoToken} from "../src/GeoToken.sol";
import {GeoBetsGame} from "../src/GeoBetsGame.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address owner = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);
        GeoToken geo = new GeoToken("GEO", "GEO", 1_000_000e18, owner);
        GeoBetsGame game = new GeoBetsGame(owner);
        console.log("GEO:", address(geo));
        console.log("GeoBetsGame:", address(game));
        vm.stopBroadcast();
    }
}


