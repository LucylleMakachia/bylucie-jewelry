import React, { useState, useEffect } from 'react';

function MediaUploadModal({ visible, onClose, onAdd, type }) {
  const [url, setUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (visible) {
      setUrl('');
      setAltText('');
      setFile(null);
    }
  }, [visible]);

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Check file type
      if (type === 'image' && !selectedFile.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (type === 'video' && !selectedFile.type.startsWith('video/')) {
        alert('Please select a video file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFile({
          name: selectedFile.name,
          type: selectedFile.type,
          data: reader.result
        });
        setUrl(reader.result); // Set URL for preview
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = () => {
    if (!url && !file) {
      alert('Please provide a URL or upload a file');
      return;
    }

    const mediaUrl = url || file.data;
    let markdown = '';

    if (type === 'image') {
      markdown = `![${altText || 'image'}](${mediaUrl})`;
    } else {
      markdown = `<video controls><source src="${mediaUrl}" type="${file?.type || 'video/mp4'}">Your browser does not support the video tag.</video>`;
    }

    onAdd(markdown);
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4">Add {type === 'image' ? 'Image' : 'Video'}</h3>
          
          <div className="space-y-4">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Upload {type === 'image' ? 'Image' : 'Video'}
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept={type === 'image' ? 'image/*' : 'video/*'}
                  onChange={handleFileUpload}
                  className="hidden"
                  id="media-upload"
                />
                <label
                  htmlFor="media-upload"
                  className="bg-[#b8860b] text-white px-4 py-2 rounded cursor-pointer hover:bg-[#997500] inline-block"
                >
                  Choose File
                </label>
                {file && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selected: {file.name}
                  </div>
                )}
              </div>
            </div>

            {/* OR separator */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>

            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {type === 'image' ? 'Image' : 'Video'} URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#b8860b]"
                placeholder={`Enter ${type} URL`}
              />
            </div>

            {/* Alt Text for Images */}
            {type === 'image' && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Alt Text (Optional)
                </label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#b8860b]"
                  placeholder="Describe the image"
                />
              </div>
            )}

            {/* Preview */}
            {(url || file) && (
              <div>
                <label className="block text-sm font-medium mb-1">Preview</label>
                <div className="border border-gray-300 rounded p-2">
                  {type === 'image' ? (
                    <img 
                      src={url || file.data} 
                      alt="Preview" 
                      className="max-w-full h-auto max-h-32 object-contain"
                    />
                  ) : (
                    <video 
                      controls 
                      className="max-w-full h-auto max-h-32"
                    >
                      <source src={url || file.data} type={file?.type || 'video/mp4'} />
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="bg-[#b8860b] text-white px-6 py-2 rounded hover:bg-[#997500]"
            >
              Add {type === 'image' ? 'Image' : 'Video'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MediaUploadModal;