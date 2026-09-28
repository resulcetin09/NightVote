export function PrivacyView() {
  return (
    <section className="sheet prose">
      <h1>What stays private</h1>
      <p className="lede">
        NightVote gives you anonymous ballots, not secret ballots. Everyone can see each ballot’s choice and the running
        count. Nobody can see which member cast it.
      </p>

      <table className="ledger">
        <thead>
          <tr>
            <th scope="col">Anyone on Preview can see</th>
            <th scope="col">Only you know</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>How many members are on the roll, and a fingerprint (Merkle root) of it</td>
            <td>Which entry on the roll is yours</td>
          </tr>
          <tr>
            <td>Each proposal’s text and its yes and no counts</td>
            <td>Your voter key</td>
          </tr>
          <tr>
            <td>That a ballot was cast, whether it was yes or no, and its nullifier</td>
            <td>That the ballot was yours</td>
          </tr>
          <tr>
            <td>When the transaction happened and which wallet paid its fee</td>
            <td>The proof inputs, which stay on your local proof server</td>
          </tr>
        </tbody>
      </table>

      <h2>What the contract checks</h2>
      <p>
        These rules run inside the zero-knowledge circuit. A modified app cannot skip them, because the network rejects a
        proof that breaks one.
      </p>
      <ul>
        <li>The ballot comes from a key on the sealed roll. The proof shows this without revealing which key.</li>
        <li>
          The key has not voted on this proposal before. Each ballot publishes a nullifier derived from the key and the
          proposal. A repeat produces the same nullifier and is rejected.
        </li>
        <li>The proposal is the one currently open. Ballots for a closed or different proposal are rejected.</li>
        <li>Only the organizer can register members, seal the roll, and open or close proposals.</li>
      </ul>
      <p>
        Nullifiers differ between proposals, so your ballots on two proposals cannot be linked to each other.
      </p>

      <h2>Where anonymity can weaken</h2>
      <ul>
        <li>
          <strong>Small groups.</strong> If three people vote and all three choose yes, everyone knows how each of them
          voted. Anonymity grows with the number of members voting.
        </li>
        <li>
          <strong>The fee-paying wallet.</strong> The wallet that pays for your ballot is visible. Use a wallet that is not
          publicly tied to your name.
        </li>
        <li>
          <strong>Timing.</strong> Someone watching when you vote can match it to a ballot that appears at the same time.
        </li>
        <li>
          <strong>Who made your key.</strong> Create your voter key yourself. If the organizer made it for you, they can
          compute its nullifiers and see how you voted.
        </li>
        <li>
          <strong>Your device.</strong> The proof is built from your key on your machine and your local proof server. A
          compromised device can leak it.
        </li>
      </ul>

      <h2>Status</h2>
      <p>
        NightVote is a prototype on Preview, a Midnight test network. It has not been audited. Tokens there have no value.
        Do not use it for binding decisions.
      </p>
    </section>
  );
}
