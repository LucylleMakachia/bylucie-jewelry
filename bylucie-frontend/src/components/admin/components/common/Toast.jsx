import React, { useEffect } from 'react';

function Toast({ message, type = 'info', onClose }) {
  const bgColor = {
    success: 'bg-gradient-to-r from-green-500 to-green-600',
    error: 'bg-gradient-to-r from-red-500 to-red-600',
    warning: 'bg-gradient-to-r from-amber-500 to-amber-600',
    info: 'bg-gradient-to-r from-blue-500 to-blue-600',
  }[type];

  const icon = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: '💡',
  }[type];

  const progressColor = {
    success: 'bg-green-400',
    error: 'bg-red-400',
    warning: 'bg-amber-400',
    info: 'bg-blue-400',
  }[type];

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${bgColor} text-white p-4 rounded-xl shadow-2xl mb-3 flex flex-col transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border-l-4 ${type === 'success' ? 'border-l-green-300' : type === 'error' ? 'border-l-red-300' : type === 'warning' ? 'border-l-amber-300' : 'border-l-blue-300'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-xl mr-3 animate-pulse">{icon}</span>
          <div>
            <span className="font-semibold text-white text-shadow">{message}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-white hover:text-gray-200 transition-colors transform hover:scale-110"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="w-full bg-white bg-opacity-30 rounded-full h-1 mt-3">
        <div className={`${progressColor} h-1 rounded-full transition-all duration-5000 ease-linear`} style={{ width: '100%' }}></div>
      </div>
    </div>
  );
}

export default Toast;