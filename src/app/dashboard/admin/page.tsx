"use client";

import { useState } from "react";
import { Shield, BookOpen, BarChart3, Users, Settings } from "lucide-react";
import ExamsTab from "./tabs/ExamsTab";
import BandMapTab from "./tabs/BandMapTab";
import UsersTab from "./tabs/UsersTab";

type Tab = "exams" | "bandmap" | "users" | "settings";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("exams");

  const tabs = [
    { id: "exams" as Tab, label: "Exams", icon: BookOpen },
    { id: "bandmap" as Tab, label: "Band Map", icon: BarChart3 },
    { id: "users" as Tab, label: "Users", icon: Users },
    { id: "settings" as Tab, label: "Settings", icon: Settings },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-red-50 rounded-lg">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        </div>
        <p className="text-gray-600">System-wide content and user management</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? "border-red-600 text-red-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "exams" && <ExamsTab />}
        {activeTab === "bandmap" && <BandMapTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "settings" && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Settings</h3>
            <p className="text-gray-600">System settings coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}

