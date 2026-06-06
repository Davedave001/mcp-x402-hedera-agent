import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import type { ChatMessage } from "../hooks/useChat";

interface Props {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  onSend: (msg: string) => void;
  onClear: () => void;
  hasApiKey: boolean;
  onOpenSettings: () => void;
}

export function ChatPanel({ messages, loading, error, onSend, onClear, hasApiKey, onOpenSettings }: Props) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const submit = () => {
    const text = draft.trim();
    if (!text || loading) return;
    setDraft("");
    onSend(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="chat-avatar"><Icon icon="mdi:robot-outline" width={18} /></div>
          <div>
            <div className="chat-header-title">Hedera Assistant</div>
            <div className="chat-header-sub">Powered by Claude + Hedera tools</div>
          </div>
        </div>
        <div className="chat-header-actions">
          {!hasApiKey && (
            <button className="chat-key-nudge" onClick={onOpenSettings}>
              <Icon icon="mdi:key-outline" width={13} /> Add API key — chat free
            </button>
          )}
          {messages.length > 0 && (
            <button className="chat-clear-btn" onClick={onClear} title="Clear conversation">
              <Icon icon="mdi:delete-sweep-outline" width={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && !loading && (
          <div className="chat-empty">
            <div className="chat-empty-icon"><Icon icon="mdi:chat-question-outline" width={48} /></div>
            <p className="chat-empty-title">Ask me about your wallet</p>
            <p className="chat-empty-hint">Try: "What's the balance of 0.0.6188111?" or "Post a message to HCS topic 0.0.9146759"</p>
            {!hasApiKey && (
              <button className="chat-key-nudge-lg" onClick={onOpenSettings}>
                Add your Anthropic API key to chat for free
              </button>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`chat-msg chat-msg-${msg.role}`}>
            {msg.role === "assistant" && (
              <div className="chat-bubble-avatar"><Icon icon="mdi:robot-outline" width={14} /></div>
            )}
            <div className={`chat-bubble chat-bubble-${msg.role}`}>
              <MessageContent content={msg.content} />
            </div>
            {msg.role === "user" && (
              <div className="chat-bubble-avatar chat-bubble-avatar-user"><Icon icon="mdi:account" width={14} /></div>
            )}
          </div>
        ))}

        {loading && (
          <div className="chat-msg chat-msg-assistant">
            <div className="chat-bubble-avatar"><Icon icon="mdi:robot-outline" width={14} /></div>
            <div className="chat-bubble chat-bubble-assistant chat-bubble-thinking">
              <span className="thinking-dot" />
              <span className="thinking-dot" />
              <span className="thinking-dot" />
            </div>
          </div>
        )}

        {error && (
          <div className="chat-error-row">
            <span className="chat-error-icon"><Icon icon="mdi:alert-outline" width={16} /></span>
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <input
          ref={inputRef}
          className="chat-input"
          type="text"
          placeholder={hasApiKey ? "Ask about your Hedera wallet…" : "Ask anything (x402 payment per message)"}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          className="chat-send-btn"
          onClick={submit}
          disabled={!draft.trim() || loading}
        >
          <Icon icon="mdi:send" width={16} />
        </button>
      </div>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  // Split on newlines and render line breaks + bold (**text**)
  const lines = content.split("\n");
  return (
    <div className="msg-content">
      {lines.map((line, i) => (
        <p key={i} className={line === "" ? "msg-spacer" : undefined}>
          <InlineMarkdown text={line} />
        </p>
      ))}
    </div>
  );
}

function InlineMarkdown({ text }: { text: string }) {
  // Handle **bold** inline
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**")
          ? <strong key={i}>{part.slice(2, -2)}</strong>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}
