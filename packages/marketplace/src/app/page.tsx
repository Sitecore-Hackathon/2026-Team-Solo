export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">Personalize Connect</h1>
      <p className="text-muted-foreground">
        This app runs as a Page Builder Context Panel extension.
      </p>
      <p className="text-sm text-muted-foreground">
        Open the <strong>/personalize-connect</strong> route from within
        Sitecore XM Cloud Page Builder to use the app.
      </p>
    </div>
  );
}
