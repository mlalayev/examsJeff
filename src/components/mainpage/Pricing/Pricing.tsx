'use client';

import Link from 'next/link';
import styles from './Pricing.module.css';

export default function Pricing() {
  return (
    <section className="bg-gray-50">
      <div className={styles.container}>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center">Pricing</h2>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="text-sm font-semibold text-gray-500">Free Demo</div>
            <div className="mt-2 text-3xl font-bold">$0</div>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>• 1 section</li>
              <li>• Basic analytics</li>
            </ul>
            <Link href="/reading" className="mt-6 inline-block w-full text-center px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Start Free</Link>
          </div>
          <div className="rounded-2xl border-2 border-blue-600 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-blue-600">Full Mock</div>
            <div className="mt-2 text-3xl font-bold">$9</div>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>• IELTS / TOEFL / SAT</li>
              <li>• Instant scoring</li>
              <li>• AI feedback</li>
            </ul>
            <Link href="/reading" className="mt-6 inline-block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Buy Mock Now</Link>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="text-sm font-semibold text-purple-600">Monthly Bundle</div>
            <div className="mt-2 text-3xl font-bold">$19</div>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>• All exams</li>
              <li>• Advanced analytics</li>
              <li>• Certificate</li>
            </ul>
            <Link href="/reading" className="mt-6 inline-block w-full text-center px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">Buy Mock Now</Link>
          </div>
        </div>
      </div>
    </section>
  );
}


