import { Award, FileCheck } from "lucide-react";

interface OverallScoreCardProps {
  summary: {
    totalCorrect: number;
    totalQuestions: number;
    totalPercentage: number;
  };
}

export function OverallScoreCard({ summary }: OverallScoreCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-br from-[#303380] to-[#4548a8] rounded-lg shadow-md">
          <FileCheck className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Overall Score</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="text-3xl font-bold text-blue-700">
            {summary.totalCorrect}/{summary.totalQuestions}
          </div>
          <div className="text-sm text-gray-600 mt-1">Questions</div>
        </div>
        
        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <div className="text-3xl font-bold text-purple-700">
            {summary.totalPercentage.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600 mt-1">Accuracy</div>
        </div>
        
        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-center gap-2">
            <Award className="w-8 h-8 text-green-600" />
            <div className="text-3xl font-bold text-green-700">
              {summary.totalPercentage >= 80 ? "A" : summary.totalPercentage >= 60 ? "B" : summary.totalPercentage >= 40 ? "C" : "D"}
            </div>
          </div>
          <div className="text-sm text-gray-600 mt-1">Grade</div>
        </div>
      </div>
    </div>
  );
}
