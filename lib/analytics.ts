declare global {
  interface Window {
    umami?: {
      track(event: string, data?: Record<string, unknown>): void;
    };
  }
}

export type AnalyticsEvent =
  | "prep_image_uploaded"
  | "prep_algorithm_set"
  | "prep_canvas_size_set"
  | "prep_canvas_sizing_mode_set"
  | "prep_canvas_size_step_set"
  | "prep_native_canvas_dimension_set"
  | "prep_dpi_override_set"
  | "prep_overlay_toggled"
  | "prep_alignment_used"
  | "prep_vertical_preset_used"
  | "prep_image_positioned"
  | "prep_image_downloaded"
  | "outpaint_handshake_sent"
  | "merger_og_uploaded"
  | "merger_guide_uploaded"
  | "merger_outpaint_uploaded"
  | "merger_blending_adjusted"
  | "merger_reseeded"
  | "merger_final_downloaded"
  | "dewatermark_started"
  | "dewatermark_succeeded"
  | "dewatermark_failed"
  | "dewatermark_adaptive_started"
  | "dewatermark_adaptive_succeeded"
  | "dewatermark_adaptive_failed";

type EventData = Record<string, string | number | boolean | null | undefined>;

export function track(event: AnalyticsEvent, data?: EventData): void {
  window.umami?.track(event, data);
}
