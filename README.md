GeoBets.xyz

Monorepo:
- `web`: Next.js app (Porto + Wagmi, Viem, Leaflet, Tailwind)
- `contracts`: Foundry contracts (GEO token, GeoBetsGame commit-reveal escrow)

Quickstart
1. Install Foundry (see book.getfoundry.sh)
2. Contracts
   - cd contracts
   - cp .env.example .env and set RPC_URL / BASE_SEPOLIA_RPC_URL and PRIVATE_KEY
   - forge build
   - forge script script/Deploy.s.sol:DeployScript --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast --verify -vvvv
3. Web
   - cd web
   - npm i
   - npm run dev

Docs live in `docs/`.


