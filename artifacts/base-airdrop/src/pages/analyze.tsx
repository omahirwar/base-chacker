import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Circle, ArrowLeft, Shield, ShieldAlert, Trophy,
  Activity, Wallet, Globe, Layers, Image, Tag, Clock, AlertTriangle,
  ChevronRight, TrendingUp, Zap, RefreshCw, DollarSign, BarChart3,
  Gift, Calendar, Copy, ExternalLink
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  PolarRadiusAxis
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAnalyzeWallet } from "@workspace/api-client-react";
import type { WalletAnalysisResult } from "@workspace/api-client-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ─── Base blue palette ────────────────────────────────────────────────────────
const BASE_BLUE = "#0052FF";
const BASE_BLUE_DARK = "#0038CC";
const BASE_BLUE_LIGHT = "#3b82f6";

const ANALYSIS_STEPS = [
  "Fetching Transaction History (BlockScout)",
  "Fetching Token Transfers",
  "Fetching NFT Holdings",
  "Reading ETH Balance (Base RPC)",
  "Identifying Protocol Interactions",
  "Analyzing Bridge Activity",
  "Checking Basename Registration",
  "Analyzing NFT Metadata",
  "Calculating Activity Score",
  "Calculating Protocol Score",
  "Calculating Capital Score",
  "Calculating Cross-chain Score",
  "Running Sybil Detection",
  "Evaluating Eligibility",
  "Calculating Allocation",
];

// Top progress steps shown in the navbar
const NAV_STEPS = [
  { label: "Enter Address", icon: "wallet" },
  { label: "Check Eligibility", icon: "check" },
  { label: "Verify On-chain", icon: "shield" },
  { label: "View Results", icon: "trophy" },
];

function useCountUp(target: number, duration = 1800, trigger = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!trigger || target === 0) { setValue(target); return; }
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, trigger]);
  return value;
}

// ─── Reusable card ────────────────────────────────────────────────────────────
function WhiteCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#EEF3FF", color: BASE_BLUE }}>
        {icon}
      </div>
      <h3 className="font-bold text-gray-900 text-sm">{children}</h3>
    </div>
  );
}

