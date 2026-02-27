"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ConditionalNavbar() {
  const pathname = usePathname();

  // Show navbar on main marketing and legal pages
  const showNavbarOnPaths = ["/", "/privacy", "/terms"];

  if (showNavbarOnPaths.includes(pathname)) {
    return <Navbar />;
  }
  
  return null;
}

