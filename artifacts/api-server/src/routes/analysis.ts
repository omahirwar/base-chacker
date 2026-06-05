import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { walletAnalysisTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { analyzeWallet } from "../lib/walletAnalyzer.js";

const router = Router();

const WalletAnalysisInputSchema = z.object({
  address: z
    .string()
    .min(1, "Address is required")
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format"),
  xUsername: z.string().nullable().optional(),
});

/** POST /api/analyze */
router.post("/analyze", async (req, res) => {
  const parsed = WalletAnalysisInputSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const { address, xUsername } = parsed.data;
  const normalizedAddress = address.toLowerCase();

  try {
    // Check cache first
    const cached = await db
      .select()
      .from(walletAnalysisTable)
      .where(eq(walletAnalysisTable.address, normalizedAddress))
      .limit(1);

    if (cached.length > 0 && cached[0]) {
      const row = cached[0];
      // Cache valid for 1 hour
      const age = Date.now() - new Date(row.analyzedAt).getTime();
      if (age < 3600000) {
        res.json(row.fullResult);
        return;
      }
    }

    // Run analysis
    const result = await analyzeWallet(normalizedAddress, xUsername ?? null);

    // Persist / upsert
    await db
      .insert(walletAnalysisTable)
      .values({
        address: normalizedAddress,
        xUsername: xUsername ?? null,
        activityScore: String(result.scores.activity),
        protocolScore: String(result.scores.protocol),
        capitalScore: String(result.scores.capital),
        liquidityScore: String(result.scores.liquidity),
        nftScore: String(result.scores.nft),
        basenameScore: String(result.scores.basename),
        crossChainScore: String(result.scores.crossChain),
        reputationScore: String(result.scores.reputation),
        builderScore: String(result.scores.builder),
        consistencyScore: String(result.scores.consistency),
        communityScore: String(result.scores.community),
        sybilPenalty: String(result.scores.sybilPenalty),
        totalScore: String(result.scores.total),
        allocationAmount: result.allocation.amount,
        tier: result.allocation.tier,
        eligible: result.allocation.eligible,
        confidenceScore: result.allocation.confidenceScore,
        percentile: result.allocation.percentile,
        fullResult: result,
      })
      .onConflictDoUpdate({
        target: walletAnalysisTable.address,
        set: {
          xUsername: xUsername ?? null,
          analyzedAt: new Date(),
          activityScore: String(result.scores.activity),
          protocolScore: String(result.scores.protocol),
          capitalScore: String(result.scores.capital),
          liquidityScore: String(result.scores.liquidity),
          nftScore: String(result.scores.nft),
          basenameScore: String(result.scores.basename),
          crossChainScore: String(result.scores.crossChain),
          reputationScore: String(result.scores.reputation),
          builderScore: String(result.scores.builder),
          consistencyScore: String(result.scores.consistency),
          communityScore: String(result.scores.community),
          sybilPenalty: String(result.scores.sybilPenalty),
          totalScore: String(result.scores.total),
          allocationAmount: result.allocation.amount,
          tier: result.allocation.tier,
          eligible: result.allocation.eligible,
          confidenceScore: result.allocation.confidenceScore,
          percentile: result.allocation.percentile,
          fullResult: result,
        },
      });

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Analysis failed");
    res.status(500).json({ error: "Analysis failed. Please try again." });
  }
});

/** GET /api/results/:address */
router.get("/results/:address", async (req, res) => {
  const address = req.params["address"]?.toLowerCase();

  if (!address || !/^0x[a-f0-9]{40}$/.test(address)) {
    res.status(400).json({ error: "Invalid address format" });
    return;
  }

  try {
    const rows = await db
      .select()
      .from(walletAnalysisTable)
      .where(eq(walletAnalysisTable.address, address))
      .limit(1);

    if (rows.length === 0) {
      res.status(404).json({ error: "No analysis found for this address" });
      return;
    }

    res.json(rows[0]!.fullResult);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch results");
    res.status(500).json({ error: "Failed to fetch results" });
  }
});

export default router;
