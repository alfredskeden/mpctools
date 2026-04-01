export function FeatureGrid() {
  return (
    <section className="bg-surface-ground py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16">
          <span className="font-mono text-micro tracking-extra-wide text-text-tertiary uppercase">
            Capabilities
          </span>
          <h2 className="mt-3 text-display font-black tracking-display text-text-primary">
            Built for the job.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-px bg-surface-border md:grid-cols-3">
          {/* Large card — spans 2 rows on desktop */}
          <div className="flex flex-col justify-between gap-12 bg-surface-raised p-8 md:row-span-2">
            <div className="flex flex-col gap-3">
              <span className="font-mono text-micro tracking-label uppercase text-accent-blue">
                Automatic flow
              </span>
              <h3 className="text-2xl font-bold text-text-primary">
                One time config
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Select what you want, upload the art, then press render and all
                you have to do is use your gemini subscription to outpaint the
                image.
              </p>
            </div>
          </div>

          {/* Print-ready card */}
          <div className="flex flex-col gap-3 bg-surface-raised p-8">
            <span className="font-mono text-micro tracking-label uppercase text-accent-blue">
              Output
            </span>
            <h3 className="text-xl font-semibold text-text-primary">
              Perfectly merged image
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Use your favorite upscale tool to get the perfect image for your
              render.
            </p>
          </div>

          {/* Browser-based card */}
          <div className="flex flex-col gap-3 bg-surface-raised p-8">
            <span className="font-mono text-micro tracking-label uppercase text-accent-blue">
              Zero Setup
            </span>
            <h3 className="text-xl font-semibold text-text-primary">
              No Install Required
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Runs entirely in your browser. No account, no software download.
              Nano Banana 2/Pro has limited free use, otherwise we recommend you
              use a Gemini Pro subscription.
            </p>
          </div>

          {/* Wide free card — spans 2 cols on desktop */}
          <div className="flex flex-col gap-3 bg-surface-raised p-8 md:col-span-2">
            <span className="font-mono text-micro tracking-label uppercase text-accent-blue">
              Watermark Removal
            </span>
            <h3 className="text-xl font-semibold text-text-primary">
              Remove Gemini Watermark
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Remove the gemini watermark just before uploading it to the merger
              step, directly on the page.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
