"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import UnifiedLoading from "@/components/loading/UnifiedLoading";

interface BandMap {
  id: string;
  examType: string;
  section: string;
  minRaw: number;
  maxRaw: number;
  band: number;
}

export default function BandMapTab() {
  const [bandMaps, setBandMaps] = useState<BandMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    examType: "IELTS",
    section: "READING",
    minRaw: 0,
    maxRaw: 0,
    band: 0
  });

  useEffect(() => {
    fetchBandMaps();
  }, []);

  const fetchBandMaps = async () => {
    try {
      const res = await fetch("/api/admin/bandmap");
      const data = await res.json();
      setBandMaps(data.bandMaps);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.maxRaw < formData.minRaw) {
      alert("maxRaw must be >= minRaw");
      return;
    }
    try {
      const res = await fetch("/api/admin/bandmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        await fetchBandMaps();
        setShowCreate(false);
        setFormData({ examType: "IELTS", section: "READING", minRaw: 0, maxRaw: 0, band: 0 });
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this band map?")) return;
    try {
      const res = await fetch(`/api/admin/bandmap?id=${id}`, { method: "DELETE" });
      if (res.ok) await fetchBandMaps();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  if (loading) return <UnifiedLoading type="spinner" variant="spinner" size="md" />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Band Map Editor</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Entry
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Add Band Map</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Exam Type</label>
                <input
                  type="text"
                  value={formData.examType}
                  onChange={(e) => setFormData({...formData, examType: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Section</label>
                <select
                  value={formData.section}
                  onChange={(e) => setFormData({...formData, section: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option>READING</option>
                  <option>LISTENING</option>
                  <option>WRITING</option>
                  <option>SPEAKING</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Min Raw</label>
                  <input
                    type="number"
                    value={formData.minRaw}
                    onChange={(e) => setFormData({...formData, minRaw: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Raw</label>
                  <input
                    type="number"
                    value={formData.maxRaw}
                    onChange={(e) => setFormData({...formData, maxRaw: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Band Score</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.band}
                  onChange={(e) => setFormData({...formData, band: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                  min="0"
                  max="9"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Raw</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Raw</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Band</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {bandMaps.map((bm) => (
              <tr key={bm.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{bm.examType}</td>
                <td className="px-4 py-3">{bm.section}</td>
                <td className="px-4 py-3">{bm.minRaw}</td>
                <td className="px-4 py-3">{bm.maxRaw}</td>
                <td className="px-4 py-3 font-bold">{bm.band}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDelete(bm.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

