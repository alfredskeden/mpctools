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
    imageAlt: "Gemini web app new chat button",
  },
  {
    stepNumber: "02",
    heading: "Paste handshake prompt",
    description:
      "Copy over the handshake prompt from the extension and paste it into the chat input field. Wait for the message 'Universal Neutral Extension Mode Locked. Ready for any input.'",
    imageSrc: "/images/prompt-guide-02.webp",
    imageAlt: "Gemini chat input field with handshake prompt pasted in",
  },
  {
    stepNumber: "03",
    heading: "Paste the outpaint command",
    description:
      "Copy over the outpaint command from the extension and paste it into the chat input field. Don't forget to paste the image you want to outpaint.",
    imageSrc: "/images/prompt-guide-03.webp",
    imageAlt: "Gemini chat input field with outpaint command pasted in",
  },
  {
    stepNumber: "04",
    heading: "Redo until you're happy",
    description:
      "If the first result has seams or odd fills, redo with pro or nb2 as many times as you want.",
    imageSrc: "/images/prompt-guide-04.webp",
    imageAlt: "Showing the redo process with pro and nb2",
  },
  {
    stepNumber: "05",
    heading: "Download the result",
    description:
      "When you're happy with the result, click on the 'Download full size' button to save the image to your device. Then continue to the merge step.",
    imageSrc: "/images/prompt-guide-05.webp",
    imageAlt: "Download full size button in gemini app",
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
        {PROMPT_GUIDE_TIPS.map((tip, index) => (
          <PromptGuideCard key={tip.stepNumber} {...tip} priority={index === 0} />
        ))}
      </div>
    </section>
  );
}
