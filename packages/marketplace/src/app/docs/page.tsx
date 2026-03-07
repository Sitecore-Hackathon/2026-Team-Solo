export default function DocsPage() {
  return (
    <div className="mx-auto max-w-2xl p-6 pb-12">
      <h1 className="text-xl font-semibold">Personalize Connect — Documentation</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Use this app to link page components to Sitecore Personalize experiences without writing code.
      </p>

      <section className="mt-8">
        <h2 className="text-base font-semibold">What you need in Sitecore Personalize</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Before using Personalize Connect, set up the following in Sitecore Personalize:
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Interactive Experience</strong> — Create an
            Interactive experience (Full Stack or Web). It must be of type &quot;Interactive&quot; so
            it can be selected in the app.
          </li>
          <li>
            <strong className="text-foreground">API response format</strong> — Your experience must
            return JSON with a <code className="rounded bg-muted px-1 py-0.5 text-xs">contentKey</code>{" "}
            field. For example: <code className="rounded bg-muted px-1 py-0.5 text-xs">&#123;
            &quot;contentKey&quot;: &quot;new-visitor&quot; &#125;</code>
          </li>
          <li>
            <strong className="text-foreground">API credentials</strong> — You need an API Key and
            API Secret from Personalize (Settings → API Keys). These are entered when you first open
            the app or in the Settings screen.
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-semibold">How to use Personalize Connect</h2>
        <ol className="mt-3 space-y-4 text-sm text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">1. Pick a component</span>
            <p className="mt-1">
              Open the Experience Connector and choose which component on the page you want to
              personalize (e.g., a hero, promo card, or banner).
            </p>
          </li>
          <li>
            <span className="font-medium text-foreground">2. Connect an experience</span>
            <p className="mt-1">
              Select the Sitecore Personalize Interactive Experience from the dropdown. The app
              fetches your available experiences from Personalize.
            </p>
          </li>
          <li>
            <span className="font-medium text-foreground">3. Map content variations</span>
            <p className="mt-1">
              Add the content keys your experience returns (e.g., <code className="rounded bg-muted px-1 py-0.5 text-xs">new-visitor</code>,{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">returning-visitor</code>) and
              assign each one to a content item from your site. When Personalize returns that key,
              the component will show the content you mapped.
            </p>
          </li>
          <li>
            <span className="font-medium text-foreground">4. Save</span>
            <p className="mt-1">
              Click Save. The configuration is stored and published with the page.
            </p>
          </li>
        </ol>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-semibold">Tips</h2>
        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          <li>• Components with an experience already linked show a sparkle icon.</li>
          <li>• Use Reset to clear your selection and configure a different component.</li>
          <li>• After saving, the flow resets so you can quickly set up another component.</li>
        </ul>
      </section>
    </div>
  );
}
