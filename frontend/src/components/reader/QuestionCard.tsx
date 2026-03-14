'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';
import type { QuestionOption, Answer } from '@/lib/types';

interface QuestionCardProps {
  questionId?: number;
  question: string;
  options: QuestionOption[];
  correctAnswerIndex: number;
}

export default function QuestionCard({ questionId, question, options, correctAnswerIndex }: QuestionCardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyAnswered, setAlreadyAnswered] = useState(false);

  const isCorrect = selectedIndex === correctAnswerIndex;

  const handleCheck = async () => {
    if (selectedIndex === null) return;
    setChecked(true);

    // Submit answer to API if we have a question ID
    if (questionId) {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      setSubmitting(true);
      try {
        await apiClient<Answer>('/answers/', {
          method: 'POST',
          token,
          body: JSON.stringify({
            question: questionId,
            selected_option: selectedIndex,
          }),
        });
      } catch (err) {
        const message = (err as Error).message;
        if (message.includes('already answered')) {
          setAlreadyAnswered(true);
        }
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleReset = () => {
    setSelectedIndex(null);
    setChecked(false);
    setAlreadyAnswered(false);
  };

  return (
    <div className="border-l-4 border-brand-500 bg-brand-50/50 dark:bg-brand-900/20 rounded-r-lg p-5 my-4">
      <p className="text-base font-semibold text-slate-900 dark:text-white mb-3">{question}</p>

      <div className="space-y-2">
        {options.map((opt, idx) => {
          let optionClass = 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700';
          if (checked) {
            if (idx === correctAnswerIndex) {
              optionClass = 'border-green-400 bg-green-50 dark:bg-green-900/30';
            } else if (idx === selectedIndex && !isCorrect) {
              optionClass = 'border-red-400 bg-red-50 dark:bg-red-900/30';
            }
          } else if (idx === selectedIndex) {
            optionClass = 'border-brand-400 bg-brand-50 dark:bg-brand-900/30';
          }

          return (
            <label
              key={idx}
              className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 cursor-pointer transition ${optionClass}`}
            >
              <input
                type="radio"
                name={`q-${questionId || question}`}
                checked={selectedIndex === idx}
                onChange={() => { if (!checked) setSelectedIndex(idx); }}
                disabled={checked}
                className="text-brand-500"
              />
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400 w-5">
                {String.fromCharCode(65 + idx)}.
              </span>
              <span className="text-sm text-slate-700 dark:text-slate-200">{opt.text}</span>
              {checked && idx === correctAnswerIndex && (
                <span className="ml-auto text-green-600 dark:text-green-400 text-xs font-semibold">Correct</span>
              )}
              {checked && idx === selectedIndex && !isCorrect && (
                <span className="ml-auto text-red-600 dark:text-red-400 text-xs font-semibold">Incorrect</span>
              )}
            </label>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-3">
        {!checked ? (
          <button
            type="button"
            onClick={handleCheck}
            disabled={selectedIndex === null || submitting}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Check Answer'}
          </button>
        ) : (
          <>
            <span className={`text-sm font-semibold ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isCorrect ? 'Correct!' : 'Wrong answer.'}
            </span>
            {alreadyAnswered && (
              <span className="text-xs text-slate-400">Already submitted</span>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
