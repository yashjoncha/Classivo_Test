'use client';

import type { ContentBlock, Question } from '@/lib/types';
import QuestionCard from './QuestionCard';

interface ChapterReaderProps {
  title: string;
  content: ContentBlock[];
  questions?: Question[];
}

function renderTextChildren(children: Array<{ text: string; bold?: boolean; italic?: boolean; underline?: boolean }>) {
  return children.map((child, idx) => {
    if (!child.text) return null;
    let el: React.ReactNode = child.text;
    if (child.bold) el = <strong key={idx}>{el}</strong>;
    if (child.italic) el = <em key={idx}>{el}</em>;
    if (child.underline) el = <u key={idx}>{el}</u>;
    if (!child.bold && !child.italic && !child.underline) {
      el = <span key={idx}>{el}</span>;
    }
    return el;
  });
}

export default function ChapterReader({ title, content, questions = [] }: ChapterReaderProps) {
  // Build a map of question text → API question (for matching content blocks to DB records)
  const questionMap = new Map<string, Question>();
  for (const q of questions) {
    questionMap.set(q.text, q);
  }

  // Track which API question we show next (fallback if text matching fails)
  let questionIndex = 0;

  if (!content || content.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">{title}</h1>
        <p className="text-slate-500 dark:text-slate-400 italic">No content yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">{title}</h1>

      <div className="space-y-4 text-slate-700 dark:text-slate-200 leading-relaxed">
        {content.map((block, idx) => {
          if (block.type === 'question-block') {
            const raw = block as Record<string, unknown>;
            const questionText = (raw.question as string) || '';

            // Try to match with API question by text, or fall back to index order
            let apiQuestion = questionMap.get(questionText);
            if (!apiQuestion && questionIndex < questions.length) {
              apiQuestion = questions[questionIndex];
            }
            questionIndex++;

            return (
              <QuestionCard
                key={idx}
                questionId={apiQuestion?.id}
                question={apiQuestion?.text || questionText}
                options={apiQuestion?.options || (raw.options as { text: string }[]) || []}
                correctAnswerIndex={apiQuestion?.correct ?? (raw.correctAnswerIndex as number) ?? 0}
              />
            );
          }

          const children = renderTextChildren(block.children || []);

          switch (block.type) {
            case 'h1':
              return <h2 key={idx} className="text-2xl font-bold text-slate-900 dark:text-white mt-6 mb-2">{children}</h2>;
            case 'h2':
              return <h3 key={idx} className="text-xl font-bold text-slate-900 dark:text-white mt-5 mb-2">{children}</h3>;
            case 'h3':
              return <h4 key={idx} className="text-lg font-semibold text-slate-900 dark:text-white mt-4 mb-1">{children}</h4>;
            case 'ul':
              return <ul key={idx} className="list-disc list-inside ml-4">{children}</ul>;
            case 'ol':
              return <ol key={idx} className="list-decimal list-inside ml-4">{children}</ol>;
            default:
              return <p key={idx}>{children}</p>;
          }
        })}
      </div>
    </div>
  );
}
