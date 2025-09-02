// src/app/layout.tsx
import "./globals.css";
import Providers from "./providers";

export const metadata = { title: "Gate Forecast", description: "Gate token predictions" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-theme-bg text-theme-text transition-colors duration-300">
        <Providers>
          <div className="w-full">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
