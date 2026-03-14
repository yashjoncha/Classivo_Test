'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { Chapter } from '@/lib/types';

export default function DashboardPage() {
  const { user, token, isReady, logout } = useAuth();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isReady || !token) return;

    apiClient<Chapter[]>('/chapters/', { token })
      .then((data) => {
        setChapters(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setError('Failed to load chapters.');
      })
      .finally(() => setLoading(false));
  }, [isReady, token]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        <p className="text-slate-500 dark:text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Classivo</h1>
            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-600 dark:text-slate-300">
                <span className="font-medium">{user.username}</span>
                <span className="ml-2 inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 capitalize">
                  {user.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Chapters</h2>
          {user.role === 'instructor' && (
            <Link
              href="/dashboard/chapters/new"
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
            >
              + Create New Chapter
            </Link>
          )}
        </div>

        {loading && (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">Loading chapters...</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-600 dark:text-red-400 mb-4">
            {error}
          </div>
        )}

        {!loading && !error && chapters.length === 0 && (
          <div className="text-center py-16">
            <p className="text-lg text-slate-500 dark:text-slate-400 mb-2">No chapters yet.</p>
            {user.role === 'instructor' && (
              <p className="text-sm text-slate-400 dark:text-slate-500">
                Click &quot;Create New Chapter&quot; to get started.
              </p>
            )}
          </div>
        )}

        {!loading && chapters.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {chapters.map((chapter) => (
              <div
                key={chapter.id}
                className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {chapter.title}
                  </h3>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                    #{chapter.order}
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                  {chapter.description || 'No description'}
                </p>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/chapters/${chapter.id}`}
                    className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                  >
                    Read
                  </Link>
                  {user.role === 'instructor' && (
                    <>
                      <Link
                        href={`/dashboard/chapters/${chapter.id}/edit`}
                        className="rounded-lg bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/dashboard/chapters/${chapter.id}/responses`}
                        className="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition"
                      >
                        Responses
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
