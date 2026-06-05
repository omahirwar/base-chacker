import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Circle, ArrowLeft, Shield, ShieldAlert, Trophy,
  Activity, Wallet, Globe, Layers, Image, Tag, Clock, AlertTriangle,
  ChevronRight, TrendingUp, Zap, RefreshCw, DollarSign, BarChart3
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  PolarRadiusAxis
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAnalyzeWallet } from "@workspace/api-client-react";
import type { WalletAnalysisResult } from "@workspace/api-client-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

function useCountUp(target: number, duration = 1500, trigger = false) {
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

function AnalysisProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-card/60 border-primary/20 shadow-2xl shadow-primary/10">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-4"
            >
              <Zap className="h-10 w-10 text-primary" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white">Analyzing Wallet</h2>
            <p className="text-muted-foreground mt-1 text-sm">Running 15-point intelligence scan</p>
          </div>
          <div className="space-y-2.5">
            {ANALYSIS_STEPS.map((step, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              return (
                <motion.div
                  key={step}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: i <= currentStep ? 1 : 0.3, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  ) : active ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    >
                      <Circle className="h-4 w-4 text-primary flex-shrink-0" />
                    </motion.div>
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />
                  )}
                  <span className={`text-sm font-medium ${done ? "text-emerald-400" : active ? "text-white" : "text-muted-foreground/40"}`}>
                    {step}
                  </span>
                  {active && (
                    <motion.span
                      className="ml-auto text-xs text-primary"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    >
                      Running...
                    </motion.span>
                  )}
                </motion.div>
              );
            })}
          </div>
          <div className="mt-6">
            <Progress value={(currentStep / ANALYSIS_STEPS.length) * 100} className="h-1.5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getTierColor(tier: string): string {
  switch (tier) {
    case "S+": return "text-yellow-300";
    case "S": return "text-blue-300";
    case "A": return "text-emerald-400";
    case "B": return "text-cyan-400";
    case "C": return "text-orange-400";
    default: return "text-red-400";
  }
}

function getTierBg(tier: string): string {
  switch (tier) {
    case "S+": return "bg-yellow-400/10 border-yellow-400/30 text-yellow-300";
    case "S": return "bg-blue-400/10 border-blue-400/30 text-blue-300";
    case "A": return "bg-emerald-400/10 border-emerald-400/30 text-emerald-400";
    case "B": return "bg-cyan-400/10 border-cyan-400/30 text-cyan-400";
    case "C": return "bg-orange-400/10 border-orange-400/30 text-orange-400";
    default: return "bg-red-400/10 border-red-400/30 text-red-400";
  }
}

function getRiskColor(risk: string): string {
  switch (risk) {
    case "Low": return "text-emerald-400";
    case "Medium": return "text-yellow-400";
    case "High": return "text-orange-400";
    default: return "text-red-400";
  }
}

function ScoreBar({ label, value, weight, delay }: { label: string; value: number; weight?: string; delay: number }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className="flex items-center gap-3">
      <div className="w-32 text-xs text-muted-foreground truncate shrink-0">{label}</div>
      <div className="flex-1 bg-secondary/50 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary"
          initial={{ width: 0 }}
          animate={{ width: animated ? `${value}%` : 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <div className="w-10 text-right text-sm font-bold text-white shrink-0">{value}</div>
      {weight && <div className="w-10 text-right text-xs text-muted-foreground shrink-0">{weight}</div>}
    </div>
  );
}

function SybilGauge({ score, level }: { score: number; level: string }) {
  const color = score < 20 ? "#34d399" : score < 45 ? "#facc15" : score < 70 ? "#fb923c" : "#f87171";
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(217,32%,17%)" strokeWidth="10" />
          <motion.circle
            cx="60" cy="60" r="54" fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{score}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      <Badge className={`mt-2 ${getRiskColor(level)} bg-transparent border font-semibold`}
        style={{ borderColor: color }}>
        {level} Risk
      </Badge>
    </div>
  );
}

interface SimulatorState {
  fdv: number;
  supply: number;
  airdropPct: number;
  eligibleWallets: number;
}

function AirdropSimulator({ allocation }: { allocation: WalletAnalysisResult["allocation"] }) {
  const [sim, setSim] = useState<SimulatorState>({
    fdv: 3,
    supply: 1000,
    airdropPct: 10,
    eligibleWallets: 300000,
  });

  const tokenPrice = (sim.fdv * 1e9) / (sim.supply * 1e6);
  const airdropPool = (sim.supply * 1e6) * (sim.airdropPct / 100);
  const perWallet = airdropPool / sim.eligibleWallets;
  const yourShare = allocation.eligible ? allocation.amount / airdropPool : 0;
  const yourUsd = allocation.eligible ? allocation.amount * tokenPrice : 0;

  return (
    <Card className="bg-card/60 border-primary/20" data-testid="card-simulator">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <DollarSign className="h-5 w-5 text-primary" />
          Airdrop Simulator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">FDV</label>
            <Select value={String(sim.fdv)} onValueChange={(v) => setSim(s => ({ ...s, fdv: Number(v) }))}>
              <SelectTrigger className="bg-background/50 border-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 10].map(v => (
                  <SelectItem key={v} value={String(v)}>${v}B</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Token Supply (M)</label>
            <Select value={String(sim.supply)} onValueChange={(v) => setSim(s => ({ ...s, supply: Number(v) }))}>
              <SelectTrigger className="bg-background/50 border-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[100, 500, 1000, 5000, 10000].map(v => (
                  <SelectItem key={v} value={String(v)}>{v.toLocaleString()}M</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Airdrop %</label>
            <Select value={String(sim.airdropPct)} onValueChange={(v) => setSim(s => ({ ...s, airdropPct: Number(v) }))}>
              <SelectTrigger className="bg-background/50 border-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 15, 20].map(v => (
                  <SelectItem key={v} value={String(v)}>{v}%</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Eligible Wallets</label>
            <Select value={String(sim.eligibleWallets)} onValueChange={(v) => setSim(s => ({ ...s, eligibleWallets: Number(v) }))}>
              <SelectTrigger className="bg-background/50 border-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[50000, 100000, 200000, 300000, 400000, 500000, 1000000].map(v => (
                  <SelectItem key={v} value={String(v)}>{(v / 1000).toFixed(0)}K</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border-t border-border/50 pt-4 grid grid-cols-2 gap-3">
          <div className="bg-background/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Token Price</div>
            <div className="text-lg font-bold text-white">${tokenPrice.toFixed(4)}</div>
          </div>
          <div className="bg-background/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Avg per Wallet</div>
            <div className="text-lg font-bold text-white">{Math.round(perWallet).toLocaleString()} BASE</div>
          </div>
          <div className="bg-background/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Your Share</div>
            <div className="text-lg font-bold text-primary">{(yourShare * 100).toFixed(4)}%</div>
          </div>
          <div className="bg-background/50 rounded-lg p-3 border border-primary/20">
            <div className="text-xs text-muted-foreground">Est. USD Value</div>
            <div className="text-lg font-bold text-emerald-400">
              {allocation.eligible ? `$${yourUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ResultsView({ data, address }: { data: WalletAnalysisResult; address: string }) {
  const [, setLocation] = useLocation();
  const { allocation, scores, walletStats, bridgeStats, protocols, nftStats, basenameStats, sybilAnalysis, timeline, missingOpportunities } = data;
  const countedAllocation = useCountUp(allocation.amount, 1800, true);

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

  const chainColors: Record<string, string> = {
    Ethereum: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    Arbitrum: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    Optimism: "bg-red-500/20 text-red-300 border-red-500/30",
    Polygon: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    zkSync: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    Scroll: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    BSC: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  };

  const impactColor: Record<string, string> = {
    High: "text-red-400 bg-red-400/10 border-red-400/30",
    Medium: "text-amber-400 bg-amber-400/10 border-amber-400/30",
    Low: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  };

  const timelineCatIcon: Record<string, React.ReactNode> = {
    onboarding: <Globe className="h-3 w-3" />,
    bridge: <Layers className="h-3 w-3" />,
    protocol: <Activity className="h-3 w-3" />,
    basename: <Tag className="h-3 w-3" />,
    nft: <Image className="h-3 w-3" />,
    builder: <Zap className="h-3 w-3" />,
  };

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="results-view">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="text-muted-foreground hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            New Analysis
          </Button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span className="hidden sm:block">{address.slice(0, 6)}...{address.slice(-4)}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => window.location.reload()} className="text-muted-foreground">
            <RefreshCw className="h-4 w-4 mr-2" />
            Re-analyze
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-6">

        {/* Verdict Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-6 ${allocation.eligible
            ? "bg-gradient-to-r from-primary/10 to-emerald-500/10 border-primary/30"
            : "bg-gradient-to-r from-red-500/10 to-red-900/10 border-red-500/30"}`}
          data-testid="verdict-banner"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              {allocation.eligible ? (
                <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
                  <Trophy className="h-7 w-7 text-primary" />
                </div>
              ) : (
                <div className="h-14 w-14 rounded-2xl bg-red-500/20 flex items-center justify-center border border-red-500/30">
                  <ShieldAlert className="h-7 w-7 text-red-400" />
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground font-medium mb-0.5">
                  {allocation.eligible ? "Wallet is" : "Wallet is"}
                </div>
                <h1 className={`text-3xl font-extrabold tracking-tight ${allocation.eligible ? "text-white" : "text-red-400"}`}>
                  {allocation.eligible ? "ELIGIBLE" : "NOT ELIGIBLE"}
                </h1>
                {!allocation.eligible && allocation.ineligibilityReasons.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {allocation.ineligibilityReasons.map((r) => (
                      <Badge key={r} variant="outline" className="text-red-400 border-red-400/40 text-xs">{r}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 shrink-0">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Tier</div>
                <div className={`text-2xl font-extrabold ${getTierColor(allocation.tier)}`}>
                  {allocation.tier}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Allocation</div>
                <div className="text-xl font-extrabold text-white">
                  {countedAllocation.toLocaleString()}
                  <span className="text-sm text-muted-foreground ml-1">BASE</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Confidence</div>
                <div className="text-xl font-extrabold text-primary">{allocation.confidenceScore}%</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Rank</div>
                <div className="text-lg font-bold text-white">{allocation.percentile}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main grid */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Score Breakdown */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-card/60 border-primary/20" data-testid="card-scores">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Score Breakdown
                  <Badge className={`ml-auto ${getTierBg(allocation.tier)} border font-bold`}>
                    {scores.total} / 100
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(217,32%,20%)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(215,20%,65%)", fontSize: 10 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar
                        name="Score"
                        dataKey="value"
                        stroke="hsl(217.2,91.2%,59.8%)"
                        fill="hsl(217.2,91.2%,59.8%)"
                        fillOpacity={0.25}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2.5">
                  {scoreBars.map((bar, i) => (
                    <ScoreBar key={bar.label} label={bar.label} value={bar.value} weight={bar.weight} delay={i * 60} />
                  ))}
                  <div className="border-t border-border/50 pt-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-32 text-xs text-red-400 shrink-0">Sybil Penalty</div>
                      <div className="flex-1 bg-secondary/50 rounded-full h-2 overflow-hidden">
                        <div className="h-full rounded-full bg-red-500/60" style={{ width: `${scores.sybilPenalty}%` }} />
                      </div>
                      <div className="w-10 text-right text-sm font-bold text-red-400 shrink-0">-{scores.sybilPenalty}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Protocol Activity */}
            <Card className="bg-card/60 border-primary/20" data-testid="card-protocols">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Activity className="h-5 w-5 text-primary" />
                  Protocol Activity
                  <Badge variant="outline" className="ml-auto text-muted-foreground">{protocols.length} protocols</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {protocols.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">No protocol interactions detected</p>
                ) : (
                  <div className="space-y-2">
                    {protocols.map((p, i) => (
                      <motion.div
                        key={p.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-background/40 hover:bg-background/60 transition-colors"
                        data-testid={`row-protocol-${i}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white">{p.name}</div>
                            <div className="text-xs text-muted-foreground">{p.firstInteraction} — {p.lastInteraction}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-white">{p.txCount} txns</div>
                          <div className="text-xs text-muted-foreground">{p.volumeEth} ETH</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="bg-card/60 border-primary/20" data-testid="card-timeline">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Clock className="h-5 w-5 text-primary" />
                  Wallet Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-0">
                  {timeline.map((event, i) => (
                    <div key={i} className="flex gap-4 relative" data-testid={`timeline-event-${i}`}>
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0 z-10">
                          {timelineCatIcon[event.category] ?? <ChevronRight className="h-3 w-3" />}
                        </div>
                        {i < timeline.length - 1 && (
                          <div className="w-px flex-1 bg-border/50 mt-1 mb-1" />
                        )}
                      </div>
                      <div className={`pb-4 ${i < timeline.length - 1 ? "" : ""}`}>
                        <div className="text-xs text-muted-foreground font-mono mb-0.5">{event.year}</div>
                        <div className="text-sm text-white font-medium">{event.event}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Wallet Stats */}
            <Card className="bg-card/60 border-primary/20" data-testid="card-wallet-stats">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white text-base">
                  <Wallet className="h-4 w-4 text-primary" />
                  Wallet Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-3">
                  <Badge className={`${getTierBg(walletStats.walletType === "Farmer" ? "Not Eligible" : allocation.tier)} border`}>
                    {walletStats.walletType}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2.5 text-sm">
                  {[
                    { label: "Wallet Age", value: `${walletStats.age}d` },
                    { label: "Transactions", value: walletStats.txCount.toLocaleString() },
                    { label: "Active Days", value: walletStats.activeDays },
                    { label: "Active Months", value: walletStats.activeMonths },
                    { label: "Unique Contracts", value: walletStats.uniqueContracts },
                    { label: "Gas Spent", value: `${walletStats.gasSpentEth} ETH` },
                    { label: "ETH Balance", value: `${walletStats.ethBalance} ETH` },
                    { label: "Failed Txns", value: walletStats.failedTx },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-background/40 rounded-lg p-2.5">
                      <div className="text-xs text-muted-foreground">{label}</div>
                      <div className="font-bold text-white mt-0.5">{value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="text-xs text-muted-foreground mb-1">First Transaction</div>
                  <div className="font-mono text-xs text-white">{walletStats.firstTxDate ?? "Unknown"}</div>
                  <div className="text-xs text-muted-foreground mt-2 mb-1">Last Transaction</div>
                  <div className="font-mono text-xs text-white">{walletStats.lastTxDate ?? "Unknown"}</div>
                </div>
              </CardContent>
            </Card>

            {/* Bridge */}
            <Card className="bg-card/60 border-primary/20" data-testid="card-bridge">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white text-base">
                  <Globe className="h-4 w-4 text-primary" />
                  Bridge Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-background/40 rounded-lg p-2.5">
                    <div className="text-xs text-muted-foreground">Bridge Count</div>
                    <div className="text-xl font-bold text-white">{bridgeStats.bridgeCount}</div>
                  </div>
                  <div className="bg-background/40 rounded-lg p-2.5">
                    <div className="text-xs text-muted-foreground">Volume</div>
                    <div className="text-xl font-bold text-white">{bridgeStats.bridgeVolumeEth} ETH</div>
                  </div>
                  <div className="bg-background/40 rounded-lg p-2.5">
                    <div className="text-xs text-muted-foreground">Days on Base</div>
                    <div className="text-xl font-bold text-primary">{bridgeStats.daysAssetsOnBase}</div>
                  </div>
                  <div className="bg-background/40 rounded-lg p-2.5">
                    <div className="text-xs text-muted-foreground">Avg Size</div>
                    <div className="text-xl font-bold text-white">{bridgeStats.avgBridgeSize} ETH</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Source Chains</div>
                  <div className="flex flex-wrap gap-1.5">
                    {bridgeStats.chainSources.length === 0 ? (
                      <span className="text-xs text-muted-foreground">None detected</span>
                    ) : bridgeStats.chainSources.map(chain => (
                      <Badge key={chain} variant="outline" className={chainColors[chain] ?? "text-slate-300 border-slate-500/30"}>
                        {chain}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* NFT & Basename */}
            <div className="grid grid-cols-1 gap-4">
              <Card className="bg-card/60 border-primary/20" data-testid="card-nft">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-white text-base">
                    <Image className="h-4 w-4 text-primary" />
                    NFT Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex gap-2 flex-wrap">
                    {nftStats.hasBaseNft && <Badge className="bg-primary/10 text-primary border-primary/30 border">Base NFT Holder</Badge>}
                    {nftStats.isOgHolder && <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30 border">OG Holder</Badge>}
                    {!nftStats.hasBaseNft && <Badge variant="outline" className="text-muted-foreground">No Base NFTs</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-background/40 rounded-lg p-2">
                      <div className="text-xs text-muted-foreground">Holdings</div>
                      <div className="font-bold text-white">{nftStats.currentHoldings}</div>
                    </div>
                    <div className="bg-background/40 rounded-lg p-2">
                      <div className="text-xs text-muted-foreground">Minted</div>
                      <div className="font-bold text-white">{nftStats.mintCount}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/60 border-primary/20" data-testid="card-basename">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-white text-base">
                    <Tag className="h-4 w-4 text-primary" />
                    Basename
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {basenameStats.hasBasename ? (
                    <>
                      <div className="font-mono text-primary font-bold">{basenameStats.basename}</div>
                      <div className="flex gap-1.5 flex-wrap">
                        {basenameStats.isPrimarySet && <Badge className="bg-primary/10 text-primary border-primary/30 border text-xs">Primary Set</Badge>}
                        {basenameStats.isRenewed && <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border text-xs">Renewed</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Registered {basenameStats.registrationDate} · {basenameStats.ageInDays}d old
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      No Basename registered
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sybil Analysis */}
            <Card className="bg-card/60 border-primary/20" data-testid="card-sybil">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white text-base">
                  <Shield className="h-4 w-4 text-primary" />
                  Sybil Detection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <SybilGauge score={sybilAnalysis.riskScore} level={sybilAnalysis.riskLevel} />
                  <div className="flex-1 pl-4 space-y-1">
                    {sybilAnalysis.signals.map((sig, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        {sybilAnalysis.riskScore > 40 ? (
                          <AlertTriangle className="h-3 w-3 text-amber-400 mt-0.5 shrink-0" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" />
                        )}
                        <span>{sig}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Missing Opportunities */}
            {missingOpportunities.length > 0 && (
              <Card className="bg-card/60 border-amber-500/20" data-testid="card-opportunities">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white text-base">
                    <TrendingUp className="h-4 w-4 text-amber-400" />
                    Missing Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {missingOpportunities.map((opp, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="border border-border/50 rounded-lg p-3 hover:border-amber-500/30 transition-colors"
                      data-testid={`card-opportunity-${i}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="text-sm font-semibold text-white">{opp.title}</div>
                        <Badge variant="outline" className={`${impactColor[opp.impact] ?? ""} border text-xs shrink-0`}>
                          {opp.impact}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">{opp.description}</div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Airdrop Simulator */}
            <AirdropSimulator allocation={allocation} />
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-center py-6 border-t border-border/50">
          <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
            This is an unofficial, read-only predictor tool. Not affiliated with Base, Coinbase, or any related entities.
            Results are estimates based on observed on-chain behavior and publicly available data.
            No wallet connection, signature, or approval is requested or required. Treat all estimates as speculative.
          </p>
        </div>
      </div>
    </div>
  );
}

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

  // Kick off analysis + step animation in parallel
  useEffect(() => {
    if (!address) { setLocation("/"); return; }

    mutation.mutate({ data: { address, xUsername: xUsername ?? undefined } });

    stepRef.current = setInterval(() => {
      setAnalysisStep((prev) => {
        if (prev >= ANALYSIS_STEPS.length - 1) {
          clearInterval(stepRef.current!);
          setAnimDone(true);
          return prev;
        }
        return prev + 1;
      });
    }, 550);

    return () => { if (stepRef.current) clearInterval(stepRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  // Force anim done if mutation resolves first
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card/60 border-red-500/30 text-center p-8">
          <ShieldAlert className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Analysis Failed</h2>
          <p className="text-muted-foreground text-sm mb-6">
            {(mutation.error as { data?: { error?: string } })?.data?.error ?? "Unable to analyze wallet. Please try again."}
          </p>
          <Button onClick={() => setLocation("/")} className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Try Another Wallet
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {showProgress && (
        <motion.div key="progress" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <AnalysisProgress currentStep={analysisStep} />
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
