export const HISTORY_LIMIT = 30;
export const CHECKER_SIZE = 24;
export const EXPORT_MIME = "image/png" as const;

export type WatermarkTier = "0.5k" | "1k" | "2k" | "4k";

export type WatermarkPresetConfig = {
  key: string;
  label: string;
  logoSize?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginTop?: number;
};

export type WatermarkSizeConfig = {
  logoSize: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  marginTop: number;
};

export type GeminiOfficialSize = {
  width: number;
  height: number;
  tier: WatermarkTier;
};

export const GEMINI_PRESETS: Record<string, WatermarkPresetConfig> = {
  auto: { key: "auto", label: "Auto" },
  "48": {
    key: "48",
    label: "48 preset",
    logoSize: 48,
    marginRight: 32,
    marginBottom: 32,
    marginLeft: 32,
    marginTop: 32,
  },
  "96": {
    key: "96",
    label: "96 preset",
    logoSize: 96,
    marginRight: 64,
    marginBottom: 64,
    marginLeft: 64,
    marginTop: 64,
  },
};

export const GEMINI_OFFICIAL_SIZES: GeminiOfficialSize[] = [
  { width: 512, height: 512, tier: "0.5k" },
  { width: 256, height: 1024, tier: "0.5k" },
  { width: 192, height: 1536, tier: "0.5k" },
  { width: 424, height: 632, tier: "0.5k" },
  { width: 632, height: 424, tier: "0.5k" },
  { width: 448, height: 600, tier: "0.5k" },
  { width: 1024, height: 256, tier: "0.5k" },
  { width: 600, height: 448, tier: "0.5k" },
  { width: 464, height: 576, tier: "0.5k" },
  { width: 576, height: 464, tier: "0.5k" },
  { width: 1536, height: 192, tier: "0.5k" },
  { width: 384, height: 688, tier: "0.5k" },
  { width: 688, height: 384, tier: "0.5k" },
  { width: 792, height: 168, tier: "0.5k" },
  { width: 1024, height: 1024, tier: "1k" },
  { width: 848, height: 1264, tier: "1k" },
  { width: 1264, height: 848, tier: "1k" },
  { width: 896, height: 1200, tier: "1k" },
  { width: 1200, height: 896, tier: "1k" },
  { width: 928, height: 1152, tier: "1k" },
  { width: 1152, height: 928, tier: "1k" },
  { width: 768, height: 1376, tier: "1k" },
  { width: 1376, height: 768, tier: "1k" },
  { width: 1584, height: 672, tier: "1k" },
  { width: 2048, height: 2048, tier: "2k" },
  { width: 512, height: 2048, tier: "2k" },
  { width: 384, height: 3072, tier: "2k" },
  { width: 1696, height: 2528, tier: "2k" },
  { width: 2528, height: 1696, tier: "2k" },
  { width: 1792, height: 2400, tier: "2k" },
  { width: 2400, height: 1792, tier: "2k" },
  { width: 1856, height: 2304, tier: "2k" },
  { width: 2304, height: 1856, tier: "2k" },
  { width: 1536, height: 2752, tier: "2k" },
  { width: 2752, height: 1536, tier: "2k" },
  { width: 3168, height: 1344, tier: "2k" },
  { width: 4096, height: 4096, tier: "4k" },
  { width: 2048, height: 8192, tier: "4k" },
  { width: 1536, height: 12288, tier: "4k" },
  { width: 3392, height: 5056, tier: "4k" },
  { width: 5056, height: 3392, tier: "4k" },
  { width: 3584, height: 4800, tier: "4k" },
  { width: 4800, height: 3584, tier: "4k" },
  { width: 3712, height: 4608, tier: "4k" },
  { width: 4608, height: 3712, tier: "4k" },
  { width: 3072, height: 5504, tier: "4k" },
  { width: 5504, height: 3072, tier: "4k" },
  { width: 6336, height: 2688, tier: "4k" },
  { width: 832, height: 1248, tier: "1k" },
  { width: 1248, height: 832, tier: "1k" },
  { width: 864, height: 1184, tier: "1k" },
  { width: 1184, height: 864, tier: "1k" },
  { width: 896, height: 1152, tier: "1k" },
  { width: 1152, height: 896, tier: "1k" },
  { width: 768, height: 1344, tier: "1k" },
  { width: 1344, height: 768, tier: "1k" },
  { width: 1536, height: 672, tier: "1k" },
];

export const GEMINI_CONFIG_BY_TIER: Record<WatermarkTier, WatermarkSizeConfig> =
  {
    "0.5k": {
      logoSize: 48,
      marginRight: 32,
      marginBottom: 32,
      marginLeft: 32,
      marginTop: 32,
    },
    "1k": {
      logoSize: 96,
      marginRight: 64,
      marginBottom: 64,
      marginLeft: 64,
      marginTop: 64,
    },
    "2k": {
      logoSize: 96,
      marginRight: 64,
      marginBottom: 64,
      marginLeft: 64,
      marginTop: 64,
    },
    "4k": {
      logoSize: 96,
      marginRight: 64,
      marginBottom: 64,
      marginLeft: 64,
      marginTop: 64,
    },
  };

export type GeminiDetectionConfig = {
  maxRelativeAspectRatioDelta: number;
  maxScaleMismatchRatio: number;
  officialSeedLimit: number;
  minLogoSize: number;
  maxLogoSize: number;
  searchMarginRadiusFactor: number;
  searchOffsets: number[];
  templateShiftOffsets: number[];
  templateScaleOffsets: number[];
  alphaGainCandidates: number[];
  minAcceptedImprovement: number;
  targetResidual: number;
  maxGradientIncrease: number;
  maxNearBlackRatioIncrease: number;
  adaptiveConfidenceThreshold: number;
};

// ─── Removal / mask constants ─────────────────────────────────────────────────

export const GEMINI_CORRECTION_THRESHOLD = 0.015;
export const GEMINI_CORRECTION_GAMMA = 1;
export const GEMINI_VISIBILITY_EXPAND = 0;
export const GEMINI_VISIBILITY_CORE_EXPAND = 0;
export const GEMINI_VISIBILITY_FEATHER_BOOST = 1;

// ─── Alpha blending constants ─────────────────────────────────────────────────

export const GEMINI_ALPHA_NOISE_FLOOR = 3 / 255;
export const GEMINI_ALPHA_THRESHOLD = 0.002;
export const GEMINI_MAX_ALPHA = 0.99;
export const GEMINI_LOGO_VALUE = 255;

export const GEMINI_DETECTION: GeminiDetectionConfig = {
  maxRelativeAspectRatioDelta: 0.02,
  maxScaleMismatchRatio: 0.12,
  officialSeedLimit: 3,
  minLogoSize: 24,
  maxLogoSize: 192,
  searchMarginRadiusFactor: 0.8,
  searchOffsets: [-24, -16, -12, -8, -4, 0, 4, 8, 12, 16, 24],
  templateShiftOffsets: [-0.5, 0, 0.5],
  templateScaleOffsets: [0.99, 1, 1.01],
  alphaGainCandidates: [0.95, 1, 1.05, 1.1, 1.2, 1.35, 1.5],
  minAcceptedImprovement: 0.08,
  targetResidual: 0.22,
  maxGradientIncrease: 0.04,
  maxNearBlackRatioIncrease: 0.05,
  adaptiveConfidenceThreshold: 0.35,
};
