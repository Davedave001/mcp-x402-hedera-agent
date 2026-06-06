export interface TokenRow {
  id: string;
  balance: number;
  type: string;
}

export interface ReportAnalysis {
  accountHealth: { status: "HEALTHY" | "AT_RISK" | "INACTIVE"; description: string };
  tokenPortfolio: { tokens: TokenRow[]; totalUnits: number; summary: string };
  activityAssessment: string;
  insights: { title: string; description: string }[];
  disclaimer: string;
}

export interface WalletReport {
  accountId: string;
  generatedAt: string;
  hbars: string;
  tokens: TokenRow[];
  analysis: ReportAnalysis;
}
