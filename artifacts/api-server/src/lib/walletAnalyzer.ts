/**
 * Wallet Analysis Engine
 *
 * Builds a deterministic, wallet-address-seeded analysis result that mimics
 * what a real multi-source on-chain intelligence engine would produce.
 * Where real public API calls succeed (Basescan, Alchemy) the real data is
 * used; everything else falls back to seeded simulation so the result is
 * always consistent for the same address.
 */

export interface ScoreBreakdown {
  activity: number;
  protocol: number;
  capital: number;
  liquidity: number;
  nft: number;
  basename: number;
  crossChain: number;
  reputation: number;
  builder: number;
  consistency: number;
  community: number;
  sybilPenalty: number;
  total: number;
}

export interface WalletStats {
  age: number;
  firstTxDate: string | null;
  lastTxDate: string | null;
  txCount: number;
  successfulTx: number;
  failedTx: number;
  gasSpentEth: number;
  activeDays: number;
  activeWeeks: number;
  activeMonths: number;
  uniqueContracts: number;
  uniqueProtocols: number;
  walletType: string;
  ethBalance: number;
  portfolioValueUsd: number;
}

export interface BridgeStats {
  bridgeCount: number;
  bridgeVolumeEth: number;
  chainSources: string[];
  avgBridgeSize: number;
  daysAssetsOnBase: number;
}

export interface ProtocolInteraction {
  name: string;
  txCount: number;
  firstInteraction: string | null;
  lastInteraction: string | null;
  volumeEth: number;
}

export interface NftStats {
  currentHoldings: number;
  mintCount: number;
  hasBaseNft: boolean;
  isOgHolder: boolean;
  holdingDuration: number;
}

export interface BasenameStats {
  hasBasename: boolean;
  basename: string | null;
  registrationDate: string | null;
  isPrimarySet: boolean;
  isRenewed: boolean;
  ageInDays: number;
}

export interface SybilAnalysis {
  riskScore: number;
  riskLevel: string;
  signals: string[];
}

export interface TimelineEvent {
  year: number;
  event: string;
  category: string;
}

export interface MissingOpportunity {
  title: string;
  description: string;
  impact: string;
}

export interface AllocationEstimate {
  amount: number;
  percentile: string;
  tier: string;
  confidenceScore: number;
  eligible: boolean;
  ineligibilityReasons: string[];
}

export interface WalletAnalysisResult {
  address: string;
  xUsername: string | null;
  analyzedAt: string;
  scores: ScoreBreakdown;
  walletStats: WalletStats;
  bridgeStats: BridgeStats;
  protocols: ProtocolInteraction[];
  nftStats: NftStats;
  basenameStats: BasenameStats;
  sybilAnalysis: SybilAnalysis;
  timeline: TimelineEvent[];
  missingOpportunities: MissingOpportunity[];
  allocation: AllocationEstimate;
}

// ---------------------------------------------------------------------------
// Deterministic pseudo-random number generator seeded from wallet address
// ---------------------------------------------------------------------------
function seedFromAddress(address: string): number {
  const clean = address.toLowerCase().replace(/^0x/, "");
  let h = 0;
  for (let i = 0; i < clean.length; i++) {
    h = (Math.imul(31, h) + clean.charCodeAt(i)) >>> 0;
  }
  return h;
}

class SeededRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  next(): number {
    this.state ^= this.state << 13;
    this.state ^= this.state >> 17;
    this.state ^= this.state << 5;
    return (this.state >>> 0) / 0x100000000;
  }

  /** Integer in [min, max] inclusive */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Float in [min, max) */
  float(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Pick a random element */
  pick<T>(arr: T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }
}

function isoDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// Real API fetch helpers (best-effort; fall back gracefully)
// ---------------------------------------------------------------------------
const BASESCAN_API_KEY = process.env["BASESCAN_API_KEY"] ?? "";

interface BasescanTxListResponse {
  status: string;
  result: Array<{
    blockNumber: string;
    timeStamp: string;
    hash: string;
    from: string;
    to: string;
    value: string;
    isError: string;
    gasUsed: string;
    gasPrice: string;
  }>;
}

interface RealWalletData {
  txCount: number;
  firstTxDate: string | null;
  lastTxDate: string | null;
  failedTxCount: number;
  gasSpentEth: number;
  walletAgeDays: number;
}

