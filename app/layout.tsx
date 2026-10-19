import type { Metadata } from "next";
import { Outfit, Space_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GameHub — Play Classic Mini Games Online",
  description:
    "Play Tic Tac Toe, Wordle, Chess, and Naval Battle for free in your browser. No download required. Beautiful, fast, and fun!",
  keywords: ["games", "tic tac toe", "wordle", "chess", "naval battle", "battleship", "mini games"],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${spaceMono.variable}`}>
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
