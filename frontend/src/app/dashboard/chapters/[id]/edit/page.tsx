'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import ChapterEditor from '@/components/editor/ChapterEditor';
import type { ContentBlock, Chapter } from '@/lib/types';

export default function EditChapterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, token, isReady } = useAuth({ requiredRole: 'instructor' });
  const router = useRouter();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const handleSave = async (title: string, content: ContentBlock[]) => {
    if (!token) return;

    setSaving(true);
    setError('');
    try {
      const textContent = content.filter((b) => b.type !== 'question-block');
      const questionBlocks = content.filter((b) => b.type === 'question-block');

      // Update chapter with content in DB
      await apiClient<Chapter>(`/chapters/${id}/`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          title,
          description: textContent
            .map((b) => b.children?.map((c) => c.text).join(''))
            .join(' ')
            .substring(0, 200) || 'Chapter content',
          content,
          order: chapter?.order || 1,
        }),
      });

      // Delete old questions in parallel (IDs already available from chapter load)
      const existingQuestionIds = (chapter?.questions || []).map((q) => q.id);
      await Promise.all(
        existingQuestionIds.map((qId) =>
          apiClient(`/questions/${qId}/`, { method: 'DELETE', token })
        )
      );

      // Create new questions in parallel
      const newQuestions = questionBlocks
        .filter((qb) => ((qb as Record<string, unknown>).question as string)?.trim())
        .map((qb) => {
          const q = qb as Record<string, unknown>;
          return apiClient('/questions/', {
            method: 'POST',
            token,
            body: JSON.stringify({
              chapter: Number(id),
              text: q.question,
              options: q.options,
              correct: q.correctAnswerIndex ?? 0,
            }),
          });
        });
      await Promise.all(newQuestions);

      router.push('/dashboard');
    } catch (err) {
      setError(`Failed to save chapter: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        <p className="text-slate-500 dark:text-slate-400">Loading...</p>
      </div>
    );
  }

  if (error && !chapter) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
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
              <span className="text-sm text-slate-500 dark:text-slate-400">Edit Chapter</span>
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
        <ChapterEditor
          initialTitle={chapter?.title}
          initialContent={chapter?.content}
          onSave={handleSave}
          loading={saving}
        />
      </main>
    </div>
  );
}
