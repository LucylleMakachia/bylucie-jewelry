import React from 'react';
import { FaTimes, FaDownload, FaExpand } from 'react-icons/fa';

function ImagePreviewModal({ 
  visible, 
  media, 
  onClose 
}) {
  if (!visible || !media) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = media.url;
    link.download = `review-media-${Date.now()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFullscreen = () => {
    const elem = document.querySelector('.media-preview-content');
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors transform hover:scale-110"
        >
          <FaTimes className="w-8 h-8" />
        </button>

        {/* Action Buttons */}
        <div className="absolute top-4 left-4 z-10 flex space-x-3">
          <button
            onClick={handleDownload}
            className="bg-white bg-opacity-20 text-white p-3 rounded-xl hover:bg-opacity-30 transition-all transform hover:scale-110 backdrop-blur-sm"
            title="Download"
          >
            <FaDownload className="w-5 h-5" />
          </button>
          <button
            onClick={handleFullscreen}
            className="bg-white bg-opacity-20 text-white p-3 rounded-xl hover:bg-opacity-30 transition-all transform hover:scale-110 backdrop-blur-sm"
            title="Fullscreen"
          >
            <FaExpand className="w-5 h-5" />
          </button>
        </div>

        {/* Media Content */}
        <div className="media-preview-content bg-black rounded-2xl overflow-hidden max-w-full max-h-full">
          {media.type === 'image' ? (
            <img
              src={media.url}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
            />
          ) : media.type === 'video' ? (
            <video
              src={media.url}
              controls
              className="max-w-full max-h-full"
              autoPlay
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="w-96 h-96 flex items-center justify-center text-white">
              <p>Unsupported media type</p>
            </div>
          )}
        </div>

        {/* Media Info */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-xl backdrop-blur-sm">
          <p className="text-sm">
            {media.type?.toUpperCase()} • {media.caption || 'No caption'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ImagePreviewModal;