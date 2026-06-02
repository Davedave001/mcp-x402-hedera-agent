import { Client, TransferTransaction, AccountId, Hbar } from "@hashgraph/sdk";

export async function transferHbar(
  client: Client,
  toAccountId: string,
  amount: number
) {
  const operatorId = client.operatorAccountId!;
  const tx = await new TransferTransaction()
    .addHbarTransfer(operatorId, new Hbar(-amount))
    .addHbarTransfer(AccountId.fromString(toAccountId), new Hbar(amount))
    .execute(client);
  const receipt = await tx.getReceipt(client);
  return { status: receipt.status.toString(), txId: tx.transactionId.toString() };
}
