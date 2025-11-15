import React from 'react';

function ConfirmationModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  type = 'danger',
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}) {
  if (!isOpen) return null;

  const getButtonColors = () => {
    switch (type) {
      case 'danger':
        return {
          confirm: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          cancel: 'bg-gray-300 hover:bg-gray-400 focus:ring-gray-500'
        };
      case 'warning':
        return {
          confirm: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          cancel: 'bg-gray-300 hover:bg-gray-400 focus:ring-gray-500'
        };
      case 'success':
        return {
          confirm: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
          cancel: 'bg-gray-300 hover:bg-gray-400 focus:ring-gray-500'
        };
      default:
        return {
          confirm: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          cancel: 'bg-gray-300 hover:bg-gray-400 focus:ring-gray-500'
        };
    }
  };

  const buttonColors = getButtonColors();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full transform animate-scale-in border border-gray-100 shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center mb-4">
            <div className={`w-3 h-8 rounded-full mr-3 ${
              type === 'danger' ? 'bg-red-500' :
              type === 'warning' ? 'bg-yellow-500' :
              type === 'success' ? 'bg-green-500' : 'bg-blue-500'
            }`}></div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>

          {/* Message */}
          <div className="mb-6">
            <p className="text-gray-700 leading-relaxed">{message}</p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className={`flex-1 px-4 py-3 ${buttonColors.cancel} text-gray-800 font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-50`}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-3 ${buttonColors.confirm} text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-50`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;