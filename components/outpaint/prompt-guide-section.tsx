import { PromptGuideCard } from "./PromptGuideCard";

type PromptGuideTip = {
  stepNumber: string;
  heading: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
};

const PROMPT_GUIDE_TIPS: PromptGuideTip[] = [
  {
    stepNumber: "01",
    heading: "Navigate to Gemini",
    description:
      "Navigate to https://gemini.google.com/ or to the gemini app on your phone. If you are using the web app, click on the 'New Chat' button. If you are using the app, click on the 'New Chat' button. ",
    imageSrc: "/images/prompt-guide-01.webp",
    imageAlt: "Example of a clearly described scene in an outpaint prompt",
  },
  {
    stepNumber: "02",
    heading: "Name the grey zones",
    description:
      "Reference the grey border areas explicitly. Say 'extend the scene into the grey zones' so Gemini knows exactly where to generate.",
    imageSrc: "/images/prompt-guide-02.webp",
    imageAlt: "Canvas with grey border zones highlighted for outpainting",
  },
  {
    stepNumber: "03",
    heading: "Match the lighting",
    description:
      "Mention the lighting direction and mood. Consistent light sources prevent jarring edges between the original and extended area.",
    imageSrc: "/images/prompt-guide-03.webp",
    imageAlt:
      "Side-by-side comparison showing consistent lighting in outpainted result",
  },
  {
    stepNumber: "04",
    heading: "Keep style consistent",
    description:
      "Describe the art style — photorealistic, painterly, illustrated. An explicit style tag helps maintain visual coherence across the extension.",
    imageSrc: "/images/prompt-guide-04.webp",
    imageAlt:
      "Outpainted image showing style-matched extension around original artwork",
  },
  {
    stepNumber: "05",
    heading: "Iterate if needed",
    description:
      "If the first result has seams or odd fills, re-run with more specific wording. Small prompt tweaks make a big difference in blending.",
    imageSrc: "/images/prompt-guide-05.webp",
    imageAlt:
      "Comparison of first and refined outpaint result showing improved blending",
  },
];

export function PromptGuideSection() {
  return (
    <section aria-labelledby="prompt-guide-heading">
      <div className="flex items-baseline justify-between mb-4 lg:mb-6">
        <h2
          id="prompt-guide-heading"
          className="text-2xl font-bold tracking-extra-wide text-text-primary"
        >
          How to prompt Gemini
        </h2>
        <span className="text-caption text-text-tertiary">
          5 steps · best results
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
        {PROMPT_GUIDE_TIPS.map((tip) => (
          <PromptGuideCard key={tip.stepNumber} {...tip} />
        ))}
      </div>
    </section>
  );
}
