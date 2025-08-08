## GeoBets.xyz: High-level Architecture

### Overview
GeoBets is a GeoGuessr-style game with ERC20 betting and a trustless commit–reveal flow.

### Components
- **Frontend (`web`)**: Next.js app using Wagmi + Viem and Porto connector for wallets.
  - Map UI (Leaflet) for placing a guess
  - Confidence slider (basis points) that affects stake weight
  - Calls contracts to: claim GEO, create game, commit guess, reveal, settle

- **Smart Contracts (`contracts`)** (Foundry):
  - `GeoToken`: ERC20 GEO with a faucet-like one-time `claim()` per address.
  - `GeoBetsGame`: Game registry and escrow in GEO:
    - `createGame(solutionCommit, token, commitDeadline, revealDeadline)`
    - `commitGuess(gameId, betCommit, amount)` transfers GEO into escrow
    - `revealSolution(latE6, lonE6, secret)` matches `keccak256(abi.encode(latE6, lonE6, secret))`
    - `revealGuess(latE6, lonE6, confidenceBps, salt)` matches the player's commit
    - `settle(gameId, players[])` distributes escrow based on distance multiplier and confidence

### Trustless Flow
1. Host creates game and commits the correct location hash on-chain.
2. Players commit guesses with amounts (escrowed) within `commitDeadline`.
3. Host reveals solution within `revealDeadline` by providing coordinates + secret.
4. Players reveal guesses; contract checks commit integrity.
5. Settlement distributes escrow proportional to a payout multiplier and confidence.

### Distance Computation
- Calculations can be done off-chain for UX; on-chain logic includes a simple approximation to derive a payout multiplier curve. You can also pre-compute multipliers off-chain and pass them to settlement, if desired, to reduce gas.

### Networks
- Target: Base Sepolia for test, Base mainnet for production.

### Security & Fairness
- Commit–reveal prevents host or players from changing answers post-hoc.
- All token flows are via escrow in `GeoBetsGame`.
- Consider a dispute window or trusted resolver for edge-cases.

### Backoffice / Ops
- Curate photos and produce `(lat,lon,secret)` for each round.
- Derive `solutionCommit = keccak256(abi.encode(latE6, lonE6, secret))` and start a game.
- After reveals, trigger `settle()` with participant addresses.


