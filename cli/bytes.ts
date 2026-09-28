export { fromHex, toHex, randomSecret } from "../src/lib/bytes";
import { encodeProposal } from "../src/lib/bytes";
export const proposalId = encodeProposal;
