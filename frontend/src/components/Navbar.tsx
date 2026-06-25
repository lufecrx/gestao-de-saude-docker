'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-blue-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-blue-700 font-bold text-lg">V</span>
            </div>
            <span className="hidden sm:inline font-bold text-white">VidaPlena</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-8">
            <Link href="/" className="text-white hover:text-blue-200 transition font-medium">
              Dashboard
            </Link>
            <Link href="/pacientes" className="text-white hover:text-blue-200 transition font-medium">
              Pacientes
            </Link>
            <Link href="/agendamentos" className="text-white hover:text-blue-200 transition font-medium">
              Agendamentos
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-blue-700 transition"
            aria-expanded={menuOpen}
            aria-label="Menu de navegação"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/" className="block px-4 py-2 text-white hover:bg-blue-700 rounded transition">
              Dashboard
            </Link>
            <Link href="/pacientes" className="block px-4 py-2 text-white hover:bg-blue-700 rounded transition">
              Pacientes
            </Link>
            <Link href="/agendamentos" className="block px-4 py-2 text-white hover:bg-blue-700 rounded transition">
              Agendamentos
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
