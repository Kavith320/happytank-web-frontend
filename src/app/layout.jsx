import "./globals.css";
import Navbar from "./components/Navbar";
import BubbleTransition from "./components/BubbleTransition";

export const metadata = {
  title: "HappyTank — Smart Aquarium Monitoring & Automation",
  description: "Immersive IoT Aquarium Ecosystem with real-time telemetry, live vital metrics, and smart actuator automation.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-[#030d1a] text-slate-100 antialiased selection:bg-cyan-500 selection:text-black">
        <BubbleTransition />
        <div className="relative min-h-screen flex flex-col justify-between">
          <Navbar />
          <main className="flex-1 w-full relative z-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
