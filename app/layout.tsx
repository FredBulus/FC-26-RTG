import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { tournamentName } from "@/lib/constants";

export const metadata: Metadata = {
  title: tournamentName,
  description: `Fixtures, standings, and results for ${tournamentName}.`
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen pitch-lines">
          <Header />
          <main className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
