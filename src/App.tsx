import { useCallback, useEffect, useRef, useState } from "react";
import { Mark } from "./components/Marks";
import { VoteView } from "./components/Vote";
import { OrganizeView } from "./components/Organize";
import { PrivacyView } from "./components/Privacy";
import { connectWallet, discoverWallets, type WalletSession } from "./lib/wallet";
import { safeError } from "./lib/errors";
import { shortId } from "./lib/bytes";
import type { MidnightClient, Phase } from "./lib/midnight";
import type { Busy } from "./session";

type View = "vote" | "organize" | "privacy";
const views: { id: View; label: string }[] = [
  { id: "vote", label: "Vote" },
  { id: "organize", label: "Run an election" },
  { id: "privacy", label: "What stays private" },
];

const initialView = (): View => {
  const hash = window.location.hash.slice(1);
  return views.some((v) => v.id === hash) ? (hash as View) : "vote";
};

export default function App() {
  const [view, setView] = useState<View>(initialView);
  const [wallet, setWallet] = useState<WalletSession | null>(null);
  const [client, setClient] = useState<MidnightClient | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [walletError, setWalletError] = useState("");
  const [busy, setBusy] = useState<Busy>(null);
  const busySetter = useRef<(b: Busy) => void>(setBusy);

  useEffect(() => {
    const onHash = () => setView(initialView());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = (next: View) => {
    window.location.hash = next;
    setView(next);
  };

  const connect = useCallback(async (): Promise<MidnightClient | null> => {
    if (client) return client;
    setWalletError("");
    const found = discoverWallets();
    if (found.length === 0) {
      setWalletError(
        "No Midnight wallet found. Install Lace with Midnight support, select Preview, then reload this page.",
      );
      return null;
    }
    setConnecting(true);
    try {
      const session = await connectWallet(found[0]);
      // The SDK is large; load it only once someone connects.
      const { createMidnightClient } = await import("./lib/midnight");
      const next = await createMidnightClient(
        session,
        (phase: Phase) => busySetter.current(phase),
      );
      setWallet(session);
      setClient(next);
      return next;
    } catch (error) {
      setWalletError(safeError(error));
      return null;
    } finally {
      setConnecting(false);
    }
  }, [client]);

  const disconnect = async () => {
    await client?.clear();
    setClient(null);
    setWallet(null);
  };

  const session = { wallet, client, connect, busy, setBusy, busySetter };

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="masthead">
        <div className="masthead-inner">
          <a className="brand" href="#vote" onClick={() => go("vote")}>
            <Mark />
            <span>NightVote</span>
          </a>
          <nav aria-label="Sections">
            {views.map((v) => (
              <a
                key={v.id}
                href={`#${v.id}`}
                aria-current={view === v.id ? "page" : undefined}
                onClick={() => setView(v.id)}
              >
                {v.label}
              </a>
            ))}
          </nav>
          <div className="wallet">
            {wallet ? (
              <>
                <span className="wallet-id" title={wallet.address}>
                  <span className="dot" aria-hidden="true" />
                  {wallet.name} on Preview, {shortId(wallet.address)}
                </span>
                <button className="button quiet" onClick={disconnect}>
                  Disconnect
                </button>
              </>
            ) : (
              <button className="button" onClick={connect} disabled={connecting}>
                {connecting ? "Connecting…" : "Connect wallet"}
              </button>
            )}
          </div>
        </div>
        {walletError && (
          <p className="wallet-error" role="alert">
            {walletError}
          </p>
        )}
      </header>

      <main id="main">
        {view === "vote" && <VoteView session={session} />}
        {view === "organize" && <OrganizeView session={session} />}
        {view === "privacy" && <PrivacyView />}
      </main>

      <footer className="colophon">
        <p>
          NightVote is a prototype running on Midnight Preview, a test network. It has not been audited. Do not use it
          for binding decisions.
        </p>
        <p>
          <a href="https://github.com/resulcetin09/NightVote">Source code</a>
          <a href="https://github.com/resulcetin09/new-moon-stage1">Contract and tests</a>
        </p>
      </footer>
    </>
  );
}

export type AppSession = {
  wallet: WalletSession | null;
  client: MidnightClient | null;
  connect: () => Promise<MidnightClient | null>;
  busy: Busy;
  setBusy: (b: Busy) => void;
  busySetter: React.MutableRefObject<(b: Busy) => void>;
};
