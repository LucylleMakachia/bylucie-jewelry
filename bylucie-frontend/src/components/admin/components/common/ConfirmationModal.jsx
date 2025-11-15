import React from 'react';

function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel, confirmText = "Delete", cancelText = "Cancel", type = "danger" }) {
  if (!isOpen) return null;

  const modalConfig = {
    danger: {
      icon: '🗑️',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      buttonBg: 'bg-red-600 hover:bg-red-700',
      buttonText: 'text-white',
      accentColor: 'border-red-200'
    },
    warning: {
      icon: '⚠️',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      buttonBg: 'bg-amber-600 hover:bg-amber-700',
      buttonText: 'text-white',
      accentColor: 'border-amber-200'
    },
    success: {
      icon: '✅',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      buttonBg: 'bg-green-600 hover:bg-green-700',
      buttonText: 'text-white',
      accentColor: 'border-green-200'
    }
  }[type];

  const config = modalConfig || modalConfig.danger;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl transform animate-scale-in border border-gray-100">
        <div className="text-center">
          <div className={`w-20 h-20 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
            <span className="text-3xl">{config.icon}</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
          <p className="text-gray-600 mb-8 text-lg leading-relaxed">{message}</p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-6 py-4 ${config.buttonBg} ${config.buttonText} rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;