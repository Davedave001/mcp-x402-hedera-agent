import "dotenv/config";
import { Client, AccountId, PrivateKey } from "@hashgraph/sdk";

export function createClient(): Client {
  const accountId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const privateKey = PrivateKey.fromStringDer(process.env.HEDERA_PRIVATE_KEY!);

  const client =
    process.env.HEDERA_NETWORK === "mainnet"
      ? Client.forMainnet()
      : Client.forTestnet();

  client.setOperator(accountId, privateKey);
  return client;
}
