export default function TeacherSchedulePage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-xl p-8 border border-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Schedule</h1>
          <p className="text-gray-600">View your teaching schedule and upcoming classes</p>
          <div className="mt-6 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">This page is under development</p>
          </div>
        </div>
      </div>
    </div>
  );
}

