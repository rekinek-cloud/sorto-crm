'use client';

export default function InfoPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Information</h1>
          <p className="text-gray-600">Important information and reference materials</p>
        </div>
        <button className="btn btn-primary">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Add Info
        </button>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">ℹ️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Information Repository</h3>
          <p className="text-gray-600">Store important reference information</p>
        </div>
      </div>
    </div>
  );
}