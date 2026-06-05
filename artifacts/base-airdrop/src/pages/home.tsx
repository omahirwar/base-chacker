import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Activity, ShieldCheck, Wallet, ArrowRight, Zap, Trophy, ShieldAlert, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function Home() {
  const [, setLocation] = useLocation();
  const [address, setAddress] = useState("");
  const [xUsername, setXUsername] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    const url = new URLSearchParams();
    if (xUsername) url.set("xUsername", xUsername);
    setLocation(`/analyze/${address}${url.toString() ? `?${url.toString()}` : ""}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30">
      <header className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 font-bold text-xl tracking-tight text-primary">
            <Zap className="h-6 w-6 text-primary" />
            <span>BasePredictor</span>
          </div>
          <div className="flex items-center space-x-4 text-sm font-medium text-muted-foreground hidden sm:flex">
            <div className="flex items-center text-primary">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse mr-2" />
              Intelligence Engine Online
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <Activity className="mr-2 h-4 w-4" />
                V2.1 Intelligence Model Live
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-white drop-shadow-sm">
                Unofficial <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-primary">Base Airdrop</span> Predictor
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                A precise, data-driven wallet intelligence engine. Analyze your on-chain behavior against 11 proprietary scoring dimensions to estimate potential allocation.
              </p>

              {/* Progress Steps */}
              <div className="hidden md:flex items-center justify-center space-x-4 text-sm font-medium text-muted-foreground my-8">
                <span className="text-primary">Wallet Address</span>
                <ArrowRight className="h-4 w-4 opacity-50" />
                <span>Check Eligibility</span>
                <ArrowRight className="h-4 w-4 opacity-50" />
                <span>Verify Contribution</span>
                <ArrowRight className="h-4 w-4 opacity-50" />
                <span>Allocation Estimate</span>
              </div>

              {/* Form */}
              <Card className="bg-card/50 border-primary/20 shadow-2xl shadow-primary/5 backdrop-blur-xl">
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-4 text-left">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address" className="text-white font-semibold">Wallet Address</Label>
                        <div className="relative">
                          <Wallet className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="address"
                            placeholder="0x..."
                            className="pl-10 h-12 bg-background/50 border-primary/20 text-lg font-mono focus-visible:ring-primary focus-visible:border-primary"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="xUsername" className="text-white font-semibold text-sm">X (Twitter) Username <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                        <Input
                          id="xUsername"
                          placeholder="@username"
                          className="h-12 bg-background/50 border-primary/20"
                          value={xUsername}
                          onChange={(e) => setXUsername(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button type="submit" size="lg" className="w-full h-12 text-lg font-bold" disabled={!address}>
                      <Search className="mr-2 h-5 w-5" />
                      Run Analysis
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Examples Section */}
        <section className="py-20 bg-card/30 border-y border-border/50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-12 text-white">Recent Analyses</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { address: "0x7a5b...9c21", tier: "S+", amount: "85,420", color: "text-blue-400" },
                { address: "0x3f1d...b4e8", tier: "A", amount: "12,150", color: "text-emerald-400" },
                { address: "0x92c4...f1a7", tier: "C", amount: "850", color: "text-amber-400" },
              ].map((example, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="bg-background/50 border-primary/10 hover:border-primary/30 transition-colors cursor-default">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-mono text-sm text-muted-foreground">{example.address}</span>
                        <span className={`font-bold text-xl ${example.color}`}>{example.tier} Tier</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Estimated Allocation</p>
                        <p className="text-2xl font-bold text-white">{example.amount} BASE</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12 text-white">Intelligence Methodology</h2>
              <div className="grid gap-8 md:grid-cols-2">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                      <BarChart className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">11-Dimension Scoring</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Our engine evaluates wallets across 11 distinct categories including Capital efficiency, Protocol diversity, Bridge history, NFT ownership, and Consistency of activity over time.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-10 w-10 rounded-lg bg-destructive/20 flex items-center justify-center border border-destructive/30">
                      <ShieldAlert className="h-5 w-5 text-destructive" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Sybil Resistance</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Advanced heuristics detect industrial farming patterns. Wallets exhibiting strict programmatic behavior, identical funding sources, or zero organic interaction face severe penalties.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Tier Classification</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Wallets are grouped into tiers (S+ to C) based on their relative percentile ranking against the global cohort. Only the top echelon receives maximum theoretical allocations.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Read-Only Safety</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      This application operates strictly on public on-chain data. It does not request wallet connections, signatures, or permissions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-8 bg-background">
        <div className="container mx-auto px-4 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            This is an unofficial predictor. Not affiliated with Base or Coinbase. Results are estimates based on observed on-chain behavior.
          </p>
          <p className="text-xs text-muted-foreground/60">
            Built by{" "}
            <a
              href="https://x.com/hi_vecna"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              @hi_vecna
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
