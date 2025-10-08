"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface PaymentModalProps {
  student: any;
  teachers: any[];
  onClose: () => void;
  onUpdate: () => void;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export default function PaymentModal({ student, teachers, onClose, onUpdate }: PaymentModalProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [paymentYear, setPaymentYear] = useState(currentYear);
  const [tuitionPayments, setTuitionPayments] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    firstEnrollAt: student.studentProfile?.firstEnrollAt 
      ? new Date(student.studentProfile.firstEnrollAt).toISOString().split('T')[0]
      : "",
    monthlyFee: student.studentProfile?.monthlyFee || 0,
    teacherId: student.studentProfile?.teacherId || "",
  });

  useEffect(() => {
    loadTuitionPayments(paymentYear);
  }, [paymentYear]);

  const loadTuitionPayments = async (year: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/branch/students/${student.id}/payments?year=${year}`);
      const data = await res.json();
      setTuitionPayments(data.payments || []);
    } catch (error) {
      console.error("Failed to load tuition payments:", error);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const togglePaymentStatus = async (month: number, currentStatus: string, amount: any) => {
    try {
      const res = await fetch(`/api/branch/students/${student.id}/payments/mark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: paymentYear,
          month,
          paid: currentStatus !== "PAID",
          amount: parseFloat(amount) || 0,
        }),
      });

      if (res.ok) {
        toast.success(currentStatus !== "PAID" ? "Payment marked as PAID" : "Payment marked as UNPAID");
        await loadTuitionPayments(paymentYear);
      } else {
        const error = await res.json();
        console.error("Payment mark error:", error);
        toast.error(error.error || error.details || "Failed to update payment");
      }
    } catch (error) {
      console.error("Failed to toggle payment:", error);
      toast.error("Failed to update payment");
    }
  };

  const updateProfile = async () => {
    setLoading(true);
    try {
      // Update profile (firstEnrollAt and monthlyFee)
      const profileRes = await fetch(`/api/branch/students/${student.id}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstEnrollAt: profileForm.firstEnrollAt || null,
          monthlyFee: profileForm.monthlyFee ? parseFloat(profileForm.monthlyFee.toString()) : null,
        }),
      });

      if (!profileRes.ok) {
        const error = await profileRes.json();
        console.error("Profile update error:", error);
        toast.error(error.error || error.details || "Failed to update profile");
        return;
      }

      // Update teacher assignment
      const teacherRes = await fetch(`/api/branch/students/${student.id}/assign-teacher`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: profileForm.teacherId || null,
        }),
      });

      if (!teacherRes.ok) {
        const error = await teacherRes.json();
        toast.error(error.error || "Failed to assign teacher");
        return;
      }

      toast.success("Profile updated successfully");
      onUpdate();
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const getMonthStatus = (month: number) => {
    const payment = tuitionPayments.find(p => p.month === month);
    return payment?.status || "UNPAID";
  };

  const getMonthAmount = (month: number) => {
    const payment = tuitionPayments.find(p => p.month === month);
    return payment?.amount || profileForm.monthlyFee || 0;
  };

  const getMonthPaidDate = (month: number) => {
    const payment = tuitionPayments.find(p => p.month === month);
    return payment?.paidAt;
  };

  const isCurrentMonth = (month: number) => {
    return paymentYear === currentYear && month === currentMonth;
  };

  return (
    <div 
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-y-auto"
      role="dialog"
      aria-labelledby="payment-modal-title"
      aria-modal="true"
    >
      <div className="bg-white w-full max-w-5xl rounded-xl shadow-xl p-6 my-8 mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 id="payment-modal-title" className="text-xl font-semibold text-gray-900">
              Student Profile & Payments
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {student.name} • {student.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Profile Information */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-900">Profile Information</h4>
            <div className="space-y-4">
              <div>
                <label htmlFor="first-enroll-date" className="block text-sm font-medium text-gray-700 mb-1">
                  First Enrollment Date
                </label>
                <input
                  id="first-enroll-date"
                  type="date"
                  value={profileForm.firstEnrollAt}
                  onChange={(e) => setProfileForm({ ...profileForm, firstEnrollAt: e.target.value })}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  aria-describedby="first-enroll-hint"
                />
                <p id="first-enroll-hint" className="text-xs text-gray-500 mt-1">
                  When the student first enrolled
                </p>
              </div>

              <div>
                <label htmlFor="monthly-fee" className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Fee (AZN)
                </label>
                <input
                  id="monthly-fee"
                  type="number"
                  step="0.01"
                  value={profileForm.monthlyFee}
                  onChange={(e) => setProfileForm({ ...profileForm, monthlyFee: parseFloat(e.target.value) || 0 })}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="0.00"
                  aria-describedby="monthly-fee-hint"
                />
                <p id="monthly-fee-hint" className="text-xs text-gray-500 mt-1">
                  Default amount for monthly payments
                </p>
              </div>

              <div>
                <label htmlFor="teacher-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Assign Teacher (Homeroom)
                </label>
                <select
                  id="teacher-select"
                  value={profileForm.teacherId}
                  onChange={(e) => setProfileForm({ ...profileForm, teacherId: e.target.value })}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  aria-describedby="teacher-hint"
                >
                  <option value="">No teacher assigned</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name || teacher.email}
                    </option>
                  ))}
                </select>
                <p id="teacher-hint" className="text-xs text-gray-500 mt-1">
                  Only teachers from your branch are shown
                </p>
              </div>

              <button
                onClick={updateProfile}
                disabled={loading}
                className="w-full px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                aria-label="Save profile changes"
              >
                {loading ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>

          {/* Right Column - Tuition Payments */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-gray-900">Tuition Payments</h4>
              <select
                value={paymentYear}
                onChange={(e) => setPaymentYear(parseInt(e.target.value))}
                className="border rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label="Select payment year"
              >
                {Array.from({ length: 3 }, (_, i) => currentYear - 1 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto" role="grid" aria-label="Monthly payment status">
                  {tuitionPayments.map((payment) => {
                    const isPaid = payment.status === "PAID";
                    const isCurrent = isCurrentMonth(payment.month);
                    
                    return (
                      <button
                        key={payment.month}
                        onClick={() => togglePaymentStatus(payment.month, payment.status, payment.amount)}
                        className={`p-3 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                          isPaid
                            ? "bg-green-50 border-green-300 hover:bg-green-100"
                            : "bg-gray-50 border-gray-300 hover:bg-gray-100"
                        } ${
                          isCurrent ? "ring-2 ring-blue-400" : ""
                        }`}
                        role="gridcell"
                        aria-label={`${MONTH_NAMES[payment.month - 1]} ${paymentYear}, ${payment.status}, ${payment.amount} AZN${isCurrent ? ', current month' : ''}`}
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {MONTH_NAMES[payment.month - 1]}
                        </div>
                        <div className={`text-xs font-semibold mt-1 ${
                          isPaid ? "text-green-700" : "text-gray-600"
                        }`}>
                          {payment.status}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {payment.amount} AZN
                        </div>
                        {payment.paidAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(payment.paidAt).toLocaleDateString()}
                          </div>
                        )}
                        {isCurrent && (
                          <div className="text-xs text-blue-600 mt-1 font-medium">
                            Current
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        <strong>Click</strong> any month to toggle paid/unpaid status
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Monthly Fee: {profileForm.monthlyFee} AZN
                      </p>
                      <div className="flex gap-4 mt-2 text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded bg-green-200 border border-green-400"></div>
                          <span className="text-gray-700">Paid</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded bg-gray-200 border border-gray-400"></div>
                          <span className="text-gray-700">Unpaid</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded bg-blue-100 border-2 border-blue-400"></div>
                          <span className="text-gray-700">Current Month</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6 border-t pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
