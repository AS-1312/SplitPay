import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { WalletProvider } from "@/lib/wallet-context";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SplitPay - Split Expenses with Crypto",
  description: "Split expenses seamlessly with your friends using cryptocurrency",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
