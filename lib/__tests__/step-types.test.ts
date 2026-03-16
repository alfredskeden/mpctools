import type { StepStatus } from "../step-types";

describe("StepStatus type", () => {
  it("accepts valid step status values", () => {
    const active: StepStatus = "active";
    const completed: StepStatus = "completed";
    const upcoming: StepStatus = "upcoming";

    expect(active).toBe("active");
    expect(completed).toBe("completed");
    expect(upcoming).toBe("upcoming");
  });
});
