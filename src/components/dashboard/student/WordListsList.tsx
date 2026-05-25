"use client";

import useSWR from "swr";
import { swrConfig } from "@/lib/swr-config";
import type { WordListItem } from "@/lib/student-content";

type Response = { items: WordListItem[]; nextCursor: string | null };

export default function WordListsList({ category }: { category: string }) {
  const { data, error, isLoading } = useSWR<Response>(
    `/api/student/words?category=${encodeURIComponent(category)}`,
    swrConfig.fetcher,
    swrConfig
  );

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-md divide-y divide-gray-200">
        {[1, 2, 3].map((i) => (
          <div key={i} className="px-4 py-4 flex items-center gap-4">
            <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
            <div className="h-3 bg-gray-100 rounded w-1/5 animate-pulse ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-md px-4 py-6 text-sm text-gray-600">
        Failed to load word lists. Try refreshing the page.
      </div>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-md px-4 py-12 text-center">
        <p className="text-sm font-medium text-gray-900">No word lists yet</p>
        <p className="mt-1 text-sm text-gray-500">
          Vocabulary decks will appear here once they are published.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-700">
                Word list
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">
                Level
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">
                Words
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">
                Mastered
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((l) => {
              const pct =
                l.totalWords > 0
                  ? Math.round((l.mastered / l.totalWords) * 100)
                  : 0;
              return (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{l.title}</div>
                    {l.description ? (
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {l.description}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{l.level ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{l.totalWords}</td>
                  <td className="px-4 py-3 text-gray-700">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{pct}%</span>
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: "#303380",
                          }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
