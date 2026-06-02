import { HederaAgentKit } from "@hashgraphonline/hedera-agent-kit";

export async function transferHbar(
  agent: HederaAgentKit,
  toAccountId: string,
  amount: number
) {
  return agent.transferHbar(toAccountId, amount);
}
