'use client';

import { useState, useEffect, useMemo, use } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { Chapter, Answer } from '@/lib/types';

interface StudentSummary {
  username: string;
  userId: number;
  total: number;
  correct: number;
  answers: Answer[];
}

export default function ResponsesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, token, isReady } = useAuth({ requiredRole: 'instructor' });
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !token) return;

    // Fetch chapter (with nested questions) and answers in parallel
    Promise.all([
      apiClient<Chapter>(`/chapters/${id}/`, { token }),
      apiClient<Answer[]>(`/answers/list/?chapter=${id}`, { token }),
    ])
      .then(([chapterData, answerData]) => {
        setChapter(chapterData);
        setAnswers(Array.isArray(answerData) ? answerData : []);
      })
      .catch(() => {
        setError('Failed to load responses.');
      })
      .finally(() => setLoading(false));
  }, [id, isReady, token]);

  const questions = chapter?.questions || [];

  // Group answers by student (memoized to avoid recomputing on every render)
  const studentSummaries = useMemo(() => {
    const studentMap = new Map<string, StudentSummary>();
    for (const answer of answers) {
      const username = answer.username || `User ${answer.user}`;
      if (!studentMap.has(username)) {
        studentMap.set(username, { username, userId: answer.user, total: 0, correct: 0, answers: [] });
      }
      const summary = studentMap.get(username)!;
      summary.total++;
      if (answer.is_correct) summary.correct++;
      summary.answers.push(answer);
    }
    return Array.from(studentMap.values()).sort((a, b) => b.correct - a.correct);
  }, [answers]);

  // Build question lookup (memoized)
  const questionById = useMemo(() => {
    const map = new Map<number, (typeof questions)[number]>();
    for (const q of questions) map.set(q.id, q);
    return map;
  }, [questions]);

  const selectedSummary = selectedStudent
    ? studentSummaries.find((s) => s.username === selectedStudent)
    : null;

  if (!user || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        <p className="text-slate-500 dark:text-slate-400">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Link href="/dashboard" className="text-indigo-600 dark:text-indigo-400 hover:underline">
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
              <Link href="/dashboard" className="text-xl font-bold text-slate-900 dark:text-white tracking-tight hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                Classivo
              </Link>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">
                {chapter?.title}
              </span>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">Responses</span>
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats overview */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Students</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{studentSummaries.length}</p>
          </div>
          <div className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Questions</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{questions.length}</p>
          </div>
          <div className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Answers</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{answers.length}</p>
          </div>
        </div>

        {studentSummaries.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-slate-500 dark:text-slate-400 mb-2">No student responses yet.</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Students will appear here after they answer questions in this chapter.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Student list */}
            <div className="lg:col-span-1">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Students
              </h3>
              <div className="space-y-2">
                {studentSummaries.map((student) => {
                  const pct = student.total > 0 ? Math.round((student.correct / student.total) * 100) : 0;
                  const isSelected = selectedStudent === student.username;

                  return (
                    <button
                      key={student.username}
                      onClick={() => setSelectedStudent(isSelected ? null : student.username)}
                      className={`w-full text-left rounded-xl p-4 transition cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-500'
                          : 'bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {student.username}
                        </span>
                        <span className={`text-sm font-bold ${
                          pct >= 70 ? 'text-emerald-600 dark:text-emerald-400' :
                          pct >= 40 ? 'text-amber-600 dark:text-amber-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {pct}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pct >= 70 ? 'bg-emerald-500' :
                              pct >= 40 ? 'bg-amber-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                          {student.correct}/{student.total}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Answer details */}
            <div className="lg:col-span-2">
              {selectedSummary ? (
                <>
                  <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                    {selectedSummary.username}&apos;s Answers
                  </h3>
                  <div className="space-y-3">
                    {selectedSummary.answers.map((answer) => {
                      const question = questionById.get(answer.question);
                      if (!question) return null;

                      return (
                        <div
                          key={answer.id}
                          className={`rounded-xl p-4 ring-1 ${
                            answer.is_correct
                              ? 'bg-emerald-50/50 dark:bg-emerald-900/10 ring-emerald-200 dark:ring-emerald-800'
                              : 'bg-red-50/50 dark:bg-red-900/10 ring-red-200 dark:ring-red-800'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-medium text-slate-900 dark:text-white text-sm">
                              {question.text}
                            </p>
                            <span className={`shrink-0 ml-3 text-xs font-bold px-2 py-0.5 rounded-full ${
                              answer.is_correct
                                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                            }`}>
                              {answer.is_correct ? 'Correct' : 'Wrong'}
                            </span>
                          </div>

                          <div className="grid gap-1.5 mt-3">
                            {question.options.map((opt, optIdx) => {
                              const isStudentChoice = optIdx === answer.selected_option;
                              const isCorrectOption = optIdx === question.correct;

                              let optClass = 'text-slate-500 dark:text-slate-400';
                              let indicator = '';
                              if (isCorrectOption) {
                                optClass = 'text-emerald-700 dark:text-emerald-300 font-medium';
                                indicator = ' (correct)';
                              }
                              if (isStudentChoice && !isCorrectOption) {
                                optClass = 'text-red-600 dark:text-red-400 line-through';
                                indicator = ' (selected)';
                              }
                              if (isStudentChoice && isCorrectOption) {
                                indicator = ' (selected, correct)';
                              }

                              return (
                                <div key={optIdx} className={`flex items-center gap-2 text-sm ${optClass}`}>
                                  <span className="w-5 text-center font-mono text-xs">
                                    {String.fromCharCode(65 + optIdx)}.
                                  </span>
                                  <span>{opt.text}{indicator}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full min-h-[200px]">
                  <p className="text-slate-400 dark:text-slate-500 text-sm">
                    Click a student to see their answers
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