// ─── Top step nav bar ─────────────────────────────────────────────────────────
function StepsBar({ currentStep, address }: { currentStep: number; address: string }) {
  return (
    <div style={{ background: "#0D0D1A" }} className="w-full px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {NAV_STEPS.map((step, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          return (
            <div key={step.label} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-2 flex-1 ${i > 0 ? "justify-center" : ""}`}>
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold transition-all"
                  style={{
                    background: done || active ? BASE_BLUE : "rgba(255,255,255,0.1)",
                    color: done || active ? "#fff" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {done ? <CheckCircle2 className="h-4 w-4" /> : <span>{i + 1}</span>}
                </div>
                <span className={`text-xs font-medium hidden sm:block transition-colors ${
                  done || active ? "text-white" : "text-white/30"
                }`}>
                  {i === 0 ? `${address.slice(0, 6)}…${address.slice(-4)}` : step.label}
                </span>
              </div>
              {i < NAV_STEPS.length - 1 && (
                <div className="hidden sm:block flex-1 h-px mx-2" style={{ background: done ? BASE_BLUE : "rgba(255,255,255,0.1)" }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Loading screen ───────────────────────────────────────────────────────────
function AnalysisProgress({ currentStep, address }: { currentStep: number; address: string }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #0038FF 0%, #001A99 60%, #000B55 100%)" }}>
      <StepsBar currentStep={1} address={address} />
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="p-8">
            <div className="text-center mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="inline-flex h-16 w-16 rounded-2xl items-center justify-center mb-5"
                style={{ backgroundColor: BASE_BLUE }}
              >
                <Zap className="h-8 w-8 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900">Analyzing Wallet</h2>
              <p className="text-gray-500 mt-1 text-sm">Fetching real on-chain data from Base</p>
            </div>

            <div className="space-y-2.5 mb-6">
              {ANALYSIS_STEPS.map((step, i) => {
                const done = i < currentStep;
                const active = i === currentStep;
                return (
                  <motion.div
                    key={step}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: i <= currentStep ? 1 : 0.3 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: BASE_BLUE }} />
                    ) : active ? (
                      <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                        <Circle className="h-4 w-4 shrink-0" style={{ color: BASE_BLUE }} />
                      </motion.div>
                    ) : (
                      <Circle className="h-4 w-4 text-gray-200 shrink-0" />
                    )}
                    <span className={`text-sm ${done ? "text-gray-700 font-medium" : active ? "text-gray-900 font-semibold" : "text-gray-300"}`}>
                      {step}
                    </span>
                    {active && (
                      <motion.span
                        className="ml-auto text-xs font-medium"
                        style={{ color: BASE_BLUE }}
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      >
                        Running…
                      </motion.span>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: BASE_BLUE }}
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / ANALYSIS_STEPS.length) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <p className="text-xs text-gray-400 text-center mt-3">
              {Math.round(((currentStep + 1) / ANALYSIS_STEPS.length) * 100)}% complete
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Score bar ────────────────────────────────────────────────────────────────
function ScoreBar({ label, value, weight, delay }: { label: string; value: number; weight?: string; delay: number }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className="flex items-center gap-3 py-1">
      <div className="w-28 text-xs text-gray-500 truncate shrink-0">{label}</div>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: value > 60 ? "#22c55e" : value > 35 ? BASE_BLUE : "#f59e0b" }}
          initial={{ width: 0 }}
          animate={{ width: animated ? `${value}%` : 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <div className="w-8 text-right text-xs font-bold text-gray-700 shrink-0">{value}</div>
      {weight && <div className="w-9 text-right text-xs text-gray-400 shrink-0">{weight}</div>}
    </div>
  );
}

// ─── Sybil gauge ─────────────────────────────────────────────────────────────
function SybilGauge({ score, level }: { score: number; level: string }) {
  const color = score < 20 ? "#22c55e" : score < 45 ? "#f59e0b" : score < 70 ? "#f97316" : "#ef4444";
  const circumference = 2 * Math.PI * 44;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="#f3f4f6" strokeWidth="8" />
          <motion.circle
            cx="50" cy="50" r="44" fill="none"
            stroke={color} strokeWidth="8"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-extrabold text-gray-900">{score}</span>
          <span className="text-xs text-gray-400">/ 100</span>
        </div>
      </div>
      <div
        className="mt-2 px-3 py-1 rounded-full text-xs font-bold"
        style={{ background: color + "20", color }}
      >
        {level} Risk
      </div>
    </div>
  );
}

// ─── Simulator ────────────────────────────────────────────────────────────────
interface SimulatorState { fdv: number; supply: number; airdropPct: number; eligibleWallets: number; }

function AirdropSimulator({ allocation }: { allocation: WalletAnalysisResult["allocation"] }) {
  const [sim, setSim] = useState<SimulatorState>({ fdv: 3, supply: 1000, airdropPct: 10, eligibleWallets: 300000 });
  const tokenPrice = (sim.fdv * 1e9) / (sim.supply * 1e6);
  const airdropPool = (sim.supply * 1e6) * (sim.airdropPct / 100);
  const yourUsd = allocation.eligible ? allocation.amount * tokenPrice : 0;

  return (
    <WhiteCard className="p-6">
      <SectionTitle icon={<DollarSign className="h-4 w-4" />}>Airdrop Simulator</SectionTitle>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: "FDV", key: "fdv" as const, options: [1,2,3,4,5,10], fmt: (v:number) => `$${v}B` },
          { label: "Supply (M)", key: "supply" as const, options: [100,500,1000,5000,10000], fmt: (v:number) => `${v}M` },
          { label: "Airdrop %", key: "airdropPct" as const, options: [5,10,15,20], fmt: (v:number) => `${v}%` },
          { label: "Eligible Wallets", key: "eligibleWallets" as const, options: [50000,100000,200000,300000,500000,1000000], fmt: (v:number) => `${(v/1000).toFixed(0)}K` },
        ].map(({ label, key, options, fmt }) => (
          <div key={key}>
            <label className="text-xs text-gray-500 mb-1 block font-medium">{label}</label>
            <Select value={String(sim[key])} onValueChange={(v) => setSim(s => ({ ...s, [key]: Number(v) }))}>
              <SelectTrigger className="bg-gray-50 border-gray-200 text-gray-900 text-sm h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map(v => <SelectItem key={v} value={String(v)}>{fmt(v)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Token Price", value: `$${tokenPrice.toFixed(4)}` },
          { label: "Pool Size", value: `${(airdropPool / 1e6).toFixed(0)}M tokens` },
          { label: "Your Allocation", value: `${allocation.amount.toLocaleString()} BASE` },
          { label: "Est. USD Value", value: `$${yourUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl p-3" style={{ background: "#F5F8FF" }}>
            <div className="text-xs text-gray-500 mb-0.5">{label}</div>
            <div className="font-bold text-gray-900 text-sm">{value}</div>
          </div>
        ))}
      </div>
    </WhiteCard>
  );
}

