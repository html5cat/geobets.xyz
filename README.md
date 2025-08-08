GeoBets.xyz

Monorepo:
- `web`: Next.js app (Porto + Wagmi, Viem, Leaflet, Tailwind, Drizzle + Neon)
- `contracts`: Foundry (GEO token + GeoBetsGame with commit/reveal and off-chain settlement)

Contracts (Base Sepolia)
- GeoToken: 0x9AC44a58A9e909adfEB4FAc7235B7c36491334dC
- GeoBetsGame: 0xd34A472456D4268CcADDb85389a8f2A5E431385d

Contracts: build/test/deploy
1) cd contracts
2) forge build && forge test -vv
3) export BASE_SEPOLIA_RPC_URL=...[Alchemy]
   export PRIVATE_KEY=0x...
   forge script script/Deploy.s.sol:DeployScript --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast -vvvv

Frontend env (web/.env.local)
- NEXT_PUBLIC_BASE_SEPOLIA_RPC_HTTP=... (Alchemy)
- NEXT_PUBLIC_GEO_TOKEN_ADDRESS=0x9AC44a58A9e909adfEB4FAc7235B7c36491334dC
- NEXT_PUBLIC_GEOBETS_GAME_ADDRESS=0xd34A472456D4268CcADDb85389a8f2A5E431385d
- DATABASE_URL=postgres://... (Neon connection string)
- BASE_SEPOLIA_RPC_HTTP=... (server-only)
- SERVER_PRIVATE_KEY=0x... (server wallet for createGame; do not expose client-side)

DB setup (Neon via Vercel Marketplace)
1) cd web && npm i
2) npm run db:gen && npm run db:migrate
3) npm run db:seed
4) npm run db:studio (optional UI)

Run web
- cd web && npm run dev

Key flows
- Landing: grid of curated images from Postgres (`/api/images`).
- Start game (server): POST `/api/games` creates on-chain game and stores server-only coords/secret; GET lists live games.
- Guess: commit `keccak256(abi.encode(int32 latE6, int32 lonE6, bytes32 salt))`, then reveal with coords + salt.
- Settle: off-chain computes shares; host calls `settleWithShares(players, shares)`.

Docs in `docs/`.


