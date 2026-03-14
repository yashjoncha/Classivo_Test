'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import ChapterEditor from '@/components/editor/ChapterEditor';
import type { ContentBlock, Chapter, User } from '@/lib/types';

export default function NewChapterPage() {
  const [user, setUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      window.location.href = '/';
      return;
    }

    try {
      const parsed = JSON.parse(userStr) as User;
      if (parsed.role !== 'instructor') {
        window.location.href = '/dashboard';
        return;
      }
      setUser(parsed);
    } catch {
      window.location.href = '/';
    }
  }, []);

  const handleSave = async (title: string, content: ContentBlock[]) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    setSaving(true);
    try {
      // Separate text content and question blocks
      const textContent = content.filter((b) => b.type !== 'question-block');
      const questionBlocks = content.filter((b) => b.type === 'question-block');

      // Create chapter with content stored in DB
      const chapter = await apiClient<Chapter>('/chapters/', {
        method: 'POST',
        token,
        body: JSON.stringify({
          title,
          description: textContent
            .map((b) => b.children?.map((c) => c.text).join(''))
            .join(' ')
            .substring(0, 200) || 'Chapter content',
          content,
          order: 1,
        }),
      });

      // Save question blocks to API in parallel
      await Promise.all(
        questionBlocks
          .filter((qb) => ((qb as Record<string, unknown>).question as string)?.trim())
          .map((qb) => {
            const q = qb as Record<string, unknown>;
            return apiClient('/questions/', {
              method: 'POST',
              token,
              body: JSON.stringify({
                chapter: chapter.id,
                text: q.question,
                options: q.options,
                correct: q.correctAnswerIndex ?? 0,
              }),
            });
          })
      );

      window.location.href = '/dashboard';
    } catch (err) {
      alert(`Failed to save chapter: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

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
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-xl font-bold text-slate-900 dark:text-white tracking-tight hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                Classivo
              </Link>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">New Chapter</span>
            </div>
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Editor */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ChapterEditor onSave={handleSave} loading={saving} />
      </main>
    </div>
  );
}
