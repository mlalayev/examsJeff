'use client';

import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200">
      <div className={styles.container}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <div className="text-xl font-bold">JEFF</div>
            <p className="mt-2 text-gray-600 text-sm">Smart mock exams platform</p>
          </div>
          <div>
            <div className="font-semibold text-gray-900">Contact</div>
            <ul className="mt-2 text-sm text-gray-600 space-y-1">
              <li>Email: support@jeff.ed</li>
              <li>WhatsApp: +1 555 000 1122</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-gray-900">Follow</div>
            <ul className="mt-2 text-sm text-gray-600 space-y-1">
              <li>Instagram</li>
              <li>LinkedIn</li>
              <li>Twitter</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-gray-900">Legal</div>
            <ul className="mt-2 text-sm text-gray-600 space-y-1">
              <li>Privacy</li>
              <li>Terms</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 text-xs text-gray-500">© {new Date().getFullYear()} JEFF. All rights reserved.</div>
      </div>
    </footer>
  );
}


