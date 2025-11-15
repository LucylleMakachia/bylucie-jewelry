import React from 'react';

function MarkdownPreview({ content }) {
  const parseMarkdown = (text) => {
    if (!text) return '';
    
    // Convert markdown to HTML
    let html = text
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      // Links
      .replace(/\[([^\[]+)\]\(([^\)]+)\)/gim, '<a href="$2" class="text-[#b8860b] hover:underline">$1</a>')
      // Images
      .replace(/!\[([^\]]*)\]\(([^\)]+)\)/gim, '<img src="$2" alt="$1" class="max-w-full h-auto my-2 rounded" />')
      // Line breaks
      .replace(/\n$/gim, '<br />');

    // Handle video tags (already in HTML)
    html = html.replace(/&lt;video controls&gt;&lt;source src="([^"]+)"[^&]*&gt;.*?&lt;\/video&gt;/gim, 
      '<video controls class="max-w-full h-auto my-2"><source src="$1">Your browser does not support the video tag.</video>');

    return html;
  };

  return (
    <div 
      className="prose max-w-none p-4 bg-white border border-gray-300 rounded-lg min-h-64"
      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
    />
  );
}

export default MarkdownPreview;