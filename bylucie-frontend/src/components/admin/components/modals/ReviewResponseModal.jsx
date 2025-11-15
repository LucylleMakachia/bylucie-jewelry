import React, { useState } from 'react';

function ReviewResponseModal({ 
  visible, 
  review, 
  onClose, 
  onRespond,
  loading = false 
}) {
  const [response, setResponse] = useState('');

  if (!visible || !review) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (response.trim() && onRespond) {
      onRespond(review._id || review.id, response.trim());
      setResponse('');
    }
  };

  const handleClose = () => {
    setResponse('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full transform animate-scale-in border border-gray-100 shadow-2xl">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-[#b8860b] to-[#daa520] bg-clip-text text-transparent">
              Respond to Review
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 transition-colors transform hover:scale-110"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Review Preview */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Review Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">{review.userName}</p>
                  <p className="text-gray-600 text-sm">{review.userEmail}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    review.status === 'approved' 
                      ? 'bg-green-100 text-green-800' 
                      : review.status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {review.status || 'pending'}
                  </span>
                </div>
              </div>
              
              {review.comment && (
                <div className="mt-3">
                  <p className="text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                    "{review.comment}"
                  </p>
                </div>
              )}

              <div className="text-sm text-gray-500">
                Product: {review.productId?.name || 'Unknown Product'} • 
                Posted: {new Date(review.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Response Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Admin Response
                <span className="text-gray-500 text-sm font-normal ml-2">
                  (This response will be visible to the customer)
                </span>
              </label>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows="6"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b8860b] focus:border-transparent transition-all resize-vertical"
                placeholder="Type your response to the customer here. You can thank them for their feedback, address concerns, or provide additional information..."
                required
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">
                  {response.length}/500 characters
                </span>
                {response.length > 500 && (
                  <span className="text-sm text-red-600">
                    Response too long
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !response.trim() || response.length > 500}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-[#b8860b] to-[#daa520] text-white font-semibold rounded-xl hover:from-[#daa520] hover:to-[#b8860b] transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Response'}
              </button>
            </div>
          </form>

          {/* Tips */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Response Tips</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Be professional and courteous</li>
              <li>• Thank the customer for their feedback</li>
              <li>• Address specific concerns mentioned in the review</li>
              <li>• Keep responses helpful and constructive</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReviewResponseModal;