import { Client, AccountBalanceQuery, AccountId } from "@hashgraph/sdk";

export async function getBalance(client: Client, accountId: string) {
  const balance = await new AccountBalanceQuery()
    .setAccountId(AccountId.fromString(accountId))
    .execute(client);

  // Iterate the TokenBalanceMap directly — .toJSON() returns Long objects
  // whose values serialize as [object Object]. Call .toString() explicitly.
  const tokens: Record<string, string> = {};
  if (balance.tokens) {
    for (const [tokenId, amount] of balance.tokens) {
      tokens[tokenId.toString()] = amount.toString();
    }
  }

  return {
    hbars: balance.hbars.toString(),
    tokens: Object.keys(tokens).length > 0 ? tokens : null,
  };
}
