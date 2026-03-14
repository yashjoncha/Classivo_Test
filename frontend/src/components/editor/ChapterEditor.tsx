'use client';

import { useState, useCallback, useId } from 'react';
import type { Value } from 'platejs';
import {
  Plate,
  PlateContent,
  PlateElement,
  PlateLeaf,
  usePlateEditor,
  useEditorRef,
  createPlatePlugin,
} from 'platejs/react';
import {
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
} from '@platejs/basic-nodes/react';
import { ListPlugin } from '@platejs/list/react';
import type { ContentBlock, QuestionOption } from '@/lib/types';

// ─── Props (same contract as before) ───────────────────────────
interface ChapterEditorProps {
  initialTitle?: string;
  initialContent?: ContentBlock[];
  onSave: (title: string, content: ContentBlock[]) => void;
  loading?: boolean;
}

// ─── Question Block Plugin ─────────────────────────────────────
// This makes question blocks a "void" element in Slate.
// Void = Slate won't try to edit its internals, we control the UI.
const QuestionBlockPlugin = createPlatePlugin({
  key: 'question-block',
  node: {
    type: 'question-block',
    isElement: true,
    isVoid: true,
  },
});

// ─── Convert ContentBlock[] → Slate Value ──────────────────────
function contentToSlateValue(content?: ContentBlock[]): Value {
  if (!content || content.length === 0) {
    return [{ type: 'p', children: [{ text: '' }] }];
  }
  return content.map((block) => {
    if (block.type === 'question-block') {
      const raw = block as Record<string, unknown>;
      return {
        type: 'question-block',
        question: (raw.question as string) || '',
        options: (raw.options as QuestionOption[]) || [
          { text: '' }, { text: '' }, { text: '' }, { text: '' },
        ],
        correctAnswerIndex: (raw.correctAnswerIndex as number) || 0,
        children: [{ text: '' }],
      };
    }
    return {
      type: block.type || 'p',
      children:
        block.children && block.children.length > 0
          ? block.children.map((child) => ({
              text: child.text || '',
              ...(child.bold ? { bold: true } : {}),
              ...(child.italic ? { italic: true } : {}),
              ...(child.underline ? { underline: true } : {}),
            }))
          : [{ text: '' }],
    };
  }) as Value;
}

// ─── Convert Slate Value → ContentBlock[] ──────────────────────
function slateValueToContent(value: Value): ContentBlock[] {
  return (value as Array<Record<string, unknown>>).map((node) => {
    if (node.type === 'question-block') {
      return {
        type: 'question-block',
        question: node.question as string,
        options: node.options as QuestionOption[],
        correctAnswerIndex: node.correctAnswerIndex as number,
        children: [{ text: '' }],
      } as ContentBlock;
    }
    return {
      type: (node.type as string) || 'p',
      children: (
        node.children as Array<{
          text: string;
          bold?: boolean;
          italic?: boolean;
          underline?: boolean;
        }>
      ).map((child) => {
        const result: {
          text: string;
          bold?: boolean;
          italic?: boolean;
          underline?: boolean;
        } = { text: child.text || '' };
        if (child.bold) result.bold = true;
        if (child.italic) result.italic = true;
        if (child.underline) result.underline = true;
        return result;
      }),
    };
  });
}

// ─── Slate editor type for toolbar operations ─────────────────
interface SlateEditor {
  getMarks: () => Record<string, unknown> | null;
  addMark: (key: string, value: unknown) => void;
  removeMark: (key: string) => void;
  above: (options?: Record<string, unknown>) => [Record<string, unknown>, number[]] | undefined;
  setNodes: (props: Record<string, unknown>, options?: Record<string, unknown>) => void;
  insertNodes: (nodes: Record<string, unknown> | Record<string, unknown>[]) => void;
}

// ─── Toolbar ───────────────────────────────────────────────────
function Toolbar() {
  const editorRef = useEditorRef();
  const editor = editorRef as unknown as SlateEditor;

  const toggleMark = (mark: string) => {
    const marks = editor.getMarks();
    if (marks && marks[mark]) {
      editor.removeMark(mark);
    } else {
      editor.addMark(mark, true);
    }
  };

  const toggleBlock = (type: string) => {
    const entry = editor.above({ match: (n: Record<string, unknown>) => n.type !== undefined });
    const isActive = entry && entry[0].type === type;
    editor.setNodes(
      { type: isActive ? 'p' : type },
      { match: (n: Record<string, unknown>) => n.type !== undefined }
    );
  };

  const insertQuestionBlock = () => {
    editor.insertNodes({
      type: 'question-block',
      question: '',
      options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
      correctAnswerIndex: 0,
      children: [{ text: '' }],
    });
  };

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 mb-4 shadow-sm">
      {/* Marks */}
      <button type="button" onClick={() => toggleMark('bold')} className="px-2.5 py-1.5 text-sm font-bold rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer" title="Bold (Ctrl+B)">B</button>
      <button type="button" onClick={() => toggleMark('italic')} className="px-2.5 py-1.5 text-sm italic rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer" title="Italic (Ctrl+I)">I</button>
      <button type="button" onClick={() => toggleMark('underline')} className="px-2.5 py-1.5 text-sm underline rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer" title="Underline (Ctrl+U)">U</button>

      <div className="w-px h-6 bg-slate-200 dark:bg-slate-600 mx-1" />

      {/* Block types */}
      <button type="button" onClick={() => toggleBlock('h1')} className="px-2.5 py-1.5 text-sm rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer font-bold" title="Heading 1">H1</button>
      <button type="button" onClick={() => toggleBlock('h2')} className="px-2.5 py-1.5 text-sm rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer font-bold" title="Heading 2">H2</button>
      <button type="button" onClick={() => toggleBlock('h3')} className="px-2.5 py-1.5 text-sm rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer font-bold" title="Heading 3">H3</button>

      <div className="w-px h-6 bg-slate-200 dark:bg-slate-600 mx-1" />

      {/* Question block - inserts at cursor position */}
      <button type="button" onClick={insertQuestionBlock} className="px-3 py-1.5 text-sm rounded bg-brand-50 dark:bg-brand-900/30 text-brand-500 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/50 font-medium transition cursor-pointer">+ Insert Question</button>
    </div>
  );
}

