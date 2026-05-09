import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DewatermarkEmptyState } from "@/components/dewatermark/dewatermark-empty-state";

describe("DewatermarkEmptyState", () => {
  it("forwards a chosen file to onFile via the hidden input", async () => {
    // Given
    const onFile = vi.fn();
    render(<DewatermarkEmptyState onFile={onFile} />);
    const input = screen.getByTestId(
      "dewatermark-file-input",
    ) as HTMLInputElement;
    const file = new File(["x"], "card.png", { type: "image/png" });

    // When
    await userEvent.upload(input, file);

    // Then
    expect(onFile).toHaveBeenCalledOnce();
    expect(onFile.mock.calls[0][0].name).toBe("card.png");
  });

  it("activates drag state on dragenter and clears it on dragleave", () => {
    // Given
    render(<DewatermarkEmptyState onFile={() => {}} />);
    const card = screen.getByTestId("dewatermark-empty-card");

    // When dragenter
    fireEvent.dragEnter(card);
    // Then
    expect(card.getAttribute("data-drag")).toBe("true");

    // When dragleave
    fireEvent.dragLeave(card);
    // Then
    expect(card.getAttribute("data-drag")).toBeNull();
  });

  it("forwards a dropped file to onFile and clears drag state", () => {
    // Given
    const onFile = vi.fn();
    render(<DewatermarkEmptyState onFile={onFile} />);
    const card = screen.getByTestId("dewatermark-empty-card");
    const file = new File(["x"], "drop.png", { type: "image/png" });

    // When
    fireEvent.dragEnter(card);
    fireEvent.dragOver(card);
    fireEvent.drop(card, {
      dataTransfer: { files: [file] },
    });

    // Then
    expect(onFile).toHaveBeenCalledOnce();
    expect(onFile.mock.calls[0][0].name).toBe("drop.png");
    expect(card.getAttribute("data-drag")).toBeNull();
  });

  it("ignores a drop with no files", () => {
    // Given
    const onFile = vi.fn();
    render(<DewatermarkEmptyState onFile={onFile} />);
    const card = screen.getByTestId("dewatermark-empty-card");

    // When
    fireEvent.drop(card, { dataTransfer: { files: [] } });

    // Then
    expect(onFile).not.toHaveBeenCalled();
  });

  it("opens the file picker when Enter is pressed on the focused card", async () => {
    // Given
    const user = userEvent.setup();
    render(<DewatermarkEmptyState onFile={() => {}} />);
    const card = screen.getByTestId("dewatermark-empty-card");
    const input = screen.getByTestId(
      "dewatermark-file-input",
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");

    // When
    card.focus();
    await user.keyboard("{Enter}");

    // Then
    expect(clickSpy).toHaveBeenCalled();
  });

  it("opens the file picker when Space is pressed on the focused card", async () => {
    // Given
    const user = userEvent.setup();
    render(<DewatermarkEmptyState onFile={() => {}} />);
    const card = screen.getByTestId("dewatermark-empty-card");
    const input = screen.getByTestId(
      "dewatermark-file-input",
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");

    // When
    card.focus();
    await user.keyboard(" ");

    // Then
    expect(clickSpy).toHaveBeenCalled();
  });

  it("ignores other keys without calling click", async () => {
    // Given
    const user = userEvent.setup();
    render(<DewatermarkEmptyState onFile={() => {}} />);
    const card = screen.getByTestId("dewatermark-empty-card");
    const input = screen.getByTestId(
      "dewatermark-file-input",
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");

    // When
    card.focus();
    await user.keyboard("a");

    // Then
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it("does not call onFile when the input change fires with no file selected", () => {
    // Given
    const onFile = vi.fn();
    render(<DewatermarkEmptyState onFile={onFile} />);
    const input = screen.getByTestId(
      "dewatermark-file-input",
    ) as HTMLInputElement;

    // When — simulate a change with no selected file (cancelled picker)
    fireEvent.change(input, { target: { files: [] } });

    // Then
    expect(onFile).not.toHaveBeenCalled();
  });

  it("opens the picker when the upload button is clicked without bubbling to the card", async () => {
    // Given
    const user = userEvent.setup();
    const onFile = vi.fn();
    render(<DewatermarkEmptyState onFile={onFile} />);
    const button = screen.getByRole("button", { name: /Upload image/i });
    const input = screen.getByTestId(
      "dewatermark-file-input",
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");

    // When
    await user.click(button);

    // Then
    expect(clickSpy).toHaveBeenCalled();
  });
});
