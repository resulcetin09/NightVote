# Deployment evidence

`preview.json` is written by `npm run deploy:preview` after a real deployment
and contains only public data: contract address, election ID, organizer
commitment, verifier-key hashes and the finalized transaction IDs/block heights
reported by the indexer. Secrets stay in the git-ignored `.secrets/` folder.

Anyone can re-check it without a wallet:

```sh
npm ci && npm run setup:compact && npm run compile
npm run verify:preview
```

`preview.json` records the deployment of
`f57ed2c48d73b5aff2036bd67fb8d826fe3b4447c8b0989a4f1c24003b7ff186`,
observed with `npm run inspect:preview -- <address> --save`.
