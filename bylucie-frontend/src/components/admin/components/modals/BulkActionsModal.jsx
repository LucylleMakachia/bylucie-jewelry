import React, { useState } from 'react';
import { FaBoxes, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';

function BulkActionsModal({ 
  visible, 
  type, // 'products', 'reviews', 'orders'
  selectedItems = [],
  onClose, 
  onConfirm,
  loading = false 
}) {
  const [action, setAction] = useState('');

  if (!visible) return null;

  const getModalConfig = () => {
    switch (type) {
      case 'products':
        return {
          title: 'Bulk Product Actions',
          icon: FaBoxes,
          actions: [
            { value: 'activate', label: 'Activate Products', icon: FaCheck, color: 'green' },
            { value: 'deactivate', label: 'Deactivate Products', icon: FaTimes, color: 'yellow' },
            { value: 'delete', label: 'Delete Products', icon: FaTrash, color: 'red' }
          ]
        };
      case 'reviews':
        return {
          title: 'Bulk Review Actions',
          icon: FaBoxes,
          actions: [
            { value: 'approve', label: 'Approve Reviews', icon: FaCheck, color: 'green' },
            { value: 'reject', label: 'Reject Reviews', icon: FaTimes, color: 'red' },
            { value: 'delete', label: 'Delete Reviews', icon: FaTrash, color: 'red' }
          ]
        };
      case 'orders':
        return {
          title: 'Bulk Order Actions',
          icon: FaBoxes,
          actions: [
            { value: 'process', label: 'Mark as Processing', icon: FaCheck, color: 'blue' },
            { value: 'ship', label: 'Mark as Shipped', icon: FaCheck, color: 'purple' },
            { value: 'cancel', label: 'Cancel Orders', icon: FaTimes, color: 'red' }
          ]
        };
      default:
        return {
          title: 'Bulk Actions',
          icon: FaBoxes,
          actions: []
        };
    }
  };

  const getActionDescription = () => {
    switch (action) {
      case 'delete':
        return `This will permanently delete ${selectedItems.length} ${type}. This action cannot be undone.`;
      case 'activate':
        return `This will activate ${selectedItems.length} ${type} and make them available to customers.`;
      case 'deactivate':
        return `This will deactivate ${selectedItems.length} ${type} and hide them from customers.`;
      case 'approve':
        return `This will approve ${selectedItems.length} reviews and make them visible on your site.`;
      case 'reject':
        return `This will reject ${selectedItems.length} reviews and mark them as not approved.`;
      case 'process':
        return `This will mark ${selectedItems.length} orders as processing.`;
      case 'ship':
        return `This will mark ${selectedItems.length} orders as shipped.`;
      case 'cancel':
        return `This will cancel ${selectedItems.length} orders.`;
      default:
        return `Select an action to perform on ${selectedItems.length} ${type}.`;
    }
  };

  const getConfirmButtonColor = () => {
    const actionConfig = getModalConfig().actions.find(a => a.value === action);
    if (!actionConfig) return 'bg-gray-500 hover:bg-gray-600';
    
    switch (actionConfig.color) {
      case 'red': return 'bg-red-600 hover:bg-red-700';
      case 'green': return 'bg-green-600 hover:bg-green-700';
      case 'blue': return 'bg-blue-600 hover:bg-blue-700';
      case 'purple': return 'bg-purple-600 hover:bg-purple-700';
      case 'yellow': return 'bg-yellow-600 hover:bg-yellow-700';
      default: return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  const modalConfig = getModalConfig();
  const IconComponent = modalConfig.icon;

  const handleConfirm = () => {
    if (action && onConfirm) {
      onConfirm(action, selectedItems);
      setAction('');
    }
  };

  const handleClose = () => {
    setAction('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full transform animate-scale-in border border-gray-100 shadow-2xl">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-[#b8860b] to-[#daa520] rounded-xl flex items-center justify-center mr-4">
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{modalConfig.title}</h2>
              <p className="text-gray-600">{selectedItems.length} items selected</p>
            </div>
          </div>

          {/* Action Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Select Action
            </label>
            <div className="grid grid-cols-1 gap-3">
              {modalConfig.actions.map((actionItem) => {
                const ActionIcon = actionItem.icon;
                return (
                  <button
                    key={actionItem.value}
                    onClick={() => setAction(actionItem.value)}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      action === actionItem.value
                        ? 'border-[#b8860b] bg-amber-50'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <ActionIcon className={`w-5 h-5 ${
                        actionItem.color === 'red' ? 'text-red-600' :
                        actionItem.color === 'green' ? 'text-green-600' :
                        actionItem.color === 'blue' ? 'text-blue-600' :
                        actionItem.color === 'purple' ? 'text-purple-600' :
                        'text-yellow-600'
                      }`} />
                      <span className="font-semibold text-gray-900">{actionItem.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Description */}
          {action && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-gray-700 text-sm leading-relaxed">
                {getActionDescription()}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 bg-gray-300 text-gray-800 font-semibold rounded-xl hover:bg-gray-400 transition-all duration-200 transform hover:scale-105"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!action || loading}
              className={`flex-1 px-4 py-3 ${getConfirmButtonColor()} text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Processing...' : 'Confirm Action'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BulkActionsModal;