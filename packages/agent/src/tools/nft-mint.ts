import { Client, TokenMintTransaction, TokenId } from "@hashgraph/sdk";

export async function mintNft(
  client: Client,
  tokenId: string,
  metadata: Record<string, unknown>
) {
  const tx = await new TokenMintTransaction()
    .setTokenId(TokenId.fromString(tokenId))
    .addMetadata(Buffer.from(JSON.stringify(metadata)))
    .execute(client);
  const receipt = await tx.getReceipt(client);
  return {
    status: receipt.status.toString(),
    serials: receipt.serials.map((s) => s.toString()),
    txId: tx.transactionId.toString(),
  };
}
