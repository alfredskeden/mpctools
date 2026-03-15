import { render, screen } from "@testing-library/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "../Card";

describe(Card.name, () => {
  it("renders with default size", () => {
    render(<Card data-testid="card">Content</Card>);

    const card = screen.getByTestId("card");
    expect(card.getAttribute("data-slot")).toBe("card");
    expect(card.getAttribute("data-size")).toBe("default");
  });

  it("renders with sm size", () => {
    render(
      <Card data-testid="card" size="sm">
        Content
      </Card>,
    );

    expect(screen.getByTestId("card").getAttribute("data-size")).toBe("sm");
  });

  it("merges custom className", () => {
    render(
      <Card data-testid="card" className="custom-class">
        Content
      </Card>,
    );

    expect(screen.getByTestId("card").className).toContain("custom-class");
  });
});

describe("CardHeader", () => {
  it("renders with card-header slot", () => {
    render(<CardHeader data-testid="header">Header</CardHeader>);

    expect(screen.getByTestId("header").getAttribute("data-slot")).toBe(
      "card-header",
    );
  });

  it("merges custom className", () => {
    render(
      <CardHeader data-testid="header" className="custom">
        Header
      </CardHeader>,
    );

    expect(screen.getByTestId("header").className).toContain("custom");
  });
});

describe("CardTitle", () => {
  it("renders with card-title slot", () => {
    render(<CardTitle data-testid="title">Title</CardTitle>);

    expect(screen.getByTestId("title").getAttribute("data-slot")).toBe(
      "card-title",
    );
  });

  it("merges custom className", () => {
    render(
      <CardTitle data-testid="title" className="custom">
        Title
      </CardTitle>,
    );

    expect(screen.getByTestId("title").className).toContain("custom");
  });
});

describe("CardDescription", () => {
  it("renders with card-description slot", () => {
    render(<CardDescription data-testid="desc">Description</CardDescription>);

    expect(screen.getByTestId("desc").getAttribute("data-slot")).toBe(
      "card-description",
    );
  });

  it("merges custom className", () => {
    render(
      <CardDescription data-testid="desc" className="custom">
        Desc
      </CardDescription>,
    );

    expect(screen.getByTestId("desc").className).toContain("custom");
  });
});

describe("CardAction", () => {
  it("renders with card-action slot", () => {
    render(<CardAction data-testid="action">Action</CardAction>);

    expect(screen.getByTestId("action").getAttribute("data-slot")).toBe(
      "card-action",
    );
  });

  it("merges custom className", () => {
    render(
      <CardAction data-testid="action" className="custom">
        Action
      </CardAction>,
    );

    expect(screen.getByTestId("action").className).toContain("custom");
  });
});

describe("CardContent", () => {
  it("renders with card-content slot", () => {
    render(<CardContent data-testid="content">Content</CardContent>);

    expect(screen.getByTestId("content").getAttribute("data-slot")).toBe(
      "card-content",
    );
  });

  it("merges custom className", () => {
    render(
      <CardContent data-testid="content" className="custom">
        Content
      </CardContent>,
    );

    expect(screen.getByTestId("content").className).toContain("custom");
  });
});

describe("CardFooter", () => {
  it("renders with card-footer slot", () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>);

    expect(screen.getByTestId("footer").getAttribute("data-slot")).toBe(
      "card-footer",
    );
  });

  it("merges custom className", () => {
    render(
      <CardFooter data-testid="footer" className="custom">
        Footer
      </CardFooter>,
    );

    expect(screen.getByTestId("footer").className).toContain("custom");
  });
});
