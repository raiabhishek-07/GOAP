import "./globals.css";

export const metadata = {
  title: "GOAP — Goal-Oriented Action Planning | Interactive AI Guide",
  description:
    "Learn how Goal-Oriented Action Planning (GOAP) works — the AI system used in F.E.A.R. and modern games. Explore beliefs, actions, goals, and the planner through interactive visuals.",
  keywords: [
    "GOAP",
    "Goal-Oriented Action Planning",
    "AI",
    "Game AI",
    "F.E.A.R.",
    "Jeff Orkin",
    "Planning",
    "Artificial Intelligence",
  ],
  authors: [{ name: "GOAP Interactive" }],
  openGraph: {
    title: "GOAP — Goal-Oriented Action Planning",
    description:
      "An interactive, visual guide to Goal-Oriented Action Planning in game AI.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Inter', sans-serif" }}>{children}</body>
    </html>
  );
}
