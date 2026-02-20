'use client';

import Link from 'next/link';
import { GraduationCap, Mail, Phone, Facebook, Linkedin, Instagram } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#303380] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">JEFF Exams</span>
            </Link>
            <p className="text-sm text-gray-600 leading-relaxed">
              Smart mock exams platform for students and educators.
            </p>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                <a href="mailto:info@jeff.az" className="hover:text-[#303380] transition-colors">
                  info@jeff.az
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-gray-400" />
                <a href="https://wa.me/994506119100" target="_blank" rel="noopener noreferrer" className="hover:text-[#303380] transition-colors">
                  +994 50 611 91 00
                </a>
              </li>
            </ul>
          </div>

          {/* Follow Section */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Follow Us</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="https://www.facebook.com/p/JEFF-Colleges-61564214197612/?mibextid=LQQJ4d%2F" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#303380] transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                  Facebook
                </a>
              </li>
              <li>
                <a 
                  href="https://www.linkedin.com/company/jeff-colleges/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#303380] transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </a>
              </li>
              <li>
                <a 
                  href="https://www.instagram.com/jeffcolleges/?igsh=MWxjYXdoZjdyeTJobg%3D%3D%2F#" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#303380] transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                  Instagram
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Section */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 hover:text-[#303380] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-600 hover:text-[#303380] transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500">
              © {currentYear} JEFF Exams. All rights reserved.
            </p>
            <p className="text-xs text-gray-500">
              Made by{' '}
              <a 
                href="https://muradlalayev.netlify.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#303380] hover:text-[#252a6b] font-medium transition-colors underline decoration-1 underline-offset-2"
              >
                Murad Lalayev
              </a>
              {' '}for education
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
