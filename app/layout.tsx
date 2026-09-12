import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "FScouting Pro",
  description: "Plataforma de Inteligencia Deportiva Avanzada",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="flex min-h-screen bg-[#0f172a] text-slate-50 antialiased">
        {/* Menú lateral fijo */}
        <Sidebar />
        
        {/* Contenedor principal dinámico (deja espacio para el sidebar) */}
        <main className="flex-1 ml-64 p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
