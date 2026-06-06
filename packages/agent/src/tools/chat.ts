import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@hashgraph/sdk";
import { getBalance } from "./balance.js";
import { sendHcsMessage } from "./hcs-message.js";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const TOOLS: Anthropic.Tool[] = [
  {
    name: "get_hbar_balance",
    description: "Get the HBAR balance and token holdings for a Hedera account. Use this when the user asks about their balance, funds, or tokens.",
    input_schema: {
      type: "object",
      properties: {
        accountId: { type: "string", description: "Hedera account ID e.g. 0.0.12345" },
      },
      required: ["accountId"],
    },
  },
  {
    name: "send_hcs_message",
    description: "Post a message to a Hedera Consensus Service topic on behalf of the user.",
    input_schema: {
      type: "object",
      properties: {
        topicId: { type: "string", description: "HCS topic ID e.g. 0.0.9146759" },
        message: { type: "string", description: "Message to post" },
      },
      required: ["topicId", "message"],
    },
  },
];

export async function handleChat(
  apiKey: string,
  hederaClient: Client,
  userMessage: string,
  history: ChatMessage[],
  accountId: string
): Promise<{ response: string; history: ChatMessage[] }> {
  const ai = new Anthropic({ apiKey });

  const messages: Anthropic.MessageParam[] = [
    ...history.map((h) => ({ role: h.role as "user" | "assistant", content: h.content })),
    { role: "user", content: userMessage },
  ];

  const system = `You are a friendly Hedera blockchain assistant built into the Hedera x402 Agent app.
The user's connected Hedera account is ${accountId}.
- When they ask about their balance or wallet, call get_hbar_balance with their account.
- Format HBAR amounts nicely (e.g. "5,368 ℏ").
- Keep responses concise, warm, and emoji-light.
- If you send an HCS message, confirm the topic and transaction ID.
- Never expose private keys or sensitive info.`;

  let res = await ai.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system,
    tools: TOOLS,
    messages,
  });

  // Agentic tool loop
  while (res.stop_reason === "tool_use") {
    const toolBlocks = res.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of toolBlocks) {
      const input = block.input as Record<string, string>;
      let result: unknown;
      try {
        if (block.name === "get_hbar_balance") {
          result = await getBalance(hederaClient, input.accountId ?? accountId);
        } else if (block.name === "send_hcs_message") {
          result = await sendHcsMessage(hederaClient, input.topicId, input.message);
        } else {
          result = { error: "Unknown tool" };
        }
      } catch (err) {
        result = { error: String(err) };
      }
      toolResults.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(result) });
    }

    messages.push({ role: "assistant", content: res.content });
    messages.push({ role: "user", content: toolResults });

    res = await ai.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system,
      tools: TOOLS,
      messages,
    });
  }

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const newHistory: ChatMessage[] = [
    ...history,
    { role: "user", content: userMessage },
    { role: "assistant", content: text },
  ];

  return { response: text, history: newHistory };
}
