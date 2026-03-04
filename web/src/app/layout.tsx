import "@/styles/globals.css";
import AppShell from "@/components/layout/AppShell";
import { Manrope } from "next/font/google";

const font = Manrope({
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${font.className} antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}