import React from 'react';
import Toast from './Toast';

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-6 right-6 z-50 max-w-sm w-full space-y-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

export default ToastContainer;