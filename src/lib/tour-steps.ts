// Steps for the in-app "train from zero" guided tour. Each step either points at
// an element (via its data-tour value) for a spotlight, or is a centered card
// (no selector). `route` is the page the step lives on; if the user isn't there,
// the tour offers a button to navigate. `action: "seed"` / `"reset"` render the
// practice-sandbox buttons.
//
// `advanceOn` (optional) makes the step auto-detect that the user actually did
// the thing it describes, and advance on its own — manual "Next" stays available
// as a fallback so the user is never stuck:
//   - click       → the spotlighted target (or `selector`) was clicked
//   - route        → the user navigated TO `route`
//   - leaveRoute   → the user navigated AWAY from `route` (e.g. after a save/submit)
//   - event        → the app dispatched a `window` event named `name`
export type AdvanceOn =
  | { type: "click"; selector?: string }
  | { type: "route"; route: string }
  | { type: "leaveRoute"; route: string }
  | { type: "event"; name: string };

export type TourStep = {
  id: string;
  title: string;
  body: string;
  route?: string;
  selector?: string; // matches [data-tour="<selector>"]
  action?: "seed" | "reset";
  advanceOn?: AdvanceOn;
  hint?: string; // small note shown when auto-advance is armed
};

export const TRAINING_TOUR: TourStep[] = [
  {
    id: "intro",
    title: "Welcome to the training",
    body: "This quick tour takes you from zero to an exported binder. First, create a safe practice dataset (a clearly-labelled 🎓 Training publisher, company and journal) so you can try everything without touching real data.",
    action: "seed",
  },
  {
    id: "setup-hub",
    title: "1 · Setup — shared data",
    body: "Everything reusable lives in Setup: companies, publishers, profiles, domains and pricing. You enter it once and every journal reuses it.",
    route: "/admin",
    selector: "admin-hub",
  },
  {
    id: "company",
    title: "Start with a Company",
    body: "The legal entity — address, bank details, CIN and the printed-by line. A publisher points to a company.",
    route: "/admin",
    selector: "admin-card-companies",
  },
  {
    id: "publisher",
    title: "Then the Publisher",
    body: "Links to a company and holds the logo, seal, About/Objectives/Salient-features, and the Subscription & Dispatch managers shown on the pages.",
    route: "/admin",
    selector: "admin-card-publishers",
  },
  {
    id: "profiles",
    title: "Add People (Profiles)",
    body: "Editors, directors, board, team and the subscription/dispatch managers — with photo, phone and signature. Reused across the binder.",
    route: "/admin",
    selector: "admin-card-profiles",
  },
  {
    id: "pricing",
    title: "Set Subscription pricing",
    body: "Frequency-based price tiers (by issues per year). These tiers define which Issues-per-year a journal can pick, and drive the Subscription-page prices.",
    route: "/admin",
    selector: "admin-card-subscription-pricing",
  },
  {
    id: "new-journal",
    title: "2 · Create a Journal",
    body: "A journal is the reusable home for everything that stays the same across issues. Click here to add one.",
    route: "/journals",
    selector: "new-entity-btn",
    advanceOn: { type: "click" },
    hint: "Click the highlighted button — the tour continues on its own.",
  },
  {
    id: "journal-form",
    title: "Fill the journal form",
    body: "Only Name and Abbreviation are required. Pick the Publisher, Domain and Journal manager, choose Issues-per-year (Frequency is set automatically), then Create.",
    route: "/journals/new",
    selector: "journal-form-submit",
    advanceOn: { type: "leaveRoute", route: "/journals/new" },
    hint: "Create the journal — the tour continues once it saves.",
  },
  {
    id: "pick-journal",
    title: "3 · Build an issue",
    body: "Back on the dashboard, pick the journal you want to work on here.",
    route: "/",
    selector: "journal-picker",
    advanceOn: { type: "click" },
    hint: "Pick a journal to continue.",
  },
  {
    id: "sections",
    title: "Move through the sections",
    body: "Choose or start an issue, then step through the binder sections with these tabs. The live canvas mirrors each page as you edit.",
    route: "/",
    selector: "page-stepper",
    advanceOn: { type: "click" },
    hint: "Open any section tab to continue.",
  },
  {
    id: "save",
    title: "Save as you go",
    body: "Save each page after you finish it. The sidebar always shows whether anything is unsaved.",
    route: "/",
    selector: "save-page",
    advanceOn: { type: "click" },
    hint: "Click Save to continue.",
  },
  {
    id: "export",
    title: "4 · Export the binder",
    body: "When every section looks right, export the print-ready cover and internal-page PDFs here.",
    route: "/",
    selector: "export-actions",
    advanceOn: { type: "click" },
    hint: "Open the export panel to continue.",
  },
  {
    id: "done",
    title: "That's the full flow 🎉",
    body: "Setup → Journal → Build → Export. Re-launch this training anytime from the header. When you're finished practising, you can remove the 🎓 Training data.",
    action: "reset",
  },
];
