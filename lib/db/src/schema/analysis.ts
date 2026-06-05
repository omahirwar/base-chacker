import { pgTable, text, integer, timestamp, boolean, jsonb, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const walletAnalysisTable = pgTable("wallet_analysis", {
  address: text("address").primaryKey(),
  xUsername: text("x_username"),
  analyzedAt: timestamp("analyzed_at").defaultNow().notNull(),

  // Scores
  activityScore: numeric("activity_score").notNull(),
  protocolScore: numeric("protocol_score").notNull(),
  capitalScore: numeric("capital_score").notNull(),
  liquidityScore: numeric("liquidity_score").notNull(),
  nftScore: numeric("nft_score").notNull(),
  basenameScore: numeric("basename_score").notNull(),
  crossChainScore: numeric("cross_chain_score").notNull(),
  reputationScore: numeric("reputation_score").notNull(),
  builderScore: numeric("builder_score").notNull(),
  consistencyScore: numeric("consistency_score").notNull(),
  communityScore: numeric("community_score").notNull(),
  sybilPenalty: numeric("sybil_penalty").notNull(),
  totalScore: numeric("total_score").notNull(),

  // Allocation
  allocationAmount: integer("allocation_amount").notNull(),
  tier: text("tier").notNull(),
  eligible: boolean("eligible").notNull(),
  confidenceScore: integer("confidence_score").notNull(),
  percentile: text("percentile").notNull(),

  // Full result stored as JSON
  fullResult: jsonb("full_result").notNull(),
});

export const insertWalletAnalysisSchema = createInsertSchema(walletAnalysisTable).omit({
  analyzedAt: true,
});

export type InsertWalletAnalysis = z.infer<typeof insertWalletAnalysisSchema>;
export type WalletAnalysis = typeof walletAnalysisTable.$inferSelect;
