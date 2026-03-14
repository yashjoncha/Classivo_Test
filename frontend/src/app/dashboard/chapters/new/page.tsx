'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import ChapterEditor from '@/components/editor/ChapterEditor';
import type { ContentBlock, Chapter } from '@/lib/types';

export default function NewChapterPage() {
  const { user, token } = useAuth({ requiredRole: 'instructor' });
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (title: string, content: ContentBlock[]) => {
    if (!token) return;

    setSaving(true);
    setError('');
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

      router.push('/dashboard');
    } catch (err) {
      setError(`Failed to save chapter: ${(err as Error).message}`);
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
              <Link href="/dashboard" className="text-xl font-bold text-brand-500 dark:text-brand-400 tracking-tight hover:text-brand-600 dark:hover:text-brand-400 transition">
                Classavo
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
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-600 dark:text-red-400 mb-4">
            {error}
          </div>
        )}
        <ChapterEditor onSave={handleSave} loading={saving} />
      </main>
    </div>
  );
}
