import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      <Sidebar />
      <main className="ml-72 h-full">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
}

