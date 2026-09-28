export class UserError extends Error {}

// Never surface raw SDK or prover exceptions: they may include witness material.
export function safeError(error: unknown): string {
  // Development builds only: the raw error helps diagnose wallet/prover setup.
  if (import.meta.env.DEV) console.error("[nightvote]", error);
  if (error instanceof UserError) return error.message;
  const message = error instanceof Error ? error.message : "";
  if (/reject|denied|cancel/i.test(message))
    return "The request was declined in your wallet. Nothing was submitted.";
  if (/Already voted on this proposal/i.test(message))
    return "This voter key has already voted on this proposal. Each key votes once per proposal.";
  if (/not registered|not on the electoral roll|does not match voter/i.test(message))
    return "This voter key is not on the election’s roll. Ask the organizer to register your commitment before the roll is sealed.";
  if (/Proposal is not active|No proposal is active/i.test(message))
    return "Voting on this proposal has closed. Refresh the election to see what is open now.";
  if (/Organizer authorization/i.test(message))
    return "This organizer file does not control this election. Import the file created when it was deployed.";
  if (/registration is closed|already closed/i.test(message))
    return "The roll is already sealed. No more voters can be registered.";
  if (/Register at least one voter/i.test(message))
    return "Register at least one voter before sealing the roll.";
  if (/already registered/i.test(message))
    return "That commitment is already on the roll.";
  if (/Another proposal is already active/i.test(message))
    return "Close the current proposal before opening another.";
  if (/Proposal was already used/i.test(message))
    return "That proposal text was already used in this election. Change the wording to open a new one.";
  if (/Close voter registration/i.test(message))
    return "Seal the roll before opening a proposal.";
  if (/fetch|network|ECONN|timeout|timed out/i.test(message))
    return "The indexer or your local proof server did not respond. If you approved a transaction, check its status before trying again.";
  return "The operation did not complete. Check your wallet, the Preview network and your local proof server. Nothing has been confirmed.";
}

export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new UserError(message)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}
