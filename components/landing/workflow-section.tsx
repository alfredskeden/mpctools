const STEPS = [
  {
    number: "01",
    title: "Prep",
    description:
      "Upload the art. Center and scale to configure the outpaint canvas.",
  },
  {
    number: "02",
    title: "Outpaint",
    description:
      "Gemini Nano Banana 2/Pro extends your image beyond its original boundaries to fill the full card.",
  },
  {
    number: "03",
    title: "Merge",
    description:
      "Upload the source art, Outpaint canvas and then the outpainted image from Nano Banana 2/Pro to merge into a single image to keep the quality of the original art. Ready to use in your render.",
  },
] as const;

export function WorkflowSection() {
  return (
    <section id="how-it-works" className="bg-surface-base">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-16">
          <span className="font-mono text-micro tracking-extra-wide text-text-tertiary uppercase">
            The process
          </span>
          <h2 className="mt-3 text-display font-black tracking-display text-text-primary">
            Three steps from source to borderless card art.
          </h2>
        </div>

        <ol
          aria-label="Workflow steps"
          className="grid grid-cols-1 gap-px bg-surface-border md:grid-cols-3 list-none m-0 p-0"
        >
          {STEPS.map((step) => (
            <li
              key={step.number}
              className="flex flex-col gap-5 bg-surface-base p-8"
            >
              <span
                aria-hidden="true"
                className="font-mono text-display font-black text-text-faint leading-none"
              >
                {step.number}
              </span>
              <div className="flex flex-col gap-3">
                <h3 className="text-xl font-semibold text-text-primary">
                  {step.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
