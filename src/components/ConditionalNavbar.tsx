"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Show navbar only on the home page (/)
  if (pathname === "/") {
    return <Navbar />;
  }
  
  return null;
}

