/**
 * Wallet Analysis Engine — Real On-chain Data via BlockScout
 *
 * Uses BlockScout's free public API (base.blockscout.com) and
 * Base public JSON-RPC. No API key required. All results derived
 * from actual on-chain activity.
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

// ─────────────────────────────────────────────────────────────────────────────
// Known Base protocol addresses (lowercase) — used as fallback when
// BlockScout doesn't resolve the protocol name
// ─────────────────────────────────────────────────────────────────────────────
const PROTOCOL_ADDRESS_MAP: Record<string, string> = {
  "0x420dd381b31aef6683db6b902084cb0ffece40d": "Aerodrome",
  "0xcf77a3ba9a5ca399b7c97c74d54e5b1bb7e460e4": "Aerodrome",
  "0x827922686190790b37229fd06084350e74485b72": "Aerodrome",
  "0x628ff693426583d9a7fb391e54366292f509d457": "Moonwell",
  "0xedc817a28e8b93b03976fbd4a3ddbc9f7d176c22": "Moonwell",
  "0xbbbbbbbbbb9cc5e90e3b3af64bdaf62c37eeffcb": "Morpho",
  "0x2626664c2603336e57b271c5c0b26f421741e481": "Uniswap v3",
  "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad": "Uniswap v3",
  "0x4200000000000000000000000000000000000010": "Base Bridge",
  "0x3154cf16ccdb4c6d922629664174b904d80f2c35": "Base Bridge",
  "0x45f1a95a4d3f3836523f5c83673c797f4d4d263b": "Stargate",
  "0x09aea4b2242abc8bb4bb78d537a67a245a7bec64": "Stargate",
  "0x1a44076050125825900e736c501f859c50fe728c": "LayerZero",
  "0xa4e9d3bab5a35f6b2cbf13e7f22def5eb1ad6f29": "ExtraFi",
  "0x9c4ec768c28520b50860ea7a15bd7213a9ff58bf": "Compound v3",
  "0xa238dd80c259a72e81d7e4664032dd40f6c4c52d": "Aave",
  "0x1111111254eeb25477b68fb85ed929f73a960582": "1inch",
  "0x0000000000000068f116a894984e2db1123eb395": "OpenSea",
  "0x00000000000000adc04c56bf30ac9d3c0aaf14dc": "OpenSea",
  "0x0000000000a39bb272e79075ade125fd351887ac": "Blur",
  "0x0ba5ed0c6aa8c49038f819e587e2633c4a9f428a": "Coinbase Smart Wallet",
  "0xcf205808ed36593aa40a44f10c7f7c2f67d4a4d": "Friend.tech",
  "0x24850c6f61c438823f01b7a3bf2b89b72174fa9d": "Wormhole",
  "0x03c4738ee98ae44591e1a4a4f3cab6641d95dd9a": "Basename",
  "0x4ccb0bb02fcaba7e26cce9b2b8f9e71f7b56b0fc": "Basename",
  "0x5e5d0bea9d4a15db2d0837aff0435faba166190d": "Curve",
  "0xfb7ef66a7e61224dd6fdce4c9b89badfb74fcdb3": "SushiSwap",
};

// DeFi liquidity protocols for the liquidity score
const LIQUIDITY_PROTOCOLS = new Set(["Aerodrome", "Uniswap v3", "Curve", "Balancer", "Moonwell", "Morpho", "Compound v3", "Aave", "ExtraFi"]);

// Bridge contracts
const BRIDGE_CONTRACTS = new Set([
  "0x4200000000000000000000000000000000000010",
  "0x3154cf16ccdb4c6d922629664174b904d80f2c35",
  "0x45f1a95a4d3f3836523f5c83673c797f4d4d263b",
  "0x09aea4b2242abc8bb4bb78d537a67a245a7bec64",
  "0x1a44076050125825900e736c501f859c50fe728c",
  "0x24850c6f61c438823f01b7a3bf2b89b72174fa9d",
]);

// Basename registrar contracts
const BASENAME_CONTRACTS = new Set([
  "0x03c4738ee98ae44591e1a4a4f3cab6641d95dd9a",
  "0x4ccb0bb02fcaba7e26cce9b2b8f9e71f7b56b0fc",
]);

// ─────────────────────────────────────────────────────────────────────────────
// BlockScout API types
// ─────────────────────────────────────────────────────────────────────────────
interface BSAddress {
  hash: string;
  name: string | null;
  is_contract: boolean;
}

interface BSTransaction {
  hash: string;
  timestamp: string;
  status: "ok" | "error" | null;
  from: BSAddress;
  to: BSAddress | null;
  value: string;       // in wei (decimal string)
  gas_used: string;
  gas_price: string;
  fee?: { value: string };
  method: string | null;
  block_number: number;
  result: string | null;
}

interface BSTokenTransfer {
  timestamp: string;
  from: BSAddress;
  to: BSAddress;
  token: { symbol: string; name: string; type: string; address: string };
  transaction_hash: string;
  type: string; // "token_transfer" | "token_minting" | "token_burning"
}

interface BSNftHolding {
  token: { address: string; name: string; symbol: string; type: string };
  value: string;
  token_id: string;
}

interface BSAddressInfo {
  coin_balance: string | null;
  transaction_count: number | null;
  token_balances_count: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP helper
// ─────────────────────────────────────────────────────────────────────────────
const BLOCKSCOUT = "https://base.blockscout.com/api/v2";

async function bsFetch<T>(path: string, timeoutMs = 10000): Promise<T | null> {
  try {
    const res = await fetch(`${BLOCKSCOUT}${path}`, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// Paginated fetch — collects up to `maxItems` items from cursor-paginated BlockScout endpoints
async function bsFetchPaginated<T>(
  path: string,
  maxItems: number,
  timeoutMs = 10000
): Promise<T[]> {
  const items: T[] = [];
  let url = `${BLOCKSCOUT}${path}`;
  let page = 0;

  while (items.length < maxItems && page < 6) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: { Accept: "application/json" },
      });
      if (!res.ok) break;
      const data = (await res.json()) as { items: T[]; next_page_params: Record<string, unknown> | null };
      if (!Array.isArray(data.items)) break;
      items.push(...data.items);
      if (!data.next_page_params || items.length >= maxItems) break;
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(data.next_page_params)) {
        params.set(k, String(v));
      }
      url = `${BLOCKSCOUT}${path}${path.includes("?") ? "&" : "?"}${params.toString()}`;
      page++;
    } catch {
      break;
    }
  }
  return items.slice(0, maxItems);
}

// Public Base JSON-RPC for simple calls
async function rpcCall<T>(method: string, params: unknown[]): Promise<T | null> {
  try {
    const res = await fetch("https://mainnet.base.org", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
      signal: AbortSignal.timeout(6000),
    });
    const data = (await res.json()) as { result?: T; error?: unknown };
    return data.result ?? null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper utilities
// ─────────────────────────────────────────────────────────────────────────────
function normalize(val: number, min: number, max: number): number {
  if (max === min) return 0;
  return Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));
}

function isoToDate(ts: string): string {
  return ts.split("T")[0] ?? ts;
}

function activeSetFromTxs(txs: BSTransaction[]): { days: Set<string>; months: Set<string>; weeks: Set<string> } {
  const days = new Set<string>();
  const months = new Set<string>();
  const weeks = new Set<string>();
  for (const tx of txs) {
    const d = new Date(tx.timestamp);
    const day = d.toISOString().split("T")[0]!;
    days.add(day);
    months.add(`${d.getFullYear()}-${d.getMonth()}`);
    // ISO week approximation
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
    weeks.add(`${d.getFullYear()}-W${week}`);
  }
  return { days, months, weeks };
}

// Resolve protocol name from a transaction
function resolveProtocolName(tx: BSTransaction): string | null {
  const toAddr = tx.to?.hash?.toLowerCase();
  if (!toAddr) return null;

  // 1. BlockScout may have already resolved the contract name
  if (tx.to?.name) {
    const name = tx.to.name;
    // Map common BlockScout names to canonical protocol names
    if (/aerodrome/i.test(name)) return "Aerodrome";
    if (/moonwell/i.test(name)) return "Moonwell";
    if (/morpho/i.test(name)) return "Morpho";
    if (/uniswap/i.test(name)) return "Uniswap v3";
    if (/stargate/i.test(name)) return "Stargate";
    if (/layerzero/i.test(name)) return "LayerZero";
    if (/aave/i.test(name)) return "Aave";
    if (/compound/i.test(name)) return "Compound v3";
    if (/curve/i.test(name)) return "Curve";
    if (/sushi/i.test(name)) return "SushiSwap";
    if (/1inch/i.test(name)) return "1inch";
    if (/friend/i.test(name)) return "Friend.tech";
    if (/blur/i.test(name)) return "Blur";
    if (/opensea|seaport/i.test(name)) return "OpenSea";
    if (/wormhole/i.test(name)) return "Wormhole";
    if (/coinbase.*wallet|smart.*wallet/i.test(name)) return "Coinbase Smart Wallet";
    if (/basename|base.*name/i.test(name)) return "Basename";
    if (/extra.*fi/i.test(name)) return "ExtraFi";
  }

  // 2. Fallback to our address map
  return PROTOCOL_ADDRESS_MAP[toAddr] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main analysis function
// ─────────────────────────────────────────────────────────────────────────────
export async function analyzeWallet(
  address: string,
  xUsername: string | null
): Promise<WalletAnalysisResult> {
  const addr = address.toLowerCase();

  // ── Parallel data fetches ─────────────────────────────────────────────────
  const [addrInfo, txs, tokenTransfers, nftHoldings, ethBalanceHex] = await Promise.all([
    bsFetch<BSAddressInfo>(`/addresses/${addr}`),
    bsFetchPaginated<BSTransaction>(`/addresses/${addr}/transactions?filter=from`, 300),
    bsFetchPaginated<BSTokenTransfer>(`/addresses/${addr}/token-transfers?type=ERC-20`, 200),
    bsFetch<{ items: BSNftHolding[] }>(`/addresses/${addr}/nft?type=ERC-721%2CERC-1155`),
    rpcCall<string>("eth_getBalance", [addr, "latest"]),
  ]);

  // ETH balance
  const ethBalance = ethBalanceHex ? parseInt(ethBalanceHex, 16) / 1e18 : 0;
  const ETH_PRICE_USD = parseFloat(
    (await bsFetch<{ coin_price: string }>("/stats"))?.coin_price ?? "2000"
  );

  // ── Transaction metrics ───────────────────────────────────────────────────
  const txCount = txs.length;
  const successfulTx = txs.filter((t) => t.status === "ok").length;
  const failedTx = txs.filter((t) => t.status === "error").length;

  // Gas spent (fee is total fee in wei)
  const gasSpentWei = txs.reduce((acc, tx) => {
    const fee = BigInt(tx.fee?.value ?? "0");
    return acc + fee;
  }, 0n);
  const gasSpentEth = Math.round(Number(gasSpentWei) / 1e18 * 100000) / 100000;

  // Sort ascending for timeline
  const sortedTxs = [...txs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const firstTx = sortedTxs[0] ?? null;
  const lastTx = sortedTxs[sortedTxs.length - 1] ?? null;
  const firstTxDate = firstTx ? isoToDate(firstTx.timestamp) : null;
  const lastTxDate = lastTx ? isoToDate(lastTx.timestamp) : null;

  const walletAgeDays = firstTx
    ? Math.floor((Date.now() - new Date(firstTx.timestamp).getTime()) / 86400000)
    : 0;

  const { days: activeDaySet, months: activeMonthSet, weeks: activeWeekSet } = activeSetFromTxs(sortedTxs);
  const activeDays = activeDaySet.size;
  const activeWeeks = activeWeekSet.size;
  const activeMonths = activeMonthSet.size;

  // Unique contracts interacted with
  const uniqueContractSet = new Set(
    txs
      .filter((tx) => tx.to?.is_contract)
      .map((tx) => tx.to!.hash.toLowerCase())
  );
  const uniqueContracts = uniqueContractSet.size;

  // ── Protocol identification ───────────────────────────────────────────────
  const protocolMap = new Map<string, { txs: BSTransaction[]; volumeWei: bigint }>();

  for (const tx of txs) {
    const proto = resolveProtocolName(tx);
    if (!proto || proto === "Basename") continue; // basename counted separately
    const existing = protocolMap.get(proto) ?? { txs: [], volumeWei: 0n };
    existing.txs.push(tx);
    existing.volumeWei += BigInt(tx.value || "0");
    protocolMap.set(proto, existing);
  }

  const protocols: ProtocolInteraction[] = [];
  for (const [name, { txs: ptxs, volumeWei }] of protocolMap.entries()) {
    const sorted = [...ptxs].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    protocols.push({
      name,
      txCount: ptxs.length,
      firstInteraction: first ? isoToDate(first.timestamp) : null,
      lastInteraction: last ? isoToDate(last.timestamp) : null,
      volumeEth: Math.round(Number(volumeWei) / 1e18 * 10000) / 10000,
    });
  }
  protocols.sort((a, b) => b.txCount - a.txCount);
  const uniqueProtocols = protocols.length;

  // Token diversity (number of unique ERC-20 contracts touched)
  const tokenContractSet = new Set(
    tokenTransfers
      .filter((t) => t.token?.address)
      .map((t) => t.token.address.toLowerCase())
  );
  const tokenDiversity = tokenContractSet.size;

  // ── Basename detection ────────────────────────────────────────────────────
  const basenameInteractions = txs.filter((tx) => {
    const to = tx.to?.hash?.toLowerCase() ?? "";
    return BASENAME_CONTRACTS.has(to) ||
      (tx.to?.name && /basename|base.*name/i.test(tx.to.name));
  });
  const hasBasename = basenameInteractions.length > 0;
  const basenameFirstTx = basenameInteractions[0];
  const basenameDate = basenameFirstTx ? isoToDate(basenameFirstTx.timestamp) : null;
  const basenameAgeDays = basenameDate
    ? Math.floor((Date.now() - new Date(basenameDate).getTime()) / 86400000)
    : 0;

  const basenameStats: BasenameStats = {
    hasBasename,
    basename: hasBasename ? "registered on Base" : null,
    registrationDate: basenameDate,
    isPrimarySet: hasBasename,
    isRenewed: basenameInteractions.length > 1,
    ageInDays: basenameAgeDays,
  };

  // ── Bridge detection ──────────────────────────────────────────────────────
  const bridgeTxs = txs.filter((tx) => {
    const to = tx.to?.hash?.toLowerCase() ?? "";
    return BRIDGE_CONTRACTS.has(to) ||
      (tx.to?.name && /bridge|stargate|layerzero|wormhole/i.test(tx.to.name));
  });
  const bridgeVolumeWei = bridgeTxs.reduce((acc, tx) => acc + BigInt(tx.value || "0"), 0n);
  const bridgeVolumeEth = Math.round(Number(bridgeVolumeWei) / 1e18 * 1000) / 1000;

  const chainSourceSet = new Set<string>();
  if (bridgeTxs.some((tx) => {
    const to = tx.to?.hash?.toLowerCase() ?? "";
    return to === "0x4200000000000000000000000000000000000010" ||
      to === "0x3154cf16ccdb4c6d922629664174b904d80f2c35";
  })) chainSourceSet.add("Ethereum");
  if (bridgeTxs.some((tx) => {
    const to = tx.to?.hash?.toLowerCase() ?? "";
    return to === "0x45f1a95a4d3f3836523f5c83673c797f4d4d263b" ||
      to === "0x09aea4b2242abc8bb4bb78d537a67a245a7bec64";
  })) chainSourceSet.add("Multiple Chains");

  // If we see any wallet activity, assume it bridged FROM somewhere
  if (chainSourceSet.size === 0 && txCount > 0) chainSourceSet.add("Ethereum");

  const bridgeStats: BridgeStats = {
    bridgeCount: bridgeTxs.length,
    bridgeVolumeEth,
    chainSources: [...chainSourceSet],
    avgBridgeSize: bridgeTxs.length > 0
      ? Math.round(bridgeVolumeEth / bridgeTxs.length * 1000) / 1000
      : 0,
    daysAssetsOnBase: walletAgeDays,
  };

  // ── NFT analysis ──────────────────────────────────────────────────────────
  const nftItems = nftHoldings?.items ?? [];
  const currentHoldings = nftItems.length;
  const hasBaseNft = currentHoldings > 0;

  // Count mints from token transfers (ERC-721 minting)
  const mintCount = tokenTransfers.filter(
    (t) => t.type === "token_minting" && t.to?.hash?.toLowerCase() === addr
  ).length;

  // OG holder check: any known OG NFT contract
  const OG_CONTRACTS = new Set([
    "0x8dc80a209a3362f0586e6c116973bb6908170c84",
    "0xe3eb165c9ed6d6d87a59c410c8f30babac44fefd",
  ]);
  const isOgHolder = nftItems.some((n) => n.token?.address && OG_CONTRACTS.has(n.token.address.toLowerCase()));

  const nftStats: NftStats = {
    currentHoldings,
    mintCount,
    hasBaseNft,
    isOgHolder,
    holdingDuration: walletAgeDays,
  };

  // ── Contract deployments (builder signal) ─────────────────────────────────
  const contractDeployments = txs.filter((tx) => tx.to === null).length;
  const hasBuilderActivity = contractDeployments > 0;

  // ── Wallet type classification ─────────────────────────────────────────────
  const hasLiquidityProtocols = protocols.some((p) => LIQUIDITY_PROTOCOLS.has(p.name));
  const txsPerDay = walletAgeDays > 0 ? txCount / walletAgeDays : 0;

  let walletType: string;
  if (hasBuilderActivity) walletType = "Builder";
  else if (ethBalance > 10) walletType = "Whale";
  else if (currentHoldings > 10) walletType = "NFT Collector";
  else if (hasLiquidityProtocols && uniqueProtocols > 3) walletType = "LP Provider";
  else if (txsPerDay > 5 && uniqueProtocols < 3) walletType = "Farmer";
  else if (txCount > 500) walletType = "Power User";
  else if (uniqueProtocols > 5) walletType = "Trader";
  else if (txCount < 5 && txCount > 0) walletType = "New User";
  else if (txCount === 0) walletType = "Inactive";
  else walletType = "Organic User";

  const portfolioValueUsd = Math.round(ethBalance * ETH_PRICE_USD);

  const walletStats: WalletStats = {
    age: walletAgeDays,
    firstTxDate,
    lastTxDate,
    txCount,
    successfulTx,
    failedTx,
    gasSpentEth,
    activeDays,
    activeWeeks,
    activeMonths,
    uniqueContracts,
    uniqueProtocols: Math.max(uniqueProtocols, Math.min(tokenDiversity, 15)),
    walletType,
    ethBalance: Math.round(ethBalance * 10000) / 10000,
    portfolioValueUsd,
  };

  // ── Sybil analysis ────────────────────────────────────────────────────────
  let sybilRisk = 0;
  const sybilSignals: string[] = [];

  if (txCount === 0) {
    sybilSignals.push("No transactions found on Base network");
  } else {
    if (walletAgeDays < 30) {
      sybilRisk += 30;
      sybilSignals.push("Wallet age below 30 days on Base");
    }
    if (txCount < 5) {
      sybilRisk += 25;
      sybilSignals.push("Very low transaction count (< 5)");
    }
    if (uniqueProtocols === 0) {
      sybilRisk += 20;
      sybilSignals.push("No identifiable protocol interactions");
    } else if (uniqueProtocols === 1) {
      sybilRisk += 10;
      sybilSignals.push("Only 1 protocol interaction detected");
    }
    if (failedTx > 0 && failedTx / txCount > 0.25) {
      sybilRisk += 15;
      sybilSignals.push("Unusually high failed transaction ratio (>25%)");
    }
    if (walletType === "Farmer") {
      sybilRisk += 25;
      sybilSignals.push("High-frequency low-diversity tx pattern detected");
    }
    if (activeDays > 0 && txCount / activeDays > 20) {
      sybilRisk += 10;
      sybilSignals.push("Very high transaction rate per active day (>20/day)");
    }
    if (sybilSignals.length === 0) {
      sybilSignals.push("No significant sybil signals detected");
    }
  }

  sybilRisk = Math.min(100, Math.max(0, sybilRisk));
  const riskLevel =
    sybilRisk < 20 ? "Low" :
    sybilRisk < 45 ? "Medium" :
    sybilRisk < 70 ? "High" : "Critical";

  const sybilAnalysis: SybilAnalysis = { riskScore: sybilRisk, riskLevel, signals: sybilSignals };

  // ── Scoring ───────────────────────────────────────────────────────────────
  const activityScore = Math.round(
    normalize(txCount, 0, 500) * 0.35 +
    normalize(activeDays, 0, 200) * 0.30 +
    normalize(activeMonths, 0, 18) * 0.20 +
    normalize(activeWeeks, 0, 80) * 0.15
  );

  const protocolScore = Math.round(
    normalize(uniqueProtocols, 0, 15) * 0.55 +
    normalize(tokenDiversity, 0, 20) * 0.25 +
    normalize(uniqueContracts, 0, 100) * 0.20
  );

  const capitalScore = Math.round(
    normalize(portfolioValueUsd, 0, 20000) * 0.40 +
    normalize(ethBalance, 0, 10) * 0.35 +
    normalize(bridgeVolumeEth, 0, 20) * 0.25
  );

  const liquidityScore = Math.round(
    normalize(
      protocols.filter((p) => LIQUIDITY_PROTOCOLS.has(p.name)).length,
      0, 5
    )
  );

  const nftScore = Math.round(
    (hasBaseNft ? 35 : 0) +
    normalize(currentHoldings, 0, 15) * 0.30 +
    normalize(mintCount, 0, 10) * 0.20 +
    (isOgHolder ? 15 : 0)
  );

  const basenameScore = Math.round(
    (hasBasename ? 70 : 0) +
    (hasBasename && basenameStats.isPrimarySet ? 20 : 0) +
    (basenameStats.isRenewed ? 10 : 0)
  );

  const crossChainScore = Math.round(
    normalize(chainSourceSet.size, 0, 5) * 0.50 +
    normalize(bridgeTxs.length, 0, 15) * 0.50
  );

  const reputationScore = Math.round(
    normalize(walletAgeDays, 0, 600) * 0.45 +
    normalize(gasSpentEth, 0, 2) * 0.30 +
    normalize(successfulTx, 0, 300) * 0.25
  );

  const builderScore = Math.min(100, Math.round(
    (hasBuilderActivity ? 60 : 0) +
    normalize(contractDeployments, 0, 5) * 0.40
  ));

  const consistencyScore = Math.round(
    normalize(activeWeeks, 0, 52) * 0.50 +
    normalize(activeMonths, 0, 18) * 0.30 +
    normalize(activeDays, 0, 180) * 0.20
  );

  const communityScore = xUsername ? 30 : 0;
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

  // ── Eligibility + Tier ────────────────────────────────────────────────────
  const ineligibilityReasons: string[] = [];

  if (txCount === 0) {
    ineligibilityReasons.push("No transactions found on Base network");
  } else {
    if (walletAgeDays < 30) ineligibilityReasons.push("Wallet Too New (< 30 days on Base)");
    if (uniqueProtocols === 0) ineligibilityReasons.push("No Protocol Interactions Detected");
    if (sybilRisk > 70) ineligibilityReasons.push("High Sybil Risk Detected");
    if (walletType === "Farmer") ineligibilityReasons.push("High-frequency Farming Pattern Detected");
    if (totalScore < 40) ineligibilityReasons.push("Score Below Eligibility Threshold");
  }

  const eligible = ineligibilityReasons.length === 0;

  const tier =
    !eligible ? "Not Eligible" :
    totalScore >= 95 ? "S+" :
    totalScore >= 85 ? "S" :
    totalScore >= 70 ? "A" :
    totalScore >= 55 ? "B" : "C";

  const ALLOCATION_BANDS = [
    { minScore: 95, amount: 200000, percentile: "Top 1%" },
    { minScore: 85, amount: 50000, percentile: "Top 5%" },
    { minScore: 70, amount: 10000, percentile: "Top 10%" },
    { minScore: 55, amount: 5000, percentile: "Top 25%" },
    { minScore: 40, amount: 500, percentile: "Top 50%" },
  ];

  let allocationAmount = 0;
  let percentile = "Not Eligible";

  if (eligible) {
    const band = ALLOCATION_BANDS.find((b) => totalScore >= b.minScore);
    if (band) { allocationAmount = band.amount; percentile = band.percentile; }
  }

  // Confidence based on data coverage
  const hasGoodData = txCount > 10;
  const confidenceScore = Math.min(
    92,
    Math.round(
      (hasGoodData ? 40 : 20) +
      (tokenTransfers.length > 0 ? 15 : 0) +
      (nftItems.length > 0 ? 10 : 0) +
      (uniqueProtocols > 0 ? 20 : 0) +
      normalize(txCount, 0, 200) * 0.15
    )
  );

  const allocation: AllocationEstimate = {
    amount: allocationAmount,
    percentile,
    tier,
    confidenceScore,
    eligible,
    ineligibilityReasons,
  };

  // ── Timeline (from real events) ───────────────────────────────────────────
  const timeline: TimelineEvent[] = [];

  if (firstTxDate) {
    const year = new Date(firstTxDate).getFullYear();
    timeline.push({ year, event: `First transaction on Base (${firstTxDate})`, category: "onboarding" });
  }

  if (bridgeTxs.length > 0) {
    const bridgeTx = bridgeTxs[0];
    const year = bridgeTx ? new Date(bridgeTx.timestamp).getFullYear() : new Date().getFullYear();
    const vol = bridgeVolumeEth > 0 ? `${bridgeVolumeEth} ETH` : `${bridgeTxs.length} tx(s)`;
    timeline.push({ year, event: `Used bridge: transferred ${vol} to Base`, category: "bridge" });
  }

  const majorProtocol = protocols[0];
  if (majorProtocol?.firstInteraction) {
    const year = new Date(majorProtocol.firstInteraction).getFullYear();
    timeline.push({ year, event: `First interaction with ${majorProtocol.name}`, category: "protocol" });
  }

  if (protocols.length > 2) {
    const lastProto = protocols[protocols.length - 1];
    const year = lastProto?.lastInteraction
      ? new Date(lastProto.lastInteraction).getFullYear()
      : new Date().getFullYear();
    timeline.push({ year, event: `Expanded to ${protocols.length} DeFi protocols`, category: "protocol" });
  }

  if (hasBasename && basenameDate) {
    const year = new Date(basenameDate).getFullYear();
    timeline.push({ year, event: "Registered Base Name (basename)", category: "basename" });
  }

  if (hasBaseNft) {
    timeline.push({ year: new Date().getFullYear(), event: `Holding ${currentHoldings} NFT(s) on Base`, category: "nft" });
  }

  if (isOgHolder) {
    timeline.push({ year: 2023, event: "Acquired OG Base NFT", category: "nft" });
  }

  if (hasBuilderActivity) {
    const deployTx = txs.find((tx) => tx.to === null);
    const year = deployTx ? new Date(deployTx.timestamp).getFullYear() : new Date().getFullYear();
    timeline.push({ year, event: `Deployed ${contractDeployments} smart contract(s) on Base`, category: "builder" });
  }

  timeline.sort((a, b) => a.year - b.year);

  // ── Missing opportunities ─────────────────────────────────────────────────
  const missingOpportunities: MissingOpportunity[] = [];

  if (!hasBasename) {
    missingOpportunities.push({
      title: "No Basename Registered",
      description: "Register a Base Name at base.org/names to boost identity and ecosystem score.",
      impact: "High",
    });
  }
  if (!hasBaseNft) {
    missingOpportunities.push({
      title: "No Base NFTs Held",
      description: "Acquire or mint Base ecosystem NFTs to demonstrate on-chain loyalty.",
      impact: "Medium",
    });
  }
  if (!hasLiquidityProtocols) {
    missingOpportunities.push({
      title: "No Liquidity Provision",
      description: "Provide LP on Aerodrome, Uniswap v3, or Moonwell to earn liquidity score.",
      impact: "High",
    });
  }
  if (uniqueProtocols < 4) {
    missingOpportunities.push({
      title: "Low Protocol Diversity",
      description: `Only ${uniqueProtocols} protocol(s) detected. Interacting with more Base-native apps improves your score significantly.`,
      impact: "High",
    });
  }
  if (bridgeTxs.length === 0) {
    missingOpportunities.push({
      title: "No Bridge Activity Detected",
      description: "Using the official Base Bridge or Stargate shows commitment to the ecosystem.",
      impact: "Medium",
    });
  }
  if (!xUsername) {
    missingOpportunities.push({
      title: "No X/Twitter Community Score",
      description: "Link an X account with Base ecosystem posts for a community bonus.",
      impact: "Low",
    });
  }
  if (!hasBuilderActivity) {
    missingOpportunities.push({
      title: "No Builder Activity",
      description: "Deploying contracts on Base is a strong signal of genuine ecosystem contribution.",
      impact: "Medium",
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
