export default function TeacherReportsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Reports</h1>
          <div className="inline-block px-4 py-2 bg-amber-100 border border-amber-200 rounded-full mb-4">
            <p className="text-sm font-medium text-amber-800">Coming Soon</p>
          </div>
          <p className="text-gray-600 max-w-sm mx-auto">
            Advanced teaching reports and analytics will be available here soon.
          </p>
        </div>
      </div>
    </div>
  );
}




