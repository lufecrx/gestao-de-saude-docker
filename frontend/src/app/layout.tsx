import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'VidaPlena - Gestão de Saúde Familiar',
  description: 'Sistema de gestão de pacientes e agendamentos',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 text-gray-900">
        <Navbar />
        <main className="min-h-[calc(100vh-64px)]">
          {children}
        </main>
      </body>
    </html>
  );
}
