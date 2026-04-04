import { render, screen, fireEvent } from "@testing-library/react";
import BorderlessSvgPage from "./page";
import * as useScryfallSearchModule from "@/hooks/use-scryfall-search";
import * as useSvgToPngModule from "@/hooks/use-svg-to-png";
import type { ScryfallCard } from "@/lib/scryfall-types";

vi.mock("@/hooks/use-scryfall-search");
vi.mock("@/hooks/use-svg-to-png");
vi.mock("@/components/images/scryfall-search", () => ({
  ScryfallSearch: ({
    query,
    onQueryChange,
    onSelect,
    isLoading,
    error,
    suggestions,
  }: {
    query: string;
    onQueryChange: (q: string) => void;
    onSelect: (name: string) => void;
    isLoading: boolean;
    error: string | null;
    suggestions: string[];
  }) => (
    <div data-testid="scryfall-search-mock">
      <input
        data-testid="mock-input"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />
      {isLoading && <span data-testid="mock-loading" />}
      {error && <span data-testid="mock-error">{error}</span>}
      {suggestions.map((s) => (
        <button key={s} onClick={() => onSelect(s)}>
          {s}
        </button>
      ))}
    </div>
  ),
}));
vi.mock("@/components/images/BorderlessAltWithEffect", () => ({
  BorderlessAltWithEffect: ({
    imageUrl,
    cardName,
    typeLine,
    oracleText,
  }: {
    imageUrl?: string;
    cardName?: string;
    typeLine?: string;
    oracleText?: string;
  }) => (
    <div
      data-testid="borderless-mock"
      data-image-url={imageUrl}
      data-card-name={cardName}
      data-type-line={typeLine}
      data-oracle-text={oracleText}
    />
  ),
}));

const defaultHookReturn = {
  query: "",
  suggestions: [],
  selectedCard: null,
  isLoading: false,
  error: null,
  setQuery: vi.fn(),
  selectCard: vi.fn(),
  clearCard: vi.fn(),
};

const mockDownloadAsPng = vi.fn();

