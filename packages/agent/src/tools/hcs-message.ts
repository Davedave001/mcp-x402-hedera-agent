import { HederaAgentKit } from "@hashgraphonline/hedera-agent-kit";

export async function sendHcsMessage(
  agent: HederaAgentKit,
  topicId: string,
  message: string
) {
  return agent.submitMessageToTopic(topicId, message);
}
