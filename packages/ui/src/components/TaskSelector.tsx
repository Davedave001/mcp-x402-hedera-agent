import { Icon } from "@iconify/react";

export interface Task {
  id: string;
  label: string;
  price: string;
  color: "green" | "blue" | "orange";
  icon: string;
  params: Record<string, unknown>;
}

export const TASKS: Task[] = [
  {
    id: "get_balance",
    label: "Get HBAR Balance",
    price: "1 ℏ",
    color: "green",
    icon: "mdi:wallet-outline",
    params: { accountId: "0.0.6188111" },
  },
  {
    id: "send_hcs_message",
    label: "Post HCS Message",
    price: "1 ℏ",
    color: "blue",
    icon: "mdi:message-text-outline",
    params: { topicId: "0.0.9146759", message: "Hello from Hedera x402 Agent!" },
  },
  {
    id: "mint_nft",
    label: "Mint NFT",
    price: "1 ℏ",
    color: "orange",
    icon: "mdi:image-plus-outline",
    params: { tokenId: "0.0.9146760", metadata: { name: "Hedera x402 NFT", version: "1" } },
  },
];

interface Props {
  disabled: boolean;
  onRun: (taskId: string, params: Record<string, unknown>) => void;
}

export function TaskSelector({ disabled, onRun }: Props) {
  return (
    <div className="tools-section">
      <h3><Icon icon="mdi:tools" width={13} /> Agent Tools</h3>
      <ul className="tool-list">
        {TASKS.map((task) => (
          <li key={task.id} className="tool-card">
            <div className={`tool-icon ${task.color}`}>
              <Icon icon={task.icon} width={18} />
            </div>
            <div className="tool-info">
              <div className="tool-name">{task.label}</div>
              <div className={`tool-price ${task.color}`}>{task.price}</div>
            </div>
            <button
              className="btn-run"
              disabled={disabled}
              onClick={() => onRun(task.id, task.params)}
            >
              <Icon icon="mdi:play" width={13} /> Run
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
