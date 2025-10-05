'use client';

import Link from 'next/link';

export default function TeachersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="text-blue-600 hover:text-blue-700">← Back to Home</Link>
        <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard (Coming Soon)</h1>
          <p className="mt-2 text-gray-600">Manage students, assign mocks, track progress, and export reports.</p>
        </div>
      </div>
    </div>
  );
}


