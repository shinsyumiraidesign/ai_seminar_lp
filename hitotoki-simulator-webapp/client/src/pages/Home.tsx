/*
 * Home.tsx — 提案シミュレーター メインページ
 * Design: Corporate Precision
 * - Navy/Cobalt blue palette for trust
 * - JetBrains Mono for number readability
 * - Sticky estimate panel on right
 * - iPad-friendly large touch targets
 */

import { useRef, useEffect, useState } from "react";
import { useSimulator, fmt, PRICES } from "@/hooks/useSimulator";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  Zap,
  Leaf,
  Monitor,
  BookOpen,
  Bot,
  Server,
  Wrench,
  RotateCcw,
  TrendingDown,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ===== AnimatedAmount =====
function AnimatedAmount({
  value,
  className,
  prefix = "",
  suffix = "円",
}: {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}) {
  const [animKey, setAnimKey] = useState(0);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current !== value) {
      setAnimKey((k) => k + 1);
      prevRef.current = value;
    }
  }, [value]);

  return (
    <span
      key={animKey}
      className={cn("font-mono-num amount-pop inline-block", className)}
    >
      {prefix}{fmt(value)}{suffix}
    </span>
  );
}

// ===== MenuCheckItem =====
function MenuCheckItem({
  id,
  label,
  price,
  checked,
  icon: Icon,
  onChange,
}: {
  id: string;
  label: string;
  price: number;
  checked: boolean;
  icon: React.ElementType;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 text-left",
        "transition-all duration-200 select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        checked
          ? "border-[oklch(0.52_0.20_255)] bg-[oklch(0.97_0.02_255)] shadow-sm"
          : "border-border bg-card hover:border-[oklch(0.60_0.18_255)] hover:bg-[oklch(0.97_0.02_255)]"
      )}
    >
      {/* Checkbox visual */}
      <div
        className={cn(
          "w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200",
          checked
            ? "bg-[oklch(0.52_0.20_255)] border-[oklch(0.52_0.20_255)]"
            : "border-muted-foreground bg-background"
        )}
      >
        {checked && (
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
            <path
              d="M1 5L4.5 8.5L11 1.5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {/* Icon */}
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200",
          checked
            ? "bg-[oklch(0.52_0.20_255)] text-white"
            : "bg-muted text-muted-foreground"
        )}
      >
        <Icon size={18} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[15px] text-foreground leading-tight">{label}</div>
        <div
          className={cn(
            "text-sm font-mono-num mt-0.5 transition-colors duration-200",
            checked ? "text-[oklch(0.45_0.18_255)]" : "text-muted-foreground"
          )}
        >
          {fmt(price)}円
        </div>
      </div>

      <ChevronRight
        size={16}
        className={cn(
          "flex-shrink-0 transition-all duration-200",
          checked ? "text-[oklch(0.52_0.20_255)] translate-x-0.5" : "text-muted-foreground"
        )}
      />
    </button>
  );
}

// ===== EstimateRow =====
function EstimateRow({
  badge,
  label,
  note,
  amount,
  highlight = false,
  green = false,
  hidden = false,
}: {
  badge: string;
  label: string;
  note?: string;
  amount: number;
  highlight?: boolean;
  green?: boolean;
  hidden?: boolean;
}) {
  if (hidden) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border transition-all duration-300",
        highlight && !green && "bg-[oklch(0.97_0.02_255)] border-[oklch(0.85_0.04_255)]",
        green && "bg-[oklch(0.97_0.04_162)] border-[oklch(0.80_0.08_162)]",
        !highlight && !green && "bg-card border-border"
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span
          className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0",
            green
              ? "bg-[oklch(0.65_0.18_162)] text-white"
              : highlight
              ? "bg-[oklch(0.52_0.20_255)] text-white"
              : "bg-muted-foreground/20 text-muted-foreground"
          )}
        >
          {badge}
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground leading-tight">{label}</div>
          {note && <div className="text-xs text-muted-foreground mt-0.5">{note}</div>}
        </div>
      </div>
      <AnimatedAmount
        value={amount}
        className={cn(
          "text-base font-semibold",
          green ? "text-[oklch(0.50_0.18_162)]" : highlight ? "text-[oklch(0.45_0.18_255)]" : "text-foreground"
        )}
      />
    </div>
  );
}

