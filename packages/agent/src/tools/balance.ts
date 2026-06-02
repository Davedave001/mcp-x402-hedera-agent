import { Client, AccountBalanceQuery, AccountId } from "@hashgraph/sdk";

export async function getBalance(client: Client, accountId: string) {
  const balance = await new AccountBalanceQuery()
    .setAccountId(AccountId.fromString(accountId))
    .execute(client);
  return { hbars: balance.hbars.toString(), tokens: balance.tokens?.toJSON() };
}
