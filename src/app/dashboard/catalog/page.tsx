"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Clock, FileText, Users, Eye, UserPlus } from "lucide-react";
import Loading from "@/components/loading/Loading";

interface ExamCard {
  id: string;
  title: string;
  description: string | null;
  category: string;
  track: string | null;
  totalQuestions: number;
  totalDuration: number;
  sectionCount: number;
  sections: Array<{
    type: string;
    title: string;
    durationMin: number | null;
    questionCount: number;
  }>;
}

interface CatalogData {
  grouped: Record<string, Record<string, ExamCard[]>>;
  userRole: string;
}

const CATEGORY_ORDER = [
  "IELTS",
  "TOEFL", 
  "SAT",
  "KIDS",
  "GENERAL_ENGLISH",
  "MATH"
];

const TRACK_ORDER: Record<string, string[]> = {
  "IELTS": ["FULL", "READING", "LISTENING", "WRITING", "SPEAKING"],
  "TOEFL": ["FULL", "READING", "LISTENING", "WRITING", "SPEAKING"],
  "SAT": ["FULL", "VERBAL", "MATH"],
  "KIDS": ["GENERAL"],
  "GENERAL_ENGLISH": ["A1", "A2", "B1", "B1+", "B2"],
  "MATH": ["GENERAL"]
};

const CATEGORY_LABELS: Record<string, string> = {
  "IELTS": "IELTS",
  "TOEFL": "TOEFL",
  "SAT": "SAT",
  "KIDS": "Kids",
  "GENERAL_ENGLISH": "General English",
  "MATH": "Math"
};

const TRACK_LABELS: Record<string, Record<string, string>> = {
  "IELTS": {
    "FULL": "Full Test",
    "READING": "Reading",
    "LISTENING": "Listening", 
    "WRITING": "Writing",
    "SPEAKING": "Speaking"
  },
  "TOEFL": {
    "FULL": "Full Test",
    "READING": "Reading",
    "LISTENING": "Listening",
    "WRITING": "Writing", 
    "SPEAKING": "Speaking"
  },
  "SAT": {
    "FULL": "Full Test",
    "VERBAL": "Verbal",
    "MATH": "Math"
  },
  "KIDS": {
    "GENERAL": "General"
  },
  "GENERAL_ENGLISH": {
    "A1": "A1",
    "A2": "A2", 
    "B1": "B1",
    "B1+": "B1+",
    "B2": "B2"
  },
  "MATH": {
    "GENERAL": "General"
  }
};

export default function CatalogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CatalogData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

  useEffect(() => {
    const loadCatalog = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/catalog");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load catalog");
        setData(json);
      } catch (e) {
        console.error(e);
        alert(e instanceof Error ? e.message : "Failed to load catalog");
      } finally {
        setLoading(false);
      }
    };
    loadCatalog();
  }, []);

  const handleAssignExam = (examId: string) => {
    // For teachers, redirect to class selection
    router.push(`/dashboard/teacher/assign-exam?examId=${examId}`);
  };

  const handlePreviewExam = (examId: string) => {
    // For students, show exam details
    router.push(`/dashboard/student/exam-preview/${examId}`);
  };

  const filteredData = () => {
    if (!data) return {};
    
    let filtered = { ...data.grouped };
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      Object.keys(filtered).forEach(category => {
        Object.keys(filtered[category]).forEach(track => {
          filtered[category][track] = filtered[category][track].filter(exam =>
            exam.title.toLowerCase().includes(term) ||
            exam.description?.toLowerCase().includes(term)
          );
        });
      });
    }
    
    // Filter by category
    if (selectedCategory) {
      const temp: Record<string, Record<string, ExamCard[]>> = {};
      temp[selectedCategory] = filtered[selectedCategory] || {};
      filtered = temp;
    }
    
    // Filter by track
    if (selectedTrack && selectedCategory) {
      const temp: Record<string, Record<string, ExamCard[]>> = {};
      temp[selectedCategory] = {};
      temp[selectedCategory][selectedTrack] = filtered[selectedCategory]?.[selectedTrack] || [];
      filtered = temp;
    }
    
    return filtered;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" variant="spinner" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load catalog</h2>
          <p className="text-gray-600">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const isTeacher = data.userRole === "TEACHER";
  const filtered = filteredData();

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Exam Catalog</h1>
        <p className="text-gray-600">
          {isTeacher ? "Browse and assign exams to your students" : "Browse available exams"}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search exams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Category Filter */}
          <select
            value={selectedCategory || ""}
            onChange={(e) => {
              setSelectedCategory(e.target.value || null);
              setSelectedTrack(null);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {CATEGORY_ORDER.map(cat => (
              <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
            ))}
          </select>
          
          {/* Track Filter */}
          {selectedCategory && (
            <select
              value={selectedTrack || ""}
              onChange={(e) => setSelectedTrack(e.target.value || null)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Tracks</option>
              {TRACK_ORDER[selectedCategory]?.map(track => (
                <option key={track} value={track}>
                  {TRACK_LABELS[selectedCategory]?.[track] || track}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Catalog Content */}
      <div className="space-y-12">
        {CATEGORY_ORDER.map(category => {
          const categoryData = filtered[category];
          if (!categoryData || Object.keys(categoryData).length === 0) return null;
          
          return (
            <div key={category} className="space-y-6">
              <div className="border-b border-gray-200 pb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {CATEGORY_LABELS[category]}
                </h2>
              </div>
              
              {TRACK_ORDER[category]?.map(track => {
                const exams = categoryData[track];
                if (!exams || exams.length === 0) return null;
                
                return (
                  <div key={track} className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-700">
                      {TRACK_LABELS[category]?.[track] || track}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {exams.map(exam => (
                        <ExamCard
                          key={exam.id}
                          exam={exam}
                          isTeacher={isTeacher}
                          onAssign={() => handleAssignExam(exam.id)}
                          onPreview={() => handlePreviewExam(exam.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      
      {Object.keys(filtered).length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No exams found</h3>
          <p className="text-gray-600">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}

interface ExamCardProps {
  exam: ExamCard;
  isTeacher: boolean;
  onAssign: () => void;
  onPreview: () => void;
}

function ExamCard({ exam, isTeacher, onAssign, onPreview }: ExamCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-2">{exam.title}</h4>
        {exam.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{exam.description}</p>
        )}
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <FileText className="w-4 h-4 mr-2" />
          {exam.totalQuestions} questions
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="w-4 h-4 mr-2" />
          {exam.totalDuration} minutes
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Users className="w-4 h-4 mr-2" />
          {exam.sectionCount} sections
        </div>
      </div>
      
      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-1">Sections:</div>
        <div className="flex flex-wrap gap-1">
          {exam.sections.map((section, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
            >
              {section.type}
            </span>
          ))}
        </div>
      </div>
      
      <div className="flex gap-2">
        {isTeacher ? (
          <button
            onClick={onAssign}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Assign
          </button>
        ) : (
          <button
            onClick={onPreview}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
        )}
      </div>
    </div>
  );
}
