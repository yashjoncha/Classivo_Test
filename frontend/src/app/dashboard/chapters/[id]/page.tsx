'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import ChapterReader from '@/components/reader/ChapterReader';
import type { Chapter } from '@/lib/types';

export default function ReadChapterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, token, isReady } = useAuth();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isReady || !token) return;

    apiClient<Chapter>(`/chapters/${id}/`, { token })
      .then((data) => {
        setChapter(data);
      })
      .catch(() => {
        setError('Failed to load chapter.');
      })
      .finally(() => setLoading(false));
  }, [id, isReady, token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        <p className="text-slate-500 dark:text-slate-400">Loading...</p>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Chapter not found.'}</p>
          <Link href="/dashboard" className="text-brand-500 dark:text-brand-400 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-xl font-bold text-brand-500 dark:text-brand-400 tracking-tight hover:text-brand-600 dark:hover:text-brand-400 transition">
                Classavo
              </Link>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">{chapter.title}</span>
            </div>
            <div className="flex items-center gap-2">
              {user?.role === 'instructor' && (
                <Link
                  href={`/dashboard/chapters/${id}/edit`}
                  className="rounded-lg bg-brand-50 dark:bg-brand-900/30 px-3 py-1.5 text-sm font-medium text-brand-500 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition"
                >
                  Edit
                </Link>
              )}
              <Link
                href="/dashboard"
                className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Reader */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
          <ChapterReader
            title={chapter.title}
            content={chapter.content || []}
            questions={chapter.questions || []}
          />
        </div>
      </main>
    </div>
  );
}
