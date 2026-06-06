import { useState } from "react";
import { Icon } from "@iconify/react";

interface Props {
  currentKey: string;
  onSave: (key: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export function ApiKeyModal({ currentKey, onSave, onClear, onClose }: Props) {
  const [draft, setDraft] = useState(currentKey);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span><Icon icon="mdi:tune-variant" width={15} style={{ verticalAlign: "middle", marginRight: 6 }} />Settings</span>
          <button className="modal-close" onClick={onClose}><Icon icon="mdi:close" width={16} /></button>
        </div>

        <div className="modal-body">
          <p className="modal-label">Your Anthropic API Key</p>
          <p className="modal-hint">
            Enter your key to use the AI Chat feature for free.
            Your key is stored locally and never sent to our servers — only directly to Anthropic.
          </p>
          <input
            className="modal-input"
            type="password"
            placeholder="sk-ant-..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
          />
          {currentKey && (
            <p className="modal-active-key">
              <Icon icon="mdi:check-circle-outline" width={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
              Key saved — chat is free for you
            </p>
          )}
        </div>

        <div className="modal-footer">
          {currentKey && (
            <button className="btn-modal-clear" onClick={() => { onClear(); setDraft(""); }}>
              Remove Key
            </button>
          )}
          <button
            className="btn-modal-save"
            disabled={!draft.trim()}
            onClick={() => { onSave(draft); onClose(); }}
          >
            Save Key
          </button>
        </div>
      </div>
    </div>
  );
}