// ===== Main Page =====
export default function Home() {
  const { state, result, update, reset } = useSimulator();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-50 bg-[oklch(0.18_0.06_255)] text-white shadow-lg">
        <div className="container h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[oklch(0.52_0.20_255)] flex items-center justify-center font-black text-lg shadow-md">
              h
            </div>
            <div>
              <div className="font-bold text-[15px] leading-tight tracking-wide">
                提案シミュレーター
              </div>
              <div className="text-[11px] text-white/60 leading-tight">
                株式会社 hitotoki — 営業支援ツール
              </div>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-widest text-white/70 border border-white/20 rounded-full px-3 py-1.5 backdrop-blur-sm">
            <Sparkles size={10} />
            INTERNAL USE ONLY
          </span>
        </div>
      </header>

      {/* ===== Main Grid ===== */}
      <main className="flex-1 container py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">

          {/* ===== LEFT: Input Panel ===== */}
          <div className="space-y-5 animate-fade-slide-up">

            {/* ① 基本情報 */}
            <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/30">
                <div className="w-8 h-8 rounded-lg bg-[oklch(0.52_0.20_255)]/10 flex items-center justify-center">
                  <Building2 size={16} className="text-[oklch(0.45_0.18_255)]" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-foreground">基本情報</h2>
                  <p className="text-xs text-muted-foreground">顧客の基本情報を入力してください</p>
                </div>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm font-semibold flex items-center gap-2">
                    <Building2 size={13} className="text-muted-foreground" />
                    企業名
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="例：株式会社〇〇"
                    value={state.companyName}
                    onChange={(e) => update("companyName", e.target.value)}
                    className="h-12 text-base border-2 focus:border-[oklch(0.52_0.20_255)] transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employeeCount" className="text-sm font-semibold flex items-center gap-2">
                    <Users size={13} className="text-muted-foreground" />
                    従業員数
                  </Label>
                  <div className="relative">
                    <Input
                      id="employeeCount"
                      type="number"
                      min={0}
                      placeholder="0"
                      value={state.employeeCount === 0 ? "" : state.employeeCount}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        update("employeeCount", isNaN(v) || v < 0 ? 0 : v);
                      }}
                      className="h-12 text-base border-2 focus:border-[oklch(0.52_0.20_255)] transition-colors pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                      名
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* ② 特別条件 */}
            <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/30">
                <div className="w-8 h-8 rounded-lg bg-[oklch(0.52_0.20_255)]/10 flex items-center justify-center">
                  <Zap size={16} className="text-[oklch(0.45_0.18_255)]" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-foreground">特別条件</h2>
                  <p className="text-xs text-muted-foreground">適用する条件をONにしてください</p>
                </div>
              </div>
              <div className="px-6 py-5 space-y-3">

                {/* スモールスタート */}
                <div
                  className={cn(
                    "flex items-center justify-between gap-4 px-5 py-4 rounded-xl border-2 transition-all duration-200",
                    state.smallStart
                      ? "border-[oklch(0.52_0.20_255)] bg-[oklch(0.97_0.02_255)]"
                      : "border-border bg-background hover:border-[oklch(0.60_0.18_255)]"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                      state.smallStart ? "bg-[oklch(0.52_0.20_255)] text-white" : "bg-muted text-muted-foreground"
                    )}>
                      <Zap size={18} />
                    </div>
                    <div>
                      <div className="font-semibold text-[15px] text-foreground">スモールスタート（モニター）適用</div>
                      <div className="text-xs text-muted-foreground mt-0.5">ONにすると伴走支援費が無料になります</div>
                    </div>
                  </div>
                  <Switch
                    checked={state.smallStart}
                    onCheckedChange={(v) => update("smallStart", v)}
                    className="data-[state=checked]:bg-[oklch(0.52_0.20_255)] flex-shrink-0"
                  />
                </div>

                {/* 助成金 */}
                <div
                  className={cn(
                    "flex items-center justify-between gap-4 px-5 py-4 rounded-xl border-2 transition-all duration-200",
                    state.useSubsidy
                      ? "border-[oklch(0.65_0.18_162)] bg-[oklch(0.97_0.04_162)]"
                      : "border-border bg-background hover:border-[oklch(0.65_0.18_162)]"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                      state.useSubsidy ? "bg-[oklch(0.65_0.18_162)] text-white" : "bg-muted text-muted-foreground"
                    )}>
                      <Leaf size={18} />
                    </div>
                    <div>
                      <div className="font-semibold text-[15px] text-foreground">助成金を活用する</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        ONにすると社労士費用（{fmt(PRICES.socialInsurance)}円）が加算されます
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={state.useSubsidy}
                    onCheckedChange={(v) => update("useSubsidy", v)}
                    className="data-[state=checked]:bg-[oklch(0.65_0.18_162)] flex-shrink-0"
                  />
                </div>

              </div>
            </section>

            {/* ③ システム開発メニュー */}
            <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/30">
                <div className="w-8 h-8 rounded-lg bg-[oklch(0.52_0.20_255)]/10 flex items-center justify-center">
                  <Server size={16} className="text-[oklch(0.45_0.18_255)]" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-foreground">システム開発メニュー</h2>
                  <p className="text-xs text-muted-foreground">複数選択可能です</p>
                </div>
              </div>
              <div className="px-6 py-5 space-y-3">

                <MenuCheckItem
                  id="monitoring"
                  label="モニタリング管理システム"
                  price={PRICES.monitoring}
                  checked={state.menuMonitoring}
                  icon={Monitor}
                  onChange={(v) => update("menuMonitoring", v)}
                />
                <MenuCheckItem
                  id="dailyReport"
                  label="日報管理システム"
                  price={PRICES.dailyReport}
                  checked={state.menuDailyReport}
                  icon={BookOpen}
                  onChange={(v) => update("menuDailyReport", v)}
                />
                <MenuCheckItem
                  id="aiAgent"
                  label="社長AIエージェント"
                  price={PRICES.aiAgent}
                  checked={state.menuAIAgent}
                  icon={Bot}
                  onChange={(v) => update("menuAIAgent", v)}
                />
                <MenuCheckItem
                  id="infra"
                  label="インフラ・基盤整備"
                  price={PRICES.infra}
                  checked={state.menuInfra}
                  icon={Server}
                  onChange={(v) => update("menuInfra", v)}
                />

                {/* カスタム開発 */}
                <div
                  className={cn(
                    "flex items-center gap-4 px-5 py-4 rounded-xl border-2 transition-all duration-200",
                    state.customAmount > 0
                      ? "border-[oklch(0.52_0.20_255)] bg-[oklch(0.97_0.02_255)]"
                      : "border-border bg-background"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                    state.customAmount > 0 ? "bg-[oklch(0.52_0.20_255)] text-white" : "bg-muted text-muted-foreground"
                  )}>
                    <Wrench size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[15px] text-foreground mb-2">その他カスタム開発</div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={state.customAmount === 0 ? "" : state.customAmount}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          update("customAmount", isNaN(v) || v < 0 ? 0 : v);
                        }}
                        className="h-10 text-right font-mono-num border-2 focus:border-[oklch(0.52_0.20_255)]"
                      />
                      <span className="text-sm font-semibold text-muted-foreground flex-shrink-0">円</span>
                    </div>
                  </div>
                </div>

              </div>
            </section>

          </div>

          {/* ===== RIGHT: Estimate Panel ===== */}
          <div
            className="lg:sticky lg:top-24 space-y-4 animate-fade-slide-up"
            style={{ animationDelay: "0.08s" }}
          >

            {/* Company card */}
            <div className="bg-[oklch(0.18_0.06_255)] text-white rounded-2xl px-6 py-5 flex items-center gap-4 shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Building2 size={22} className="text-white/80" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-lg leading-tight truncate">
                  {state.companyName || "（企業名未入力）"}
                </div>
                <div className="text-sm text-white/60 mt-0.5">
                  従業員数：{state.employeeCount}名
                </div>
              </div>
            </div>

            {/* Estimate rows */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/30">
                <div className="w-8 h-8 rounded-lg bg-[oklch(0.52_0.20_255)]/10 flex items-center justify-center">
                  <TrendingDown size={16} className="text-[oklch(0.45_0.18_255)]" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-foreground">リアルタイム見積もり</h2>
                  <p className="text-xs text-muted-foreground">入力内容に応じて自動計算されます</p>
                </div>
              </div>

              <div className="px-5 py-5 space-y-2">
                <EstimateRow
                  badge="A"
                  label="システム開発費合計"
                  note="選択メニューの合計"
                  amount={result.A}
                  highlight
                />
                <EstimateRow
                  badge="B"
                  label="伴走支援費"
                  note={state.smallStart ? "（モニター無料）" : `従業員数 × ${fmt(PRICES.supportPerEmployee)}円`}
                  amount={result.B}
                  highlight
                />

                {/* Divider */}
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground font-medium">小計</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <EstimateRow
                  badge="C"
                  label="hitotoki 契約金額（税抜）"
                  note="A + B"
                  amount={result.C}
                  highlight
                />

                {/* Tax row */}
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm text-muted-foreground pl-10">消費税（10%）</span>
                  <AnimatedAmount value={result.D} className="text-sm text-muted-foreground" />
                </div>

                <EstimateRow
                  badge="E"
                  label="hitotoki 契約金額（税込）"
                  note="C + D"
                  amount={result.E}
                  highlight
                />

                <EstimateRow
                  badge="F"
                  label="社労士費用（非課税）"
                  note="助成金申請サポート"
                  amount={result.F}
                  green
                  hidden={!state.useSubsidy}
                />
              </div>
            </div>

            {/* Total card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[oklch(0.22_0.07_255)] via-[oklch(0.35_0.12_255)] to-[oklch(0.52_0.20_255)] text-white shadow-xl px-6 py-6">
              {/* Decorative circles */}
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
              <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/4 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center gap-2 text-white/75 text-sm font-semibold mb-3">
                  <Sparkles size={14} />
                  初期お支払い総額（税込）
                </div>
                <div className="text-5xl font-black font-mono-num tracking-tight leading-none">
                  <AnimatedAmount
                    value={result.total}
                    className="text-5xl font-black"
                  />
                </div>
                <div className="mt-3 text-xs text-white/60">
                  {state.useSubsidy
                    ? `E（税込 ${fmt(result.E)}円）＋ F（社労士 ${fmt(result.F)}円）`
                    : `E（税込 ${fmt(result.E)}円）`}
                </div>
              </div>
            </div>

            {/* Subsidy simulation */}
            <div className="bg-card rounded-2xl border-2 border-[oklch(0.80_0.08_162)] overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-[oklch(0.85_0.06_162)] bg-[oklch(0.97_0.04_162)]">
                <div className="w-8 h-8 rounded-lg bg-[oklch(0.65_0.18_162)]/15 flex items-center justify-center">
                  <Leaf size={16} className="text-[oklch(0.50_0.18_162)]" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-[oklch(0.35_0.12_162)]">助成金シミュレーション</h2>
                  <p className="text-xs text-[oklch(0.50_0.18_162)]/80">実質負担額を計算します（オプション）</p>
                </div>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subsidyAmount" className="text-sm font-semibold text-[oklch(0.35_0.12_162)] flex items-center gap-2">
                    <Leaf size={13} />
                    助成金見込み額
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="subsidyAmount"
                      type="number"
                      min={0}
                      placeholder="0"
                      value={state.subsidyAmount === 0 ? "" : state.subsidyAmount}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        update("subsidyAmount", isNaN(v) || v < 0 ? 0 : v);
                      }}
                      className="h-12 text-right font-mono-num text-base border-2 border-[oklch(0.80_0.08_162)] focus:border-[oklch(0.65_0.18_162)]"
                    />
                    <span className="text-sm font-semibold text-muted-foreground flex-shrink-0">円</span>
                  </div>
                </div>

                <div className="flex items-center justify-between px-5 py-4 bg-[oklch(0.97_0.04_162)] rounded-xl border border-[oklch(0.80_0.08_162)]">
                  <div>
                    <div className="text-sm font-bold text-[oklch(0.35_0.12_162)]">実質負担額</div>
                    <div className="text-xs text-[oklch(0.50_0.18_162)]/80 mt-0.5">初期総額 − 助成金見込み額</div>
                  </div>
                  <AnimatedAmount
                    value={result.netCost}
                    className="text-2xl font-black text-[oklch(0.40_0.18_162)]"
                  />
                </div>
              </div>
            </div>

            {/* Reset button */}
            <Button
              variant="outline"
              onClick={reset}
              className="w-full h-12 text-sm font-semibold border-2 hover:border-destructive hover:text-destructive hover:bg-destructive/5 transition-all duration-200 gap-2"
            >
              <RotateCcw size={15} />
              すべてリセット
            </Button>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-4">
        <div className="container text-center text-xs text-muted-foreground">
          © 2025 株式会社hitotoki — 社内専用ツール
        </div>
      </footer>
    </div>
  );
}
