import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/hooks/use-design-workflow", () => ({
  useDesignWorkflow: vi.fn(),
  DESIGN_CANVAS_PRESETS: {
    default: { label: "Default", width: 3520, height: 4800 },
    "classic-borderless": { label: "Classic borderless", width: 3712, height: 4608 },
  },
}));

vi.mock("@/components/design/canvas-size-selector", () => ({
  CanvasSizeSelector: (props: { onSelect: (s: string) => void }) => (
    <div data-testid="canvas-size-selector">
      <button onClick={() => props.onSelect("default")}>default</button>
    </div>
  ),
}));

vi.mock("@/components/design/size-selector", () => ({
  SizeSelector: (props: { onSelect: (s: string) => void }) => (
    <div data-testid="size-selector">
      <button onClick={() => props.onSelect("tall")}>tall</button>
    </div>
  ),
}));

vi.mock("@/components/design/image-uploader", () => ({
  ImageUploader: () => <div data-testid="image-uploader" />,
}));

vi.mock("@/components/design/auto-process-card", () => ({
  AutoProcessCard: (props: { isProcessing: boolean }) => (
    <div data-testid="auto-process-card" data-processing={String(props.isProcessing)} />
  ),
}));

vi.mock("@/components/design/outpaint-handoff", () => ({
  OutpaintHandoff: () => <div data-testid="outpaint-handoff" />,
}));

vi.mock("@/components/design/auto-merge-card", () => ({
  AutoMergeCard: () => <div data-testid="auto-merge-card" />,
}));

vi.mock("@/components/design/final-result-card", () => ({
  FinalResultCard: () => <div data-testid="final-result-card" />,
}));

import {
  useDesignWorkflow,
  type DesignState,
} from "@/hooks/use-design-workflow";
import DesignPage from "./page";

const mockUseDesignWorkflow = vi.mocked(useDesignWorkflow);

function makeHookReturn(overrides: Partial<DesignState> = {}) {
  return {
    state: {
      stage: 1 as const,
      canvasSize: null,
      textBoxSize: null,
      originalImage: null,
      originalFileName: null,
      grayBorderDataUrl: null,
      isProcessing: false,
      outpaintPhase: "idle" as const,
      outpaintImage: null,
      outpaintError: null,
      mergePhase: "idle" as const,
      mergedCanvasDataUrl: null,
      mergeAnalysis: null,
      isDownloaded: false,
      ...overrides,
    } satisfies DesignState,
    selectCanvasSize: vi.fn(),
    selectTextBoxSize: vi.fn(),
    uploadOriginal: vi.fn(),
    uploadOutpaint: vi.fn(),
    downloadResult: vi.fn(),
    exportPsd: vi.fn(),
    reset: vi.fn(),
    handshakePrompt: "handshake",
    outpaintCommand: "command",
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("DesignPage", () => {
  it("renders canvas size selector at stage 1", () => {
    // Given
    mockUseDesignWorkflow.mockReturnValue(makeHookReturn());

    // When
    render(<DesignPage />);

    // Then
    expect(screen.getByTestId("canvas-size-selector")).toBeDefined();
    expect(screen.queryByTestId("size-selector")).toBeNull();
    expect(screen.queryByTestId("image-uploader")).toBeNull();
  });

  it("renders size selector at stage 2", () => {
    // Given
    mockUseDesignWorkflow.mockReturnValue(
      makeHookReturn({ stage: 2 as const, canvasSize: "default" }),
    );

    // When
    render(<DesignPage />);

    // Then
    expect(screen.getByTestId("canvas-size-selector")).toBeDefined();
    expect(screen.getByTestId("size-selector")).toBeDefined();
    expect(screen.queryByTestId("image-uploader")).toBeNull();
  });

  it("renders image uploader at stage 3", () => {
    // Given
    mockUseDesignWorkflow.mockReturnValue(
      makeHookReturn({ stage: 3 as const, canvasSize: "default", textBoxSize: "tall" }),
    );

    // When
    render(<DesignPage />);

    // Then
    expect(screen.getByTestId("size-selector")).toBeDefined();
    expect(screen.getByTestId("image-uploader")).toBeDefined();
  });

  it("renders auto-process card at stage 4", () => {
    // Given
    mockUseDesignWorkflow.mockReturnValue(
      makeHookReturn({
        stage: 4 as const,
        canvasSize: "default",
        textBoxSize: "tall",
        originalFileName: "card.png",
        isProcessing: true,
      }),
    );

    // When
    render(<DesignPage />);

    // Then
    expect(screen.getByTestId("auto-process-card")).toBeDefined();
    expect(screen.queryByTestId("image-uploader")).toBeNull();
  });

  it("renders outpaint handoff at stage 5", () => {
    // Given
    mockUseDesignWorkflow.mockReturnValue(
      makeHookReturn({
        stage: 5 as const,
        canvasSize: "default",
        textBoxSize: "tall",
        originalFileName: "card.png",
        grayBorderDataUrl: "data:image/png;base64,abc",
      }),
    );

    // When
    render(<DesignPage />);

    // Then
    expect(screen.getByTestId("outpaint-handoff")).toBeDefined();
    expect(screen.getByTestId("auto-process-card")).toBeDefined();
  });

  it("renders auto-merge card at stage 6", () => {
    // Given
    mockUseDesignWorkflow.mockReturnValue(
      makeHookReturn({
        stage: 6 as const,
        canvasSize: "default",
        textBoxSize: "tall",
        originalFileName: "card.png",
        mergePhase: "processing",
      }),
    );

    // When
    render(<DesignPage />);

    // Then
    expect(screen.getByTestId("auto-merge-card")).toBeDefined();
    expect(screen.queryByTestId("outpaint-handoff")).toBeNull();
  });

  it("renders final result at stage 7", () => {
    // Given
    mockUseDesignWorkflow.mockReturnValue(
      makeHookReturn({
        stage: 7 as const,
        canvasSize: "default",
        textBoxSize: "tall",
        originalFileName: "card.png",
        mergedCanvasDataUrl: "data:image/png;base64,merged",
      }),
    );

    // When
    render(<DesignPage />);

    // Then
    expect(screen.getByTestId("final-result-card")).toBeDefined();
    expect(screen.queryByTestId("auto-merge-card")).toBeNull();
  });

  it("renders step navigation with 6 steps", () => {
    // Given
    mockUseDesignWorkflow.mockReturnValue(makeHookReturn());

    // When
    render(<DesignPage />);

    // Then
    expect(screen.getByRole("navigation", { name: "Design steps" })).toBeDefined();
  });

  it("shows uploaded file name summary when past stage 3", () => {
    // Given
    mockUseDesignWorkflow.mockReturnValue(
      makeHookReturn({
        stage: 5 as const,
        canvasSize: "default",
        textBoxSize: "tall",
        originalFileName: "card.png",
        grayBorderDataUrl: "data:image/png;base64,abc",
      }),
    );

    // When
    render(<DesignPage />);

    // Then
    const summary = document.querySelector('[data-stage="3-summary"]');
    expect(summary).toBeDefined();
  });
});
