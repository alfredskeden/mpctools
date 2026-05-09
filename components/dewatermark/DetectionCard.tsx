"use client";

type DetectionCardProps = {
  corner: string;
  source: string;
  alphaGain: number;
  confidence: number;
};

function formatCorner(corner: string): string {
  if (!corner) return "—";
  const map: Record<string, string> = {
    "top-left": "TL",
    "top-right": "TR",
    "bottom-left": "BL",
    "bottom-right": "BR",
  };
  return map[corner] ?? corner.toUpperCase();
}

export function DetectionCard({
  corner,
  source,
  alphaGain,
  confidence,
}: DetectionCardProps) {
  const located = corner !== "" || source === "preset";
  const confidencePct = Math.round(confidence * 100);

  return (
    <div
      data-testid="detection-card"
      className="flex flex-col gap-2.5 rounded-lg border border-surface-border bg-surface-raised p-3"
    >
      <div className="flex items-center gap-2 border-b border-surface-border pb-2.5">
        <span
          aria-hidden="true"
          className="size-2 rounded-full bg-status-success shadow-[0_0_8px_rgba(34,197,94,0.6)]"
        />
        <span className="text-caption font-medium text-text-primary">
          {located ? "Watermark located" : "No watermark detected"}
        </span>
        <span
          data-testid="detection-confidence"
          className="ml-auto rounded-xs bg-status-success/10 px-1.5 py-px font-mono text-micro text-status-success"
        >
          {confidencePct}%
        </span>
      </div>
      <DetectionRow label="corner" value={formatCorner(corner)} />
      <DetectionRow label="source" value={source} />
      <DetectionRow
        label="alpha gain"
        value={`${alphaGain.toFixed(2)}×`}
      />
    </div>
  );
}

function DetectionRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between font-mono text-caption"
      data-testid={`detection-row-${label}`}
    >
      <span className="tracking-label text-text-tertiary">{label}</span>
      <span className="text-text-primary">{value}</span>
    </div>
  );
}