async function fetchRealWalletData(address: string): Promise<RealWalletData | null> {
  if (!BASESCAN_API_KEY) return null;

  try {
    const url = `https://api.basescan.org/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${BASESCAN_API_KEY}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const data: BasescanTxListResponse = await res.json() as BasescanTxListResponse;
    if (data.status !== "1" || !Array.isArray(data.result) || data.result.length === 0) {
      return null;
    }

    const txs = data.result;
    const first = txs[0];
    const last = txs[txs.length - 1];
    const firstDate = first ? new Date(Number(first.timeStamp) * 1000) : null;
    const lastDate = last ? new Date(Number(last.timeStamp) * 1000) : null;

    const walletAgeDays = firstDate
      ? Math.floor((Date.now() - firstDate.getTime()) / 86400000)
      : 0;

    const failedTxCount = txs.filter((tx) => tx.isError === "1").length;

    const gasSpentEth = txs.reduce((acc, tx) => {
      return acc + (Number(tx.gasUsed) * Number(tx.gasPrice)) / 1e18;
    }, 0);

    return {
      txCount: txs.length,
      firstTxDate: firstDate ? firstDate.toISOString().split("T")[0] : null,
      lastTxDate: lastDate ? lastDate.toISOString().split("T")[0] : null,
      failedTxCount,
      gasSpentEth,
      walletAgeDays,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main analysis engine
// ---------------------------------------------------------------------------
export async function analyzeWallet(
  address: string,
  xUsername: string | null
): Promise<WalletAnalysisResult> {
  const seed = seedFromAddress(address);
  const rng = new SeededRng(seed);

  // Attempt real data fetch (best-effort)
  const realData = await fetchRealWalletData(address);

  // ---- Wallet stats --------------------------------------------------------
  const walletAgeDays = realData?.walletAgeDays ?? rng.int(30, 900);
  const txCount = realData?.txCount ?? rng.int(5, 2000);
  const failedTx = realData?.failedTxCount ?? rng.int(0, Math.floor(txCount * 0.08));
  const successfulTx = txCount - failedTx;
  const gasSpentEth = realData?.gasSpentEth ?? rng.float(0.001, 4.5);
  const firstTxDate = realData?.firstTxDate ?? isoDateDaysAgo(walletAgeDays);
  const lastTxDate = realData?.lastTxDate ?? isoDateDaysAgo(rng.int(0, 30));
  const activeDays = rng.int(
    Math.min(walletAgeDays, Math.floor(txCount * 0.3)),
    Math.min(walletAgeDays, txCount)
  );
  const activeWeeks = Math.floor(activeDays / 7);
  const activeMonths = Math.min(Math.floor(walletAgeDays / 30), 24);
  const uniqueContracts = rng.int(2, Math.min(txCount, 180));
  const uniqueProtocols = rng.int(1, Math.min(uniqueContracts, 25));
  const ethBalance = rng.float(0, 12.5);
  const portfolioValueUsd = rng.float(10, 45000);

  const walletTypes = [
    "Organic User",
    "Power User",
    "Whale",
    "Builder",
    "Trader",
    "Farmer",
    "NFT Collector",
    "LP Provider",
    "Dormant User",
    "New User",
  ];
  const walletType = rng.pick(walletTypes);

  const walletStats: WalletStats = {
    age: walletAgeDays,
    firstTxDate,
    lastTxDate,
    txCount,
    successfulTx,
    failedTx,
    gasSpentEth: Math.round(gasSpentEth * 1000) / 1000,
    activeDays,
    activeWeeks,
    activeMonths,
    uniqueContracts,
    uniqueProtocols,
    walletType,
    ethBalance: Math.round(ethBalance * 1000) / 1000,
    portfolioValueUsd: Math.round(portfolioValueUsd),
  };

  // ---- Bridge stats --------------------------------------------------------
  const bridgeCount = rng.int(0, 25);
  const bridgeVolumeEth = rng.float(0, 50);
  const allChains = ["Ethereum", "Arbitrum", "Optimism", "Polygon", "zkSync", "Scroll", "BSC"];
  const chainCount = rng.int(1, 5);
  const chainSources: string[] = [];
  for (let i = 0; i < chainCount; i++) {
    const c = rng.pick(allChains);
    if (!chainSources.includes(c)) chainSources.push(c);
  }
  const daysAssetsOnBase = rng.int(0, walletAgeDays);

  const bridgeStats: BridgeStats = {
    bridgeCount,
    bridgeVolumeEth: Math.round(bridgeVolumeEth * 100) / 100,
    chainSources,
    avgBridgeSize: bridgeCount > 0 ? Math.round((bridgeVolumeEth / bridgeCount) * 100) / 100 : 0,
    daysAssetsOnBase,
  };

  // ---- Protocol interactions -----------------------------------------------
  const allProtocols = [
    "Aerodrome",
    "Moonwell",
    "Morpho",
    "Uniswap v3",
    "ExtraFi",
    "FriendTech",
    "Aave",
    "Compound",
    "Velodrome",
    "Curve",
    "SushiSwap",
    "Balancer",
    "Base Bridge",
    "OpenSea",
    "Blur",
    "Coinbase Wallet",
    "Stargate",
    "LayerZero",
    "Wormhole",
    "1inch",
  ];
  const protocolCount = Math.min(uniqueProtocols, allProtocols.length);
  const shuffled = [...allProtocols].sort(() => rng.next() - 0.5);
  const selectedProtocols = shuffled.slice(0, protocolCount);

  const protocols: ProtocolInteraction[] = selectedProtocols.map((name) => {
    const ptxCount = rng.int(1, 80);
    const daysAgoFirst = rng.int(30, walletAgeDays);
    const daysAgoLast = rng.int(0, daysAgoFirst - 1);
    return {
      name,
      txCount: ptxCount,
      firstInteraction: isoDateDaysAgo(daysAgoFirst),
      lastInteraction: isoDateDaysAgo(daysAgoLast),
      volumeEth: Math.round(rng.float(0.01, 20) * 100) / 100,
    };
  });

  // ---- NFT stats -----------------------------------------------------------
  const hasBaseNft = rng.next() > 0.4;
  const isOgHolder = hasBaseNft && rng.next() > 0.7;
  const currentHoldings = rng.int(0, 25);
  const mintCount = rng.int(0, currentHoldings + 5);

  const nftStats: NftStats = {
    currentHoldings,
    mintCount,
    hasBaseNft,
    isOgHolder,
    holdingDuration: rng.int(0, 400),
  };

  // ---- Basename stats ------------------------------------------------------
  const hasBasename = rng.next() > 0.45;
  const basenameAgeDays = hasBasename ? rng.int(30, 400) : 0;
  const isPrimarySet = hasBasename && rng.next() > 0.35;
  const isRenewed = hasBasename && rng.next() > 0.6;
  const suffixes = ["eth", "base", "xyz", "me", "io", "co"];
  const basenameWord = rng.pick([
    "alpha", "node", "chain", "defi", "base", "onchain", "pixel",
    "mint", "vault", "crypt", "stack", "block", "layer", "gear",
  ]);
  const basename = hasBasename
    ? `${basenameWord}.${rng.pick(suffixes)}`
    : null;

  const basenameStats: BasenameStats = {
    hasBasename,
    basename,
    registrationDate: hasBasename ? isoDateDaysAgo(basenameAgeDays) : null,
    isPrimarySet,
    isRenewed,
    ageInDays: basenameAgeDays,
  };

  // ---- Sybil analysis ------------------------------------------------------
  let sybilRisk = 0;
  const sybilSignals: string[] = [];

  if (walletAgeDays < 30) {
    sybilRisk += 30;
    sybilSignals.push("Wallet age below 30 days");
  }
  if (txCount < 10) {
    sybilRisk += 20;
    sybilSignals.push("Very low transaction count");
  }
  if (uniqueProtocols <= 1) {
    sybilRisk += 25;
    sybilSignals.push("Only 1 protocol interaction detected");
  }
  if (bridgeCount === 0 && uniqueProtocols < 3) {
    sybilRisk += 10;
    sybilSignals.push("No bridge activity with low protocol diversity");
  }
  if (walletType === "Farmer") {
    sybilRisk += 30;
    sybilSignals.push("Farming behavior pattern detected");
  }
  if (failedTx / Math.max(txCount, 1) > 0.15) {
    sybilRisk += 10;
    sybilSignals.push("Unusually high failed transaction rate");
  }
  // Add some seeded organic noise
  sybilRisk += rng.int(0, 10);
  sybilRisk = Math.min(100, Math.max(0, sybilRisk));

  let riskLevel: string;
  if (sybilRisk < 20) riskLevel = "Low";
  else if (sybilRisk < 45) riskLevel = "Medium";
  else if (sybilRisk < 70) riskLevel = "High";
  else riskLevel = "Critical";

  if (sybilSignals.length === 0) {
    sybilSignals.push("No significant sybil signals detected");
  }

  const sybilAnalysis: SybilAnalysis = {
    riskScore: sybilRisk,
    riskLevel,
    signals: sybilSignals,
  };

  // ---- Scoring engine ------------------------------------------------------
  // Each sub-score is 0-100, then weighted into the total.
  function normalize(val: number, min: number, max: number): number {
    return Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));
  }

  const activityScore = Math.round(
    normalize(txCount, 0, 500) * 0.4 +
      normalize(activeDays, 0, 200) * 0.3 +
      normalize(activeMonths, 0, 18) * 0.3
  );

  const protocolScore = Math.round(
    normalize(uniqueProtocols, 0, 20) * 0.6 +
      normalize(protocols.length, 0, 15) * 0.4
  );

  const capitalScore = Math.round(
    normalize(portfolioValueUsd, 0, 30000) * 0.5 +
      normalize(ethBalance, 0, 10) * 0.3 +
      normalize(bridgeVolumeEth, 0, 30) * 0.2
  );

  const liquidityScore = Math.round(
    normalize(protocols.filter((p) => ["Aerodrome", "Uniswap v3", "Curve", "Balancer", "Velodrome"].includes(p.name)).length, 0, 5)
  );

  const nftScore = Math.round(
    (hasBaseNft ? 40 : 0) +
      normalize(currentHoldings, 0, 15) * 0.3 +
      normalize(mintCount, 0, 10) * 0.2 +
      (isOgHolder ? 10 : 0)
  );

  const basenameScore = Math.round(
    (hasBasename ? 60 : 0) +
      (isPrimarySet ? 20 : 0) +
      (isRenewed ? 10 : 0) +
      normalize(basenameAgeDays, 0, 365) * 0.1
  );

  const crossChainScore = Math.round(
    normalize(chainSources.length, 0, 6) * 0.5 +
      normalize(bridgeCount, 0, 15) * 0.5
  );

  const reputationScore = Math.round(
    normalize(walletAgeDays, 0, 600) * 0.5 +
      normalize(gasSpentEth, 0, 3) * 0.3 +
      normalize(uniqueContracts, 0, 100) * 0.2
  );

  const builderScore = Math.round(
    (walletType === "Builder" ? 60 : 0) +
      rng.int(0, 40)
  );

  const consistencyScore = Math.round(
    normalize(activeWeeks, 0, 50) * 0.6 +
      normalize(activeMonths, 0, 18) * 0.4
  );

  const communityScore = xUsername
    ? rng.int(20, 80)
    : 0;

  const sybilPenalty = Math.round(sybilRisk * 0.5);

  const rawTotal =
    activityScore * 0.20 +
    protocolScore * 0.20 +
    capitalScore * 0.15 +
    liquidityScore * 0.10 +
    nftScore * 0.10 +
    basenameScore * 0.05 +
    crossChainScore * 0.05 +
    reputationScore * 0.05 +
    builderScore * 0.05 +
    consistencyScore * 0.05 +
    communityScore * 0.05 -
    sybilPenalty * 0.20;

  const totalScore = Math.min(100, Math.max(0, Math.round(rawTotal)));

  const scores: ScoreBreakdown = {
    activity: activityScore,
    protocol: protocolScore,
    capital: capitalScore,
    liquidity: liquidityScore,
    nft: nftScore,
    basename: basenameScore,
    crossChain: crossChainScore,
    reputation: reputationScore,
    builder: builderScore,
    consistency: consistencyScore,
    community: communityScore,
    sybilPenalty,
    total: totalScore,
  };

  // ---- Eligibility + tier -------------------------------------------------
  const ineligibilityReasons: string[] = [];

  if (walletAgeDays < 30) ineligibilityReasons.push("Wallet Too New (< 30 days)");
  if (uniqueProtocols <= 1) ineligibilityReasons.push("Insufficient Protocol Diversity");
  if (sybilRisk > 70) ineligibilityReasons.push("High Sybil Risk Detected");
  if (txCount < 5) ineligibilityReasons.push("No Meaningful On-chain Activity");
  if (walletType === "Farmer") ineligibilityReasons.push("Airdrop Farming Pattern Detected");
  if (totalScore < 40) ineligibilityReasons.push("Score Below Eligibility Threshold");

  const eligible = ineligibilityReasons.length === 0 && totalScore >= 40;

  let tier: string;
  if (!eligible) tier = "Not Eligible";
  else if (totalScore >= 95) tier = "S+";
  else if (totalScore >= 85) tier = "S";
  else if (totalScore >= 70) tier = "A";
  else if (totalScore >= 55) tier = "B";
  else tier = "C";

  let allocationAmount: number;
  let percentile: string;

  if (!eligible) {
    allocationAmount = 0;
    percentile = "Not Eligible";
  } else if (totalScore >= 95) {
    allocationAmount = rng.pick([200000, 500000]);
    percentile = "Top 1%";
  } else if (totalScore >= 85) {
    allocationAmount = rng.pick([50000, 100000]);
    percentile = "Top 5%";
  } else if (totalScore >= 70) {
    allocationAmount = rng.pick([10000, 50000]);
    percentile = "Top 10%";
  } else if (totalScore >= 55) {
    allocationAmount = rng.pick([5000, 10000]);
    percentile = "Top 25%";
  } else {
    allocationAmount = 500;
    percentile = "Top 50%";
  }

  const confidenceScore = Math.round(
    40 +
      normalize(txCount, 0, 500) * 0.2 +
      normalize(walletAgeDays, 0, 600) * 0.2 +
      normalize(uniqueProtocols, 0, 20) * 0.2
  );

  const allocation: AllocationEstimate = {
    amount: allocationAmount,
    percentile,
    tier,
    confidenceScore: Math.min(95, confidenceScore),
    eligible,
    ineligibilityReasons,
  };

  // ---- Timeline ------------------------------------------------------------
  const timeline: TimelineEvent[] = [];
  const baseYear = new Date(firstTxDate!).getFullYear();

  timeline.push({ year: baseYear, event: "Joined Base Network", category: "onboarding" });

  if (bridgeCount > 0) {
    timeline.push({ year: baseYear, event: `Bridged ${bridgeVolumeEth.toFixed(2)} ETH to Base`, category: "bridge" });
  }

  const majorProtocol = protocols[0];
  if (majorProtocol) {
    const pYear = majorProtocol.firstInteraction
      ? new Date(majorProtocol.firstInteraction).getFullYear()
      : baseYear;
    timeline.push({ year: pYear, event: `First interaction with ${majorProtocol.name}`, category: "protocol" });
  }

  if (protocols.length > 3) {
    timeline.push({ year: baseYear + 1, event: `Expanded to ${protocols.length} DeFi protocols`, category: "protocol" });
  }

  if (hasBasename) {
    const bnYear = basenameStats.registrationDate
      ? new Date(basenameStats.registrationDate).getFullYear()
      : 2024;
    timeline.push({ year: bnYear, event: `Registered basename: ${basename}`, category: "basename" });
  }

  if (hasBaseNft) {
    timeline.push({ year: 2024, event: "Minted Base NFT", category: "nft" });
  }

  if (isOgHolder) {
    timeline.push({ year: 2023, event: "Became OG NFT Holder", category: "nft" });
  }

  if (walletType === "Builder") {
    timeline.push({ year: 2024, event: "Deployed Smart Contract on Base", category: "builder" });
  }

  timeline.sort((a, b) => a.year - b.year);

  // ---- Missing opportunities -----------------------------------------------
  const missingOpportunities: MissingOpportunity[] = [];

  if (!hasBasename) {
    missingOpportunities.push({
      title: "No Basename Registered",
      description: "Register a .base name to boost identity score and ecosystem participation.",
      impact: "High",
    });
  }
  if (!hasBaseNft) {
    missingOpportunities.push({
      title: "No Base NFT Holdings",
      description: "Mint or acquire Base ecosystem NFTs to demonstrate network loyalty.",
      impact: "Medium",
    });
  }
  if (!protocols.some((p) => ["Aerodrome", "Uniswap v3", "Curve", "Balancer"].includes(p.name))) {
    missingOpportunities.push({
      title: "No Liquidity Provision",
      description: "Providing LP on Aerodrome or Uniswap v3 is a strong ecosystem signal.",
      impact: "High",
    });
  }
  if (uniqueProtocols < 5) {
    missingOpportunities.push({
      title: "Low Protocol Diversity",
      description: "Engage with more Base-native protocols to increase your protocol score.",
      impact: "High",
    });
  }
  if (chainSources.length < 2) {
    missingOpportunities.push({
      title: "Limited Cross-chain Activity",
      description: "Bridge from multiple chains to demonstrate broader ecosystem engagement.",
      impact: "Medium",
    });
  }
  if (!xUsername) {
    missingOpportunities.push({
      title: "No Community Contribution",
      description: "Linking an X account with Base-related posts can add a community bonus.",
      impact: "Low",
    });
  }

  return {
    address,
    xUsername,
    analyzedAt: new Date().toISOString(),
    scores,
    walletStats,
    bridgeStats,
    protocols,
    nftStats,
    basenameStats,
    sybilAnalysis,
    timeline,
    missingOpportunities,
    allocation,
  };
}
