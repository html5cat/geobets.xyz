## GeoBets.xyz: High-level Architecture

### Overview
GeoBets is a GeoGuessr-style game with ERC20 betting and a trustless commit–reveal flow. Settlement is off-chain via proportional shares.

### Components
- **Frontend (`web`)**: Next.js app using Wagmi + Viem and Porto connector for wallets.
  - Map UI (Leaflet) for placing a guess; custom black SVG marker
  - No confidence; simple commit/reveal
  - Calls contracts to: claim GEO, create game, commit guess, reveal, settleWithShares (host)

- **Smart Contracts (`contracts`)** (Foundry):
  - `GeoToken`: ERC20 GEO with a faucet-like one-time `claim()` per address.
- `GeoBetsGame`: Game registry and escrow in GEO (off-chain settlement):
    - `createGame(solutionCommit, token, commitDeadline, revealDeadline)`
    - `commitGuess(gameId, betCommit, amount)` transfers GEO into escrow
    - `revealSolution(latE6, lonE6, secret)` matches `keccak256(abi.encode(latE6, lonE6, secret))`
    - `revealGuess(latE6, lonE6, salt)` matches the player's commit
    - `settleWithShares(gameId, players[], shares[])` distributes escrow per provided shares

### Trustless Flow
1. Host creates game and commits the correct location hash on-chain.
2. Players commit guesses with amounts (escrowed) within `commitDeadline`.
3. Host reveals solution within `revealDeadline` by providing coordinates + secret.
4. Players reveal guesses; contract checks commit integrity.
5. Settlement distributes escrow proportional to a payout multiplier and confidence.

### Settlement
- Calculate results off-chain (server computes distances and assigns shares), then host calls `settleWithShares` to split escrow.

### Networks
- Target: Base Sepolia for test, Base mainnet for production.

### Security & Fairness
- Commit–reveal prevents host or players from changing answers post-hoc.
- All token flows are via escrow in `GeoBetsGame`.
- Consider a dispute window or trusted resolver for edge-cases.

### Backoffice / Ops
- Curate photos and store `(latE6, lonE6)` server-side only in Postgres; never send coords to the client.
- Server generates `secret` and derives `solutionCommit = keccak256(abi.encode(latE6, lonE6, secret))`, then starts a game.
- After reveals, server computes shares and host triggers `settleWithShares()`.