// ─── Question Block Element (rendered inside Slate) ────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function QuestionBlockElement({ attributes, children, element }: any) {
  const stableId = useId();
  const editorRef = useEditorRef();
  const editor = editorRef as unknown as {
    setNodes: (props: Record<string, unknown>, options?: Record<string, unknown>) => void;
    removeNodes: (options?: Record<string, unknown>) => void;
  };
  const node = element as {
    question: string;
    options: QuestionOption[];
    correctAnswerIndex: number;
  };

  const updateField = (updates: Record<string, unknown>) => {
    const path = (editorRef as unknown as { findPath: (node: unknown) => number[] }).findPath(element);
    editor.setNodes(updates, { at: path });
  };

  const deleteBlock = () => {
    const path = (editorRef as unknown as { findPath: (node: unknown) => number[] }).findPath(element);
    editor.removeNodes({ at: path });
  };

  return (
    <div {...attributes} contentEditable={false}>
      {/* Slate requires children even for void nodes */}
      <div className="hidden">{children}</div>

      <div className="border-l-4 border-brand-500 bg-brand-50/50 dark:bg-brand-900/20 rounded-r-lg p-4 my-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-brand-500 dark:text-brand-400">
            Question Block
          </span>
          <button
            type="button"
            onClick={deleteBlock}
            className="text-red-500 hover:text-red-700 text-sm cursor-pointer p-1"
            title="Delete question"
          >
            &#10005;
          </button>
        </div>

        <input
          type="text"
          value={node.question || ''}
          onChange={(e) => updateField({ question: e.target.value })}
          placeholder="Enter your question..."
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 mb-3"
        />

        <div className="space-y-2">
          {(node.options || []).map((opt: QuestionOption, idx: number) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="radio"
                name={`correct-${stableId}`}
                checked={node.correctAnswerIndex === idx}
                onChange={() => updateField({ correctAnswerIndex: idx })}
                className="text-brand-500 cursor-pointer"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400 w-4">
                {String.fromCharCode(65 + idx)}.
              </span>
              <input
                type="text"
                value={opt.text}
                onChange={(e) => {
                  const newOptions = [...node.options];
                  newOptions[idx] = { text: e.target.value };
                  updateField({ options: newOptions });
                }}
                placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                className="flex-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2.5 py-1.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          ))}
        </div>

        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Select the radio button next to the correct answer.
        </p>
      </div>
    </div>
  );
}

// ─── Custom render components for Plate ────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ParagraphElement(props: any) {
  return <PlateElement {...props} as="p" className="text-base text-slate-900 dark:text-white mb-1" />;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function H1Element(props: any) {
  return <PlateElement {...props} as="h1" className="text-3xl font-bold text-slate-900 dark:text-white mb-2" />;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function H2Element(props: any) {
  return <PlateElement {...props} as="h2" className="text-2xl font-bold text-slate-900 dark:text-white mb-2" />;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function H3Element(props: any) {
  return <PlateElement {...props} as="h3" className="text-xl font-semibold text-slate-900 dark:text-white mb-1" />;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BoldLeaf(props: any) {
  return <PlateLeaf {...props} as="strong" />;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ItalicLeaf(props: any) {
  return <PlateLeaf {...props} as="em" />;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function UnderlineLeaf(props: any) {
  return <PlateLeaf {...props} as="u" />;
}

// ─── Main Editor Component ─────────────────────────────────────
export default function ChapterEditor({
  initialTitle = '',
  initialContent,
  onSave,
  loading = false,
}: ChapterEditorProps) {
  const [title, setTitle] = useState(initialTitle);

  const editor = usePlateEditor({
    plugins: [
      BoldPlugin,
      ItalicPlugin,
      UnderlinePlugin,
      H1Plugin,
      H2Plugin,
      H3Plugin,
      ListPlugin,
      QuestionBlockPlugin,
    ],
    value: contentToSlateValue(initialContent),
    override: {
      components: {
        p: ParagraphElement,
        h1: H1Element,
        h2: H2Element,
        h3: H3Element,
        bold: BoldLeaf,
        italic: ItalicLeaf,
        underline: UnderlineLeaf,
        'question-block': QuestionBlockElement,
      },
    },
  });

  const handleSave = useCallback(() => {
    const content = slateValueToContent(editor.children as Value);
    onSave(title, content);
  }, [editor, title, onSave]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Chapter title..."
        className="w-full text-3xl font-bold border-0 border-b-2 border-slate-200 dark:border-slate-700 bg-transparent px-0 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 transition mb-6"
      />

      {/* Plate Editor */}
      <Plate editor={editor}>
        <Toolbar />

        <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 min-h-[400px]">
          <PlateContent
            placeholder="Start writing your chapter..."
            className="outline-none min-h-[360px] text-slate-900 dark:text-white [&_*]:outline-none"
          />
        </div>
      </Plate>

      {/* Save button */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || !title.trim()}
          className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Chapter'}
        </button>
      </div>
    </div>
  );
}
