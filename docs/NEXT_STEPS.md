# Next Steps

- Landing page
  - Fetch `/api/games` and annotate images with live games (badge + time left)
  - Add CTA per image: Join open game or Start new game (POST `/api/games`)

- Image game page (`/images/[id]`)
  - If multiple open games for image, show selector; else allow start new
  - Show commit deadline countdown
  - Add GEO approve flow before commit (if allowance < amount)
  - After reveal window, admin tool: compute shares off-chain and call `settleWithShares`

- Profile
  - Read bets from `/api/bets?player=address` and render history (commit/reveal txs, results)
  - Link BaseScan txs; show per-game outcome once settled

- Backend
  - `/api/bets` GET by player/game; basic validation (zod)
  - Post-reveal share computation job (manual first, later cron)
  - Harden `/api/games` auth for server key + input validation

- Contracts (optional niceties)
  - Emit participant count/escrow on commit for easier indexing

- Infra & Ops
  - Vercel envs: `DATABASE_URL`, `SERVER_PRIVATE_KEY`, `BASE_SEPOLIA_RPC_HTTP`, `NEXT_PUBLIC_*`
  - CI: `forge build && forge test`, `npm run build`
  - Images in R2/S3/Supabase with signed URLs; DB backups

- UX polish
  - Toasts for commit/reveal/claim
  - Loading/error states; mobile map gestures and marker tweaks
