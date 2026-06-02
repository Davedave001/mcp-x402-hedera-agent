import { HederaAgentKit } from "@hashgraphonline/hedera-agent-kit";

export async function getBalance(agent: HederaAgentKit, accountId: string) {
  return agent.getHbarBalance(accountId);
}
