import { render, screen, fireEvent } from "@testing-library/react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

describe("DialogFooter", () => {
  it("renders close button when showCloseButton is true", () => {
    // Given / When
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test</DialogTitle>
            <DialogDescription>Desc</DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <button type="button">Action</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );

    // Then
    const dialog = screen.getByRole("dialog");
    const closeButtons = dialog.querySelectorAll("button");
    expect(closeButtons.length).toBeGreaterThanOrEqual(2);
  });
});