// ─── Main results view ────────────────────────────────────────────────────────
function ResultsView({ data, address }: { data: WalletAnalysisResult; address: string }) {
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  const { allocation, scores, walletStats, bridgeStats, protocols, nftStats, basenameStats, sybilAnalysis, timeline, missingOpportunities } = data;
  const countedAllocation = useCountUp(allocation.amount, 1800, true);

  function copyAddress() {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const radarData = [
    { subject: "Activity", value: scores.activity },
    { subject: "Protocol", value: scores.protocol },
    { subject: "Capital", value: scores.capital },
    { subject: "Liquidity", value: scores.liquidity },
    { subject: "NFT", value: scores.nft },
    { subject: "Basename", value: scores.basename },
    { subject: "Cross-chain", value: scores.crossChain },
    { subject: "Reputation", value: scores.reputation },
    { subject: "Builder", value: scores.builder },
    { subject: "Consistency", value: scores.consistency },
  ];

  const scoreBars = [
    { label: "Activity", value: scores.activity, weight: "20%" },
    { label: "Protocol Usage", value: scores.protocol, weight: "20%" },
    { label: "Capital", value: scores.capital, weight: "15%" },
    { label: "Liquidity", value: scores.liquidity, weight: "10%" },
    { label: "NFT", value: scores.nft, weight: "10%" },
    { label: "Basename", value: scores.basename, weight: "5%" },
    { label: "Cross-chain", value: scores.crossChain, weight: "5%" },
    { label: "Reputation", value: scores.reputation, weight: "5%" },
    { label: "Builder", value: scores.builder, weight: "5%" },
    { label: "Consistency", value: scores.consistency, weight: "5%" },
    { label: "Community", value: scores.community, weight: "5%" },
  ];

  const timelineCatIcon: Record<string, React.ReactNode> = {
    onboarding: <Globe className="h-3 w-3" />,
    bridge: <Layers className="h-3 w-3" />,
    protocol: <Activity className="h-3 w-3" />,
    basename: <Tag className="h-3 w-3" />,
    nft: <Image className="h-3 w-3" />,
    builder: <Zap className="h-3 w-3" />,
  };

  const tierBadgeColor: Record<string, string> = {
    "S+": "#F59E0B", "S": "#3B82F6", "A": "#22C55E",
    "B": "#06B6D4", "C": "#F97316", "Not Eligible": "#EF4444",
  };

  const impactColor: Record<string, { bg: string; text: string }> = {
    High: { bg: "#FEF2F2", text: "#EF4444" },
    Medium: { bg: "#FFFBEB", text: "#F59E0B" },
    Low: { bg: "#EFF6FF", text: "#3B82F6" },
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #0038FF 0%, #0028B8 40%, #000C66 100%)" }}>
      <StepsBar currentStep={3} address={address} />

      <div className="flex-1 px-4 py-6">
        <div className="max-w-5xl mx-auto space-y-5">

          {/* ── Hero verdict card ─────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <WhiteCard className="overflow-hidden">
              {/* Inner radial glow */}
              <div className="relative" style={{
                background: "radial-gradient(ellipse at 50% -20%, #EEF3FF 0%, #ffffff 60%)"
              }}>
                <div className="p-8 flex flex-col items-center text-center">
                  {/* Logo icon */}
                  <div
                    className="h-16 w-16 rounded-2xl flex items-center justify-center mb-5 shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${BASE_BLUE} 0%, ${BASE_BLUE_DARK} 100%)` }}
                  >
                    {allocation.eligible
                      ? <Trophy className="h-8 w-8 text-white" />
                      : <ShieldAlert className="h-8 w-8 text-white" />
                    }
                  </div>

                  {allocation.eligible ? (
                    <>
                      <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Congratulations!</h1>
                      <p className="text-gray-500 text-sm mb-6">
                        You are eligible for the Base airdrop.<br />Your allocation has been estimated.
                      </p>

                      {/* Allocation amount box */}
                      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-5">
                        <div className="flex items-center justify-center gap-3">
                          <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: BASE_BLUE }}>
                            <span className="text-white font-black text-sm">B</span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-gray-900">{countedAllocation.toLocaleString()}</span>
                            <span className="text-lg font-bold" style={{ color: BASE_BLUE }}>BASE</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 text-center mt-2">Your Estimated Allocation</p>
                      </div>

                      {/* Stats row */}
                      <div className="flex items-center gap-6 flex-wrap justify-center mb-5">
                        {[
                          { label: "Tier", value: allocation.tier, color: tierBadgeColor[allocation.tier] ?? BASE_BLUE },
                          { label: "Score", value: `${scores.total}/100`, color: BASE_BLUE },
                          { label: "Percentile", value: allocation.percentile, color: "#22C55E" },
                          { label: "Confidence", value: `${allocation.confidenceScore}%`, color: "#6B7280" },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="text-center">
                            <div className="text-xs text-gray-400 mb-0.5">{label}</div>
                            <div className="text-base font-extrabold" style={{ color }}>{value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Claiming info */}
                      <div className="w-full max-w-sm space-y-3">
                        <div className="flex items-center gap-2 justify-center py-2 border-t border-b border-gray-100">
                          <Calendar className="h-4 w-4" style={{ color: BASE_BLUE }} />
                          <span className="text-sm font-bold text-gray-700">CLAIMING DATE — TBA</span>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-gray-500">This is a prediction, not a confirmed claim. No official Base airdrop has been announced. Treat all estimates as speculative.</p>
                        </div>
                        <button
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90"
                          style={{ background: `linear-gradient(135deg, ${BASE_BLUE} 0%, ${BASE_BLUE_DARK} 100%)` }}
                          onClick={() => setLocation("/")}
                        >
                          <Gift className="h-4 w-4" />
                          Check Another Wallet
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Not Eligible</h1>
                      <p className="text-gray-500 text-sm mb-5">This wallet did not meet the eligibility criteria.</p>
                      <div className="flex flex-wrap gap-2 justify-center mb-6">
                        {allocation.ineligibilityReasons.map((r) => (
                          <div key={r} className="flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                            <span className="text-xs font-medium text-red-700">{r}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl mb-4 text-xs text-gray-500 max-w-sm">
                        <Shield className="h-4 w-4 text-gray-400 shrink-0" />
                        Score: {scores.total}/100 · Sybil Risk: {sybilAnalysis.riskLevel}
                      </div>
                      <button
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm"
                        style={{ background: BASE_BLUE }}
                        onClick={() => setLocation("/")}
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Try Another Wallet
                      </button>
                    </>
                  )}
                </div>

                {/* Address bar at bottom of card */}
                <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-between bg-gray-50/50">
                  <span className="text-xs text-gray-400 font-mono truncate">{address}</span>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <button onClick={copyAddress} className="text-xs flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors">
                      <Copy className="h-3.5 w-3.5" />
                      {copied ? "Copied!" : "Copy"}
                    </button>
                    <a
                      href={`https://base.blockscout.com/address/${address}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      BlockScout
                    </a>
                  </div>
                </div>
              </div>
            </WhiteCard>
          </motion.div>

          {/* ── Data grid ────────────────────────────────────────────────── */}
          <div className="grid gap-5 lg:grid-cols-3">

            {/* Left / center — wide column */}
            <div className="lg:col-span-2 space-y-5">

              {/* Score breakdown */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <WhiteCard className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <SectionTitle icon={<BarChart3 className="h-4 w-4" />}>Score Breakdown</SectionTitle>
                    <div
                      className="px-3 py-1 rounded-full text-xs font-extrabold text-white"
                      style={{ background: BASE_BLUE }}
                    >
                      {scores.total} / 100
                    </div>
                  </div>

                  <div className="h-48 mb-5">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#E5E7EB" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#6B7280", fontSize: 10 }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Score" dataKey="value" stroke={BASE_BLUE} fill={BASE_BLUE} fillOpacity={0.15} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-1">
                    {scoreBars.map((bar, i) => (
                      <ScoreBar key={bar.label} label={bar.label} value={bar.value} weight={bar.weight} delay={i * 60} />
                    ))}
                    <div className="border-t border-gray-100 pt-2">
                      <div className="flex items-center gap-3 py-1">
                        <div className="w-28 text-xs text-red-500 shrink-0">Sybil Penalty</div>
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className="h-full rounded-full bg-red-400" style={{ width: `${scores.sybilPenalty}%` }} />
                        </div>
                        <div className="w-8 text-right text-xs font-bold text-red-500 shrink-0">-{scores.sybilPenalty}</div>
                      </div>
                    </div>
                  </div>
                </WhiteCard>
              </motion.div>

              {/* Protocol activity */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <WhiteCard className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <SectionTitle icon={<Activity className="h-4 w-4" />}>Protocol Activity</SectionTitle>
                    <span className="text-xs text-gray-400 font-medium">{protocols.length} protocols detected</span>
                  </div>
                  {protocols.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">No protocol interactions detected</div>
                  ) : (
                    <div className="space-y-2">
                      {protocols.map((p, i) => (
                        <motion.div
                          key={p.name}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="h-9 w-9 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
                              style={{ background: `linear-gradient(135deg, ${BASE_BLUE} 0%, ${BASE_BLUE_DARK} 100%)` }}
                            >
                              {p.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{p.name}</div>
                              <div className="text-xs text-gray-400">{p.firstInteraction} — {p.lastInteraction}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-gray-900">{p.txCount} txns</div>
                            <div className="text-xs text-gray-400">{p.volumeEth} ETH</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </WhiteCard>
              </motion.div>

              {/* Timeline */}
              {timeline.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <WhiteCard className="p-6">
                    <SectionTitle icon={<Clock className="h-4 w-4" />}>Wallet Timeline</SectionTitle>
                    <div className="space-y-0">
                      {timeline.map((event, i) => (
                        <div key={i} className="flex gap-4 relative">
                          <div className="flex flex-col items-center">
                            <div
                              className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 z-10 text-white"
                              style={{ background: BASE_BLUE }}
                            >
                              {timelineCatIcon[event.category] ?? <ChevronRight className="h-3 w-3" />}
                            </div>
                            {i < timeline.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1 mb-1 min-h-4" />}
                          </div>
                          <div className="pb-4">
                            <div className="text-xs text-gray-400 font-mono mb-0.5">{event.year}</div>
                            <div className="text-sm text-gray-800 font-medium">{event.event}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </WhiteCard>
                </motion.div>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-5">

              {/* Wallet Profile */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <WhiteCard className="p-6">
                  <SectionTitle icon={<Wallet className="h-4 w-4" />}>Wallet Profile</SectionTitle>
                  <div
                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold text-white mb-4"
                    style={{ background: BASE_BLUE }}
                  >
                    {walletStats.walletType}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Wallet Age", value: `${walletStats.age}d` },
                      { label: "Transactions", value: walletStats.txCount.toLocaleString() },
                      { label: "Active Days", value: walletStats.activeDays },
                      { label: "Active Months", value: walletStats.activeMonths },
                      { label: "Contracts", value: walletStats.uniqueContracts },
                      { label: "Gas Spent", value: `${walletStats.gasSpentEth} ETH` },
                      { label: "ETH Balance", value: `${walletStats.ethBalance} ETH` },
                      { label: "Failed Txns", value: walletStats.failedTx },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-2.5">
                        <div className="text-xs text-gray-400">{label}</div>
                        <div className="font-bold text-gray-900 text-sm mt-0.5">{value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                    <div>
                      <div className="text-xs text-gray-400">First Transaction</div>
                      <div className="font-mono text-xs text-gray-700 mt-0.5">{walletStats.firstTxDate ?? "Unknown"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Last Transaction</div>
                      <div className="font-mono text-xs text-gray-700 mt-0.5">{walletStats.lastTxDate ?? "Unknown"}</div>
                    </div>
                  </div>
                </WhiteCard>
              </motion.div>

              {/* Bridge Activity */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <WhiteCard className="p-6">
                  <SectionTitle icon={<Globe className="h-4 w-4" />}>Bridge Activity</SectionTitle>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      { label: "Bridge Txns", value: bridgeStats.bridgeCount },
                      { label: "Volume", value: `${bridgeStats.bridgeVolumeEth} ETH` },
                      { label: "Days on Base", value: bridgeStats.daysAssetsOnBase },
                      { label: "Avg Size", value: `${bridgeStats.avgBridgeSize} ETH` },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-2.5">
                        <div className="text-xs text-gray-400">{label}</div>
                        <div className="font-bold text-gray-900 text-sm mt-0.5">{value}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-2">Source Chains</div>
                    <div className="flex flex-wrap gap-1.5">
                      {bridgeStats.chainSources.length === 0
                        ? <span className="text-xs text-gray-400">None detected</span>
                        : bridgeStats.chainSources.map(chain => (
                          <span key={chain} className="text-xs font-medium px-2 py-1 rounded-lg" style={{ background: "#EEF3FF", color: BASE_BLUE }}>
                            {chain}
                          </span>
                        ))
                      }
                    </div>
                  </div>
                </WhiteCard>
              </motion.div>

              {/* NFT + Basename row */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
                <div className="grid grid-cols-2 gap-3">
                  <WhiteCard className="p-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Image className="h-3.5 w-3.5" style={{ color: BASE_BLUE }} />
                      <span className="text-xs font-bold text-gray-700">NFTs</span>
                    </div>
                    {nftStats.hasBaseNft ? (
                      <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: "#EEF3FF", color: BASE_BLUE }}>Base NFT ✓</span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-500">None held</span>
                    )}
                    {nftStats.isOgHolder && <div className="mt-1.5 text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-600 font-semibold">OG Holder ⭐</div>}
                    <div className="grid grid-cols-2 gap-1.5 mt-3">
                      <div className="bg-gray-50 rounded-lg p-1.5 text-center">
                        <div className="text-xs text-gray-400">Held</div>
                        <div className="font-bold text-gray-900 text-sm">{nftStats.currentHoldings}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-1.5 text-center">
                        <div className="text-xs text-gray-400">Minted</div>
                        <div className="font-bold text-gray-900 text-sm">{nftStats.mintCount}</div>
                      </div>
                    </div>
                  </WhiteCard>

                  <WhiteCard className="p-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Tag className="h-3.5 w-3.5" style={{ color: BASE_BLUE }} />
                      <span className="text-xs font-bold text-gray-700">Basename</span>
                    </div>
                    {basenameStats.hasBasename ? (
                      <>
                        <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: "#EEF3FF", color: BASE_BLUE }}>Registered ✓</span>
                        {basenameStats.isPrimarySet && <div className="mt-1.5 text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-600 font-medium">Primary Set</div>}
                        {basenameStats.isRenewed && <div className="mt-1.5 text-xs px-2 py-1 rounded-lg bg-green-50 text-green-600 font-medium">Renewed</div>}
                      </>
                    ) : (
                      <>
                        <span className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-500">Not registered</span>
                        <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                          <AlertTriangle className="h-3 w-3" />
                          Missing opportunity
                        </div>
                      </>
                    )}
                  </WhiteCard>
                </div>
              </motion.div>

              {/* Sybil detection */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <WhiteCard className="p-6">
                  <SectionTitle icon={<Shield className="h-4 w-4" />}>Sybil Detection</SectionTitle>
                  <div className="flex items-center gap-4 mb-3">
                    <SybilGauge score={sybilAnalysis.riskScore} level={sybilAnalysis.riskLevel} />
                    <div className="flex-1 space-y-1.5">
                      {sybilAnalysis.signals.map((sig, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs text-gray-500">
                          {sybilAnalysis.riskScore > 40
                            ? <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                            : <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                          }
                          <span>{sig}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </WhiteCard>
              </motion.div>

              {/* Missing opportunities */}
              {missingOpportunities.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
                  <WhiteCard className="p-6">
                    <SectionTitle icon={<TrendingUp className="h-4 w-4" />}>Improve Your Score</SectionTitle>
                    <div className="space-y-2">
                      {missingOpportunities.map((opp, i) => (
                        <div
                          key={i}
                          className="rounded-xl border p-3 hover:shadow-sm transition-shadow"
                          style={{ borderColor: "#E5E7EB" }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="text-xs font-semibold text-gray-800">{opp.title}</div>
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-bold shrink-0"
                              style={{
                                background: impactColor[opp.impact]?.bg ?? "#F5F5F5",
                                color: impactColor[opp.impact]?.text ?? "#666",
                              }}
                            >
                              {opp.impact}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400">{opp.description}</div>
                        </div>
                      ))}
                    </div>
                  </WhiteCard>
                </motion.div>
              )}

              {/* Simulator */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <AirdropSimulator allocation={allocation} />
              </motion.div>
            </div>
          </div>

          {/* Action bar */}
          <div className="flex items-center justify-between gap-4 pt-2 pb-6 flex-wrap">
            <button
              onClick={() => setLocation("/")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              New Analysis
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Re-analyze
            </button>
          </div>

          {/* Disclaimer */}
          <p className="text-center text-xs text-white/40 pb-4 max-w-xl mx-auto">
            Unofficial predictor. Not affiliated with Base or Coinbase. No wallet connection required.
            All results are estimates based on public on-chain data. Not financial advice.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Page root ────────────────────────────────────────────────────────────────
export default function Analyze() {
  const params = useParams<{ address: string }>();
  const search = useSearch();
  const [, setLocation] = useLocation();

  const address = params.address ?? "";
  const xUsername = new URLSearchParams(search).get("xUsername");

  const [analysisStep, setAnalysisStep] = useState(0);
  const [animDone, setAnimDone] = useState(false);
  const stepRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const mutation = useAnalyzeWallet();

  useEffect(() => {
    if (!address) { setLocation("/"); return; }
    mutation.mutate({ data: { address, xUsername: xUsername ?? undefined } });

    stepRef.current = setInterval(() => {
      setAnalysisStep((prev) => {
        if (prev >= ANALYSIS_STEPS.length - 1) { clearInterval(stepRef.current!); setAnimDone(true); return prev; }
        return prev + 1;
      });
    }, 550);

    return () => { if (stepRef.current) clearInterval(stepRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  useEffect(() => {
    if (mutation.isSuccess && !animDone) {
      setAnalysisStep(ANALYSIS_STEPS.length - 1);
      setTimeout(() => setAnimDone(true), 400);
    }
  }, [mutation.isSuccess, animDone]);

  const showResults = animDone && mutation.isSuccess;
  const showProgress = !showResults && !mutation.isError;

  if (mutation.isError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #0038FF 0%, #000B55 100%)" }}>
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "#FEF2F2" }}>
            <ShieldAlert className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Analysis Failed</h2>
          <p className="text-gray-500 text-sm mb-6">
            {(mutation.error as { data?: { error?: string } })?.data?.error ?? "Unable to analyze wallet. Please try again."}
          </p>
          <button
            onClick={() => setLocation("/")}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm"
            style={{ background: BASE_BLUE }}
          >
            <ArrowLeft className="h-4 w-4" />
            Try Another Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {showProgress && (
        <motion.div key="progress" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <AnalysisProgress currentStep={analysisStep} address={address} />
        </motion.div>
      )}
      {showResults && mutation.data && (
        <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <ResultsView data={mutation.data} address={address} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
