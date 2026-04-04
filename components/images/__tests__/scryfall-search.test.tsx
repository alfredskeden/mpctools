import { render, screen, fireEvent } from "@testing-library/react";
import { ScryfallSearch } from "../scryfall-search";

const defaultProps = {
  query: "",
  suggestions: [],
  isLoading: false,
  error: null,
  onQueryChange: vi.fn(),
  onSelect: vi.fn(),
};

describe("ScryfallSearch", () => {
  it("renders the search input", () => {
    // Given / When
    render(<ScryfallSearch {...defaultProps} />);

    // Then
    expect(
      screen.getByRole("textbox", { name: "Search for a card" }),
    ).toBeDefined();
  });

  it("displays the current query value in the input", () => {
    // Given / When
    render(<ScryfallSearch {...defaultProps} query="Lightning" />);

    // Then
    const input = screen.getByTestId("scryfall-input") as HTMLInputElement;
    expect(input.value).toBe("Lightning");
  });

  it("calls onQueryChange when input value changes", () => {
    // Given
    const onQueryChange = vi.fn();
    render(<ScryfallSearch {...defaultProps} onQueryChange={onQueryChange} />);

    // When
    fireEvent.change(screen.getByTestId("scryfall-input"), {
      target: { value: "Bolt" },
    });

    // Then
    expect(onQueryChange).toHaveBeenCalledWith("Bolt");
  });

  it("shows loading indicator when isLoading is true", () => {
    // Given / When
    render(<ScryfallSearch {...defaultProps} isLoading={true} />);

    // Then
    expect(screen.getByTestId("scryfall-loading")).toBeDefined();
  });

  it("hides loading indicator when isLoading is false", () => {
    // Given / When
    render(<ScryfallSearch {...defaultProps} isLoading={false} />);

    // Then
    expect(screen.queryByTestId("scryfall-loading")).toBeNull();
  });

  it("shows error message when error is provided", () => {
    // Given / When
    render(<ScryfallSearch {...defaultProps} error="Failed to load card" />);

    // Then
    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByTestId("scryfall-error")).toBeDefined();
  });

  it("hides error message when error is null", () => {
    // Given / When
    render(<ScryfallSearch {...defaultProps} error={null} />);

    // Then
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("renders suggestion list when suggestions are provided", () => {
    // Given / When
    render(
      <ScryfallSearch
        {...defaultProps}
        suggestions={["Lightning Bolt", "Lightning Strike"]}
      />,
    );

    // Then
    expect(screen.getByRole("listbox", { name: "Card suggestions" })).toBeDefined();
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("hides suggestion list when suggestions are empty", () => {
    // Given / When
    render(<ScryfallSearch {...defaultProps} suggestions={[]} />);

    // Then
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("calls onSelect when a suggestion is clicked", () => {
    // Given
    const onSelect = vi.fn();
    render(
      <ScryfallSearch
        {...defaultProps}
        suggestions={["Lightning Bolt", "Lightning Strike"]}
        onSelect={onSelect}
      />,
    );

    // When
    fireEvent.click(screen.getAllByRole("option")[0]);

    // Then
    expect(onSelect).toHaveBeenCalledWith("Lightning Bolt");
  });

  it("calls onSelect with first suggestion when Enter is pressed", () => {
    // Given
    const onSelect = vi.fn();
    render(
      <ScryfallSearch
        {...defaultProps}
        suggestions={["Lightning Bolt", "Lightning Strike"]}
        onSelect={onSelect}
      />,
    );

    // When
    fireEvent.keyDown(screen.getByTestId("scryfall-input"), { key: "Enter" });

    // Then
    expect(onSelect).toHaveBeenCalledWith("Lightning Bolt");
  });

  it("does not call onSelect on Enter when suggestions are empty", () => {
    // Given
    const onSelect = vi.fn();
    render(<ScryfallSearch {...defaultProps} suggestions={[]} onSelect={onSelect} />);

    // When
    fireEvent.keyDown(screen.getByTestId("scryfall-input"), { key: "Enter" });

    // Then
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("calls onQueryChange with empty string when Escape is pressed", () => {
    // Given
    const onQueryChange = vi.fn();
    render(
      <ScryfallSearch
        {...defaultProps}
        query="Lightning"
        onQueryChange={onQueryChange}
      />,
    );

    // When
    fireEvent.keyDown(screen.getByTestId("scryfall-input"), { key: "Escape" });

    // Then
    expect(onQueryChange).toHaveBeenCalledWith("");
  });

  it("sets aria-controls on input when suggestions are present", () => {
    // Given / When
    render(
      <ScryfallSearch
        {...defaultProps}
        suggestions={["Lightning Bolt"]}
      />,
    );

    // Then
    const input = screen.getByTestId("scryfall-input");
    expect(input.getAttribute("aria-controls")).toBe("scryfall-suggestions");
  });

  it("omits aria-controls on input when suggestions are empty", () => {
    // Given / When
    render(<ScryfallSearch {...defaultProps} suggestions={[]} />);

    // Then
    const input = screen.getByTestId("scryfall-input");
    expect(input.getAttribute("aria-controls")).toBeNull();
  });
});
