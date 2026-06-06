import { useState, useCallback } from "react";

const STORAGE_KEY = "hedera_anthropic_api_key";

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? ""
  );

  const saveKey = useCallback((key: string) => {
    const trimmed = key.trim();
    localStorage.setItem(STORAGE_KEY, trimmed);
    setApiKeyState(trimmed);
  }, []);

  const clearKey = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setApiKeyState("");
  }, []);

  return { apiKey, saveKey, clearKey, hasKey: apiKey.length > 0 };
}