describe("BorderlessSvgPage", () => {
  beforeEach(() => {
    vi.spyOn(useSvgToPngModule, "useSvgToPng").mockReturnValue({
      downloadAsPng: mockDownloadAsPng,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the search component", () => {
    // Given
    vi.spyOn(useScryfallSearchModule, "useScryfallSearch").mockReturnValue(
      defaultHookReturn,
    );

    // When
    render(<BorderlessSvgPage />);

    // Then
    expect(screen.getByTestId("scryfall-search-mock")).toBeDefined();
  });

  it("renders the SVG card template", () => {
    // Given
    vi.spyOn(useScryfallSearchModule, "useScryfallSearch").mockReturnValue(
      defaultHookReturn,
    );

    // When
    render(<BorderlessSvgPage />);

    // Then
    expect(screen.getByTestId("borderless-mock")).toBeDefined();
  });

  it("passes no card data to SVG when no card is selected", () => {
    // Given
    vi.spyOn(useScryfallSearchModule, "useScryfallSearch").mockReturnValue(
      defaultHookReturn,
    );

    // When
    render(<BorderlessSvgPage />);

    // Then
    const svgMock = screen.getByTestId("borderless-mock");
    expect(svgMock.getAttribute("data-image-url")).toBeNull();
    expect(svgMock.getAttribute("data-card-name")).toBeNull();
    expect(svgMock.getAttribute("data-type-line")).toBeNull();
    expect(svgMock.getAttribute("data-oracle-text")).toBeNull();
  });

  it("does not show download button when no card is selected", () => {
    // Given
    vi.spyOn(useScryfallSearchModule, "useScryfallSearch").mockReturnValue(
      defaultHookReturn,
    );

    // When
    render(<BorderlessSvgPage />);

    // Then
    expect(screen.queryByTestId("download-png-button")).toBeNull();
  });

  it("passes card data to SVG when a card is selected", () => {
    // Given
    const selectedCard: ScryfallCard = {
      id: "abc123",
      name: "Lightning Bolt",
      type_line: "Instant",
      oracle_text: "Lightning Bolt deals 3 damage to any target.",
      color_identity: ["R"],
      image_uris: {
        small: "https://example.com/small.jpg",
        normal: "https://example.com/normal.jpg",
        large: "https://example.com/large.jpg",
        png: "https://example.com/png.png",
        art_crop: "https://example.com/art_crop.jpg",
        border_crop: "https://example.com/border_crop.jpg",
      },
      set_name: "Alpha",
      artist: "Christopher Rush",
    };

    vi.spyOn(useScryfallSearchModule, "useScryfallSearch").mockReturnValue({
      ...defaultHookReturn,
      selectedCard,
    });

    // When
    render(<BorderlessSvgPage />);

    // Then
    const svgMock = screen.getByTestId("borderless-mock");
    expect(svgMock.getAttribute("data-image-url")).toBe(
      "https://example.com/art_crop.jpg",
    );
    expect(svgMock.getAttribute("data-card-name")).toBe("Lightning Bolt");
    expect(svgMock.getAttribute("data-type-line")).toBe("Instant");
    expect(svgMock.getAttribute("data-oracle-text")).toBe(
      "Lightning Bolt deals 3 damage to any target.",
    );
  });

  it("shows download button when a card is selected", () => {
    // Given
    const selectedCard: ScryfallCard = {
      id: "abc123",
      name: "Lightning Bolt",
      type_line: "Instant",
      color_identity: ["R"],
      set_name: "Alpha",
      artist: "Christopher Rush",
    };
    vi.spyOn(useScryfallSearchModule, "useScryfallSearch").mockReturnValue({
      ...defaultHookReturn,
      selectedCard,
    });

    // When
    render(<BorderlessSvgPage />);

    // Then
    expect(screen.getByTestId("download-png-button")).toBeDefined();
  });

  it("triggers PNG download when download button is clicked", () => {
    // Given
    const selectedCard: ScryfallCard = {
      id: "abc123",
      name: "Lightning Bolt",
      type_line: "Instant",
      color_identity: ["R"],
      set_name: "Alpha",
      artist: "Christopher Rush",
    };
    vi.spyOn(useScryfallSearchModule, "useScryfallSearch").mockReturnValue({
      ...defaultHookReturn,
      selectedCard,
    });
    render(<BorderlessSvgPage />);

    // When
    fireEvent.click(screen.getByTestId("download-png-button"));

    // Then
    expect(mockDownloadAsPng).toHaveBeenCalledWith(
      "Borderless_Alt",
      "Lightning Bolt.png",
    );
  });

  it("passes undefined image when selected card has no image_uris", () => {
    // Given
    const selectedCard: ScryfallCard = {
      id: "abc123",
      name: "Double Faced Card",
      type_line: "Creature",
      color_identity: [],
      set_name: "Test Set",
      artist: "Test Artist",
      card_faces: [
        {
          name: "Front Face",
          image_uris: {
            small: "",
            normal: "",
            large: "",
            png: "",
            art_crop: "https://example.com/front.jpg",
            border_crop: "",
          },
        },
        { name: "Back Face" },
      ],
    };

    vi.spyOn(useScryfallSearchModule, "useScryfallSearch").mockReturnValue({
      ...defaultHookReturn,
      selectedCard,
    });

    // When
    render(<BorderlessSvgPage />);

    // Then
    const svgMock = screen.getByTestId("borderless-mock");
    expect(svgMock.getAttribute("data-image-url")).toBeNull();
  });

  it("uses multi-color pinline for cards with 3 or more colors", () => {
    // Given
    const selectedCard: ScryfallCard = {
      id: "abc123",
      name: "Jodah, Archmage Eternal",
      type_line: "Legendary Creature",
      color_identity: ["W", "U", "B", "R", "G"],
      set_name: "Dominaria",
      artist: "Test Artist",
    };
    vi.spyOn(useScryfallSearchModule, "useScryfallSearch").mockReturnValue({
      ...defaultHookReturn,
      selectedCard,
    });

    // When
    render(<BorderlessSvgPage />);

    // Then — component renders without error
    expect(screen.getByTestId("borderless-mock")).toBeDefined();
  });
});
