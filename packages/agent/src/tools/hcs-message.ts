import { Client, TopicMessageSubmitTransaction, TopicId } from "@hashgraph/sdk";

export async function sendHcsMessage(
  client: Client,
  topicId: string,
  message: string
) {
  const tx = await new TopicMessageSubmitTransaction()
    .setTopicId(TopicId.fromString(topicId))
    .setMessage(message)
    .execute(client);
  const receipt = await tx.getReceipt(client);
  return { status: receipt.status.toString(), txId: tx.transactionId.toString() };
}
