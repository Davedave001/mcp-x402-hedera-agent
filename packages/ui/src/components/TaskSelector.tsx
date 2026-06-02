export interface Task {
  id: string;
  label: string;
  price: string;
  params: Record<string, unknown>;
}

export const TASKS: Task[] = [
  {
    id: "get_balance",
    label: "Get HBAR Balance",
    price: "$0.01",
    params: { accountId: "0.0.1234" },
  },
  {
    id: "send_hcs_message",
    label: "Post HCS Message",
    price: "$0.05",
    params: { topicId: "0.0.5678", message: "Hello from Hedera x402 Agent!" },
  },
  {
    id: "mint_nft",
    label: "Mint NFT",
    price: "$0.25",
    params: { tokenId: "0.0.9999", metadata: { name: "Hedera x402 NFT", version: "1" } },
  },
];

interface Props {
  disabled: boolean;
  onRun: (taskId: string, params: Record<string, unknown>) => void;
}

export function TaskSelector({ disabled, onRun }: Props) {
  return (
    <ul className="task-list">
      {TASKS.map((task) => (
        <li key={task.id} className="task-item">
          <div className="task-info">
            <span className="task-label">{task.label}</span>
            <span className="task-price">{task.price}</span>
          </div>
          <button
            className="btn-primary"
            disabled={disabled}
            onClick={() => onRun(task.id, task.params)}
          >
            Run
          </button>
        </li>
      ))}
    </ul>
  );
}
