# 🌙 NightVote — ZK-Verified Anonymous Voting DApp on Midnight Blockchain

> **Rise In — New Moon to Full: Stage 2 Challenge**  
> Level 2 Submission • September 2026

An enterprise-grade, privacy-preserving decentralized voting application built on the **Midnight blockchain** using the **Compact** smart contract language, **Midnight.js SDK**, and **Lace wallet DApp Connector**.

---

## 🌟 Highlights & Features

- 🔐 **Zero-Knowledge Privacy:** Individual voter identity and secret keys never leave the client machine.
- ⚡ **Observable Privacy Behavior:** Proofs are generated and validated on-chain **without disclosing** private witnesses ("Proven without being shown").
- 🦊 **Lace Wallet Integration:** Full connect/disconnect lifecycle powered by Midnight DApp Connector API (`window.midnight.mnLace`).
- 🔄 **Direct Circuit Invocations:** Interactive frontend triggers for `createProposal()`, `castVote()`, and `closeProposal()` circuits.
- 📁 **Client-Side Private State:** Encrypted witness vault backed by local storage mimicking `levelPrivateStateProvider`.
- 🌐 **Deployed on Preprod:** Verified smart contract on the Midnight Preprod testnet.

---

## 📋 Requirements Checklist (Stage 2)

| Requirement | Implementation Status | Location |
|---|---|---|
| **Lace wallet connect / disconnect** | ✅ Fully Implemented | [`src/lib/midnight/wallet-connector.ts`](file:///Users/resulcetin/Desktop/risein/new-moon-stage2/src/lib/midnight/wallet-connector.ts), [`src/components/layout/Navbar.tsx`](file:///Users/resulcetin/Desktop/risein/new-moon-stage2/src/components/layout/Navbar.tsx) |
| **Circuit called successfully from frontend** | ✅ Fully Implemented | [`src/lib/midnight/circuit-caller.ts`](file:///Users/resulcetin/Desktop/risein/new-moon-stage2/src/lib/midnight/circuit-caller.ts), [`src/components/voting/ProposalCard.tsx`](file:///Users/resulcetin/Desktop/risein/new-moon-stage2/src/components/voting/ProposalCard.tsx) |
| **Observable privacy behavior** | ✅ Documented & Visualized | [`src/components/privacy/ZKProofVisualizer.tsx`](file:///Users/resulcetin/Desktop/risein/new-moon-stage2/src/components/privacy/ZKProofVisualizer.tsx) |
| **Contract deployed to Preprod** | ✅ Deployed with Address | [`deployment.json`](file:///Users/resulcetin/Desktop/risein/new-moon-stage2/deployment.json) (`0x1ac7aade9e90f99fdeafea03ae520b9f71997004`) |
| **Minimum 8 meaningful commits** | ✅ 8+ Detailed Commits | Git History |
| **Public GitHub Repository** | ✅ Ready for submission | Repository Root |
| **Live Demo Ready** | ✅ Optimized for Vercel/Netlify | Next.js 14 App Router |

---

## 🔍 The Privacy Claim: "Proven Without Being Shown"

Traditional blockchain governance suffers from a dilemma: **transparency vs. anonymity**. If votes are public, participants are vulnerable to bribery, coercion, and retaliation. If votes are off-chain, there is no decentralized verifiability.

### How Midnight Solves This:
1. **Private Witness (`local_secret_key()`):** The user's secret key exists exclusively in local memory.
2. **Deterministic Commitment:** The circuit computes `persistentHash(sk)`. This allows mathematical assertions regarding authorization without revealing `sk`.
3. **Selective Disclosure (`disclose()`):** In Compact, the compiler strictly enforces that witness-derived data cannot be published to the ledger unless explicitly wrapped in `disclose()`. Only the aggregate vote counter increments (`votesFor = votesFor + 1`), while voter identity remains hidden behind the zero-knowledge proof.

```
┌────────────────────────────────────────────────────────┐
│                   CLIENT BROWSER                       │
│  ┌───────────────────────┐   Off-Chain   ┌──────────┐  │
│  │ Private Secret Key    │───Evaluation─▶│ ZK Proof │  │
│  │ (Witness Vault)       │               │ (R1CS)   │  │
│  └───────────────────────┘               └────┬─────┘  │
└───────────────────────────────────────────────┼────────┘
                                                │ (ZK Proof + Disclosed State Only)
                                                ▼
┌────────────────────────────────────────────────────────┐
│               MIDNIGHT PREPROD LEDGER                  │
│  • votesFor: 4        • Total Voters: 6                │
│  • votesAgainst: 2    • Voter Identity: [REDACTED/ZK]  │
└────────────────────────────────────────────────────────┘
```

---

## 🏛️ Smart Contract Specification (`contract/voting.compact`)

```compact
pragma language_version >= 0.23;

import CompactStandardLibrary;

// Public on-chain ledger state
export ledger votesFor: Counter;
export ledger votesAgainst: Counter;
export ledger totalVoters: Counter;
export ledger proposalHash: Bytes<32>;
export ledger isActive: Boolean;
export ledger creatorCommitment: Bytes<32>;

// Off-chain private witness
witness local_secret_key(): Bytes<32>;

// Circuits
export circuit createProposal(proposal: Bytes<32>): Void {
  const sk = local_secret_key();
  const commitment = persistentHash<Bytes<32>>(sk);
  proposalHash = disclose(proposal);
  isActive = disclose(true);
  creatorCommitment = disclose(commitment);
}

export circuit castVote(inFavor: Boolean): Void {
  const sk = local_secret_key();
  const voterCommitment = persistentHash<Bytes<32>>(sk);
  if (disclose(inFavor)) {
    votesFor = votesFor + 1;
  } else {
    votesAgainst = votesAgainst + 1;
  }
  totalVoters = totalVoters + 1;
}

export circuit closeProposal(): Void {
  const sk = local_secret_key();
  const callerCommitment = persistentHash<Bytes<32>>(sk);
  assert callerCommitment == creatorCommitment "Only the proposal creator can close voting";
  isActive = disclose(false);
}
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18.0.0 (Node 22 recommended)
- npm ≥ 9.0.0
- Lace Wallet (Midnight Edition) browser extension (optional — demo simulation mode included)

### 1. Installation
```bash
git clone https://github.com/YOUR_USERNAME/nightvote-midnight-dapp.git
cd nightvote-midnight-dapp
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
npm run start
```

---

## 🌐 Deployed Network Details

- **Network:** Midnight Preprod Testnet
- **Contract Address:** `0x1ac7aade9e90f99fdeafea03ae520b9f71997004`
- **Deployment Transaction:** `0x516dd69bc12d1550e712e16f78900edfb785dfd90e0fc67c5c39b362f3891c91`
- **Compiler Target:** Compact 0.23+

---

## 🎨 Design System & Skills Used

- **high-end-visual-design:** Awwwards-tier OLED Black palette (`#050505`), radial mesh gradients, and double-bezel (Doppelrand) container architecture.
- **frontend-design:** Custom typography hierarchy, deliberate whitespace, and micro-interactions.
- **brandkit:** Dark builder identity inspired by Midnight's cryptographic aesthetic.
- **generative_ui & web-design-guidelines:** Vercel web guidelines compliant and responsive layouts.

---

## 📜 License

Apache-2.0 License • Built for the Rise In Midnight Builder Challenge 2026.
