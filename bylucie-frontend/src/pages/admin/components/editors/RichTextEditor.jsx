import React, { useState, useEffect } from 'react';

function RichTextEditor({ value, onChange, onMediaAdd }) {
  const [content, setContent] = useState(value);

  useEffect(() => {
    setContent(value);
  }, [value]);

  const handleChange = (newContent) => {
    setContent(newContent);
    onChange(newContent);
  };

  const addFormatting = (format) => {
    const textarea = document.getElementById('editor-textarea');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let newText = content;
    switch (format) {
      case 'bold':
        newText = content.substring(0, start) + `**${selectedText}**` + content.substring(end);
        break;
      case 'italic':
        newText = content.substring(0, start) + `*${selectedText}*` + content.substring(end);
        break;
      case 'heading':
        newText = content.substring(0, start) + `\n## ${selectedText}\n` + content.substring(end);
        break;
      case 'link':
        const url = prompt('Enter URL:');
        if (url) {
          newText = content.substring(0, start) + `[${selectedText}](${url})` + content.substring(end);
        }
        break;
      case 'image':
        onMediaAdd('image');
        break;
      case 'video':
        onMediaAdd('video');
        break;
      default:
        break;
    }
    
    if (format !== 'image' && format !== 'video') {
      handleChange(newText);
      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, end);
      }, 0);
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
        <button
          onClick={() => addFormatting('bold')}
          className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-200"
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => addFormatting('italic')}
          className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-200"
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => addFormatting('heading')}
          className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-200"
          title="Heading"
        >
          H2
        </button>
        <button
          onClick={() => addFormatting('link')}
          className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-200"
          title="Link"
        >
          Link
        </button>
        <button
          onClick={() => addFormatting('image')}
          className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-200"
          title="Add Image"
        >
          📷
        </button>
        <button
          onClick={() => addFormatting('video')}
          className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-200"
          title="Add Video"
        >
          🎥
        </button>
      </div>
      <textarea
        id="editor-textarea"
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full h-64 p-4 focus:outline-none resize-vertical"
        placeholder="Start writing your content here..."
      />
      <div className="bg-gray-50 border-t border-gray-300 p-2 text-sm text-gray-600">
        Supports Markdown: **bold**, *italic*, [links](url), ## headings, images, and videos
      </div>
    </div>
  );
}

export default RichTextEditor;