"use client";

import * as React from "react";
import { BusinessRule } from "@/types/mapping";

interface RuleClipboardContextValue {
  copiedRule: BusinessRule | null;
  copyRule: (rule: BusinessRule, sourceField: string) => void;
  pasteRule: () => BusinessRule | null;
  clearClipboard: () => void;
  sourceFieldName: string | null;
}

const RuleClipboardContext = React.createContext<RuleClipboardContextValue | undefined>(
  undefined
);

export function RuleClipboardProvider({ children }: { children: React.ReactNode }) {
  const [copiedRule, setCopiedRule] = React.useState<BusinessRule | null>(null);
  const [sourceFieldName, setSourceFieldName] = React.useState<string | null>(null);

  const copyRule = React.useCallback((rule: BusinessRule, sourceField: string) => {
    setCopiedRule(rule);
    setSourceFieldName(sourceField);
  }, []);

  const pasteRule = React.useCallback(() => {
    return copiedRule;
  }, [copiedRule]);

  const clearClipboard = React.useCallback(() => {
    setCopiedRule(null);
    setSourceFieldName(null);
  }, []);

  const value = React.useMemo(
    () => ({
      copiedRule,
      copyRule,
      pasteRule,
      clearClipboard,
      sourceFieldName,
    }),
    [copiedRule, copyRule, pasteRule, clearClipboard, sourceFieldName]
  );

  return (
    <RuleClipboardContext.Provider value={value}>
      {children}
    </RuleClipboardContext.Provider>
  );
}

export function useRuleClipboard() {
  const context = React.useContext(RuleClipboardContext);
  if (context === undefined) {
    throw new Error("useRuleClipboard must be used within a RuleClipboardProvider");
  }
  return context;
}
