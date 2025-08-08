import { Address } from "viem";

export const GEO_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_GEO_TOKEN_ADDRESS || "") as Address;
export const GEOBETS_GAME_ADDRESS = (process.env.NEXT_PUBLIC_GEOBETS_GAME_ADDRESS || "") as Address;

export const geoTokenAbi = [
  { type: "function", name: "claim", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] }
] as const;

export const geoBetsGameAbi = [
  { type: "function", name: "createGame", stateMutability: "nonpayable", inputs: [
      { name: "solutionCommit", type: "bytes32" },
      { name: "token", type: "address" },
      { name: "commitDeadline", type: "uint64" },
      { name: "revealDeadline", type: "uint64" }
    ], outputs: [{ type: "uint256" }] },
  { type: "function", name: "commitGuess", stateMutability: "nonpayable", inputs: [
      { name: "gameId", type: "uint256" },
      { name: "betCommit", type: "bytes32" },
      { name: "amount", type: "uint96" }
    ], outputs: [] },
  { type: "function", name: "revealGuess", stateMutability: "nonpayable", inputs: [
      { name: "gameId", type: "uint256" },
      { name: "latE6", type: "int32" },
      { name: "lonE6", type: "int32" },
      { name: "salt", type: "bytes32" }
    ], outputs: [] },
  { type: "function", name: "settleWithShares", stateMutability: "nonpayable", inputs: [
      { name: "gameId", type: "uint256" },
      { name: "players", type: "address[]" },
      { name: "shares", type: "uint256[]" }
    ], outputs: [] },
  { type: "event", name: "GameCreated", inputs: [
      { name: "gameId", type: "uint256", indexed: true },
      { name: "host", type: "address", indexed: true },
      { name: "token", type: "address", indexed: false },
      { name: "commitDeadline", type: "uint64", indexed: false },
      { name: "revealDeadline", type: "uint64", indexed: false }
    ], anonymous: false }
] as const;


