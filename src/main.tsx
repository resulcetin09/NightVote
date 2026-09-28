import "./lib/browser-globals";
import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/public-sans";
import "./styles.css";
import App from "./App";

class ErrorBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="fatal">
          <h1>NightVote stopped.</h1>
          <p>Reload the page to clear private data held in memory and start again. Nothing was submitted without your wallet’s approval.</p>
          <a className="button primary" href={window.location.pathname}>Reload</a>
        </main>
      );
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
