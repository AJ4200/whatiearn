"use client";

import { usePathname } from 'next/navigation';
import { Navbar } from './navbar';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNavbar = !['/login', '/register'].includes(pathname);

  return (
    <>
      {showNavbar && <Navbar />}
      {children}
    </>
  );
} 