/*
 * useSimulator.ts
 * Design: Corporate Precision — hitotoki 提案シミュレーター
 * 計算ロジックをUIから分離したカスタムフック
 */

import { useState, useCallback, useMemo } from "react";

// ===== 定数 =====
export const PRICES = {
  monitoring: 400_000,
  dailyReport: 400_000,
  aiAgent: 1_000_000,
  infra: 100_000,
  supportPerEmployee: 30_000,
  socialInsurance: 275_000,
} as const;

// ===== 型定義 =====
export interface SimulatorState {
  companyName: string;
  employeeCount: number;
  smallStart: boolean;
  useSubsidy: boolean;
  menuMonitoring: boolean;
  menuDailyReport: boolean;
  menuAIAgent: boolean;
  menuInfra: boolean;
  customAmount: number;
  subsidyAmount: number;
}

export interface SimulatorResult {
  A: number; // システム開発費合計
  B: number; // 伴走支援費
  C: number; // 契約金額（税抜）
  D: number; // 消費税
  E: number; // 契約金額（税込）
  F: number; // 社労士費用
  total: number; // 初期お支払い総額
  netCost: number; // 実質負担額
}

const INITIAL_STATE: SimulatorState = {
  companyName: "",
  employeeCount: 0,
  smallStart: false,
  useSubsidy: false,
  menuMonitoring: false,
  menuDailyReport: false,
  menuAIAgent: false,
  menuInfra: false,
  customAmount: 0,
  subsidyAmount: 0,
};

// ===== 計算関数 =====
export function calculate(state: SimulatorState): SimulatorResult {
  const A =
    (state.menuMonitoring ? PRICES.monitoring : 0) +
    (state.menuDailyReport ? PRICES.dailyReport : 0) +
    (state.menuAIAgent ? PRICES.aiAgent : 0) +
    (state.menuInfra ? PRICES.infra : 0) +
    state.customAmount;

  const B = state.smallStart ? 0 : state.employeeCount * PRICES.supportPerEmployee;
  const C = A + B;
  const D = Math.floor(C * 0.1);
  const E = C + D;
  const F = state.useSubsidy ? PRICES.socialInsurance : 0;
  const total = E + F;
  const netCost = Math.max(0, total - state.subsidyAmount);

  return { A, B, C, D, E, F, total, netCost };
}

// ===== フォーマット関数 =====
export function fmt(n: number): string {
  return n.toLocaleString("ja-JP");
}

// ===== カスタムフック =====
export function useSimulator() {
  const [state, setState] = useState<SimulatorState>(INITIAL_STATE);

  const result = useMemo(() => calculate(state), [state]);

  const update = useCallback(<K extends keyof SimulatorState>(
    key: K,
    value: SimulatorState[K]
  ) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return { state, result, update, reset };
}
