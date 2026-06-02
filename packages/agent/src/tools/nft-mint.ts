import { HederaAgentKit } from "@hashgraphonline/hedera-agent-kit";

export async function mintNft(
  agent: HederaAgentKit,
  tokenId: string,
  metadata: Record<string, unknown>
) {
  const encoded = Buffer.from(JSON.stringify(metadata)).toString("base64");
  return agent.mintNft(tokenId, [encoded]);
}
