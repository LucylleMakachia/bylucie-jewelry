import React, { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';

function PageEditor({ content, onChange }) {
  const [view, setView] = useState('visual');
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    setWordCount(words);
  }, [content]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex space-x-4">
          {['visual', 'code'].map((tab) => (
            <button
              key={tab}
              onClick={() => setView(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                view === tab ? 'bg-[#b8860b] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{tab === 'visual' ? '🎨' : '💻'}</span>
              <span>{tab === 'visual' ? 'Visual Editor' : 'Code Editor'}</span>
            </button>
          ))}
        </div>
        <div className="text-sm text-gray-600">📝 {wordCount} words</div>
      </div>

      {view === 'visual' && (
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          rows={20}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 font-mono text-sm focus:ring-2 focus:ring-[#b8860b] focus:border-transparent"
          placeholder="Start editing your page content..."
        />
      )}

      {view === 'code' && (
        <CodeMirror
          value={content}
          height="400px"
          extensions={[javascript()]}
          theme={oneDark}
          onChange={(value, viewUpdate) => onChange(value)}
        />
      )}
    </div>
  );
}

export default PageEditor;