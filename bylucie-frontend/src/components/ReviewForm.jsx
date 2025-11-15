import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { FaStar, FaRegStar, FaTimes, FaUpload } from 'react-icons/fa';

// Get API base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export default function ReviewForm({ productId, onReviewSubmit }) {
  const { user, isSignedIn } = useUser();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  const MAX_COMMENT_LENGTH = 1000;
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_FILE_COUNT = 5;
  const ALLOWED_FILE_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/webm'
  ];

  // Email validation function
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Input sanitization
  const sanitizeInput = (input) => {
    return input.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  // File validation
  const validateFile = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`"${file.name}" is too large. Maximum size is 10MB.`);
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error(`"${file.name}" is not a supported file type. Use JPG, PNG, GIF, MP4, or WebM.`);
    }
    return true;
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    if (selectedFiles.length + files.length > MAX_FILE_COUNT) {
      setError(`You can only upload up to ${MAX_FILE_COUNT} files.`);
      return;
    }

    const validFiles = [];
    const errors = [];

    files.forEach(file => {
      try {
        validateFile(file);
        validFiles.push(file);
      } catch (err) {
        errors.push(err.message);
      }
    });

    if (errors.length > 0) {
      setError(errors.join(' '));
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      setError(''); // Clear previous errors if we have valid files
    }

    // Reset file input
    e.target.value = '';
  };

  // Remove file from selection
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Upload files to server
  const uploadFiles = async (files) => {
    const uploadedUrls = [];
    
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('productId', productId);

      try {
        const response = await fetch(`${API_BASE_URL}/api/upload`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Upload failed: ${response.status}`);
        }

        const data = await response.json();
        uploadedUrls.push({
          url: data.fileUrl,
          type: file.type.startsWith('video/') ? 'video' : 'image',
          filename: file.name
        });
      } catch (error) {
        console.error('Upload error:', error);
        throw new Error(`Failed to upload "${file.name}": ${error.message}`);
      }
    }
    
    return uploadedUrls;
  };

  // Form reset function
  const resetForm = () => {
    setRating(0);
    setComment('');
    setCharCount(0);
    setHoverRating(0);
    setError('');
    setSelectedFiles([]);
    if (!isSignedIn) {
      setUserName('');
      setUserEmail('');
    }
  };

  // Pre-fill user data if signed in
  React.useEffect(() => {
    if (isSignedIn && user) {
      setUserName(user.fullName || user.firstName || '');
      setUserEmail(user.primaryEmailAddress?.emailAddress || '');
    }
  }, [isSignedIn, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      setError('Please write a review comment');
      return;
    }

    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!userEmail.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!validateEmail(userEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (comment.length > MAX_COMMENT_LENGTH) {
      setError(`Review comment must be less than ${MAX_COMMENT_LENGTH} characters`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    // Add request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds for file uploads

    try {
      let mediaUrls = [];
      
      // Upload files if any selected
      if (selectedFiles.length > 0) {
        setIsUploading(true);
        mediaUrls = await uploadFiles(selectedFiles);
      }

      const reviewData = {
        productId,
        rating,
        comment: sanitizeInput(comment),
        userName: sanitizeInput(userName),
        userEmail: userEmail.trim().toLowerCase(),
        mediaUrls, // Add uploaded media URLs
        ...(isSignedIn && { userId: user.id })
      };

      const response = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(reviewData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || `Failed to submit review: ${response.status}`);
      }

      const newReview = responseData;
      
      // Clear form using reset function
      resetForm();
      
      // Notify parent component
      if (onReviewSubmit) {
        onReviewSubmit(newReview);
      }

    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Review submission error:', err);
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError(err.message || 'Failed to submit review. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      return (
        <button
          key={starValue}
          type="button"
          className="text-2xl transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#b8860b] focus:ring-offset-2 rounded"
          onClick={() => setRating(starValue)}
          onMouseEnter={() => setHoverRating(starValue)}
          onMouseLeave={() => setHoverRating(0)}
          disabled={isSubmitting}
          aria-label={`Rate ${starValue} out of 5 stars`}
          aria-pressed={rating === starValue}
        >
          {starValue <= (hoverRating || rating) ? (
            <FaStar className="text-yellow-400" />
          ) : (
            <FaRegStar className="text-gray-300" />
          )}
        </button>
      );
    });
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        {isSignedIn ? 'Write a Review' : 'Write a Review as a Guest'}
      </h3>
      
      {isSignedIn && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-blue-700 text-sm">
            You're signed in as <strong>{userName}</strong>. Your review will be linked to your account.
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Rating *
          </label>
          <div className="flex items-center space-x-2">
            {renderStars()}
            <span className="ml-2 text-sm text-gray-600">
              {rating > 0 ? `${rating} star${rating > 1 ? 's' : ''}` : 'Select rating'}
            </span>
          </div>
        </div>

        {/* Name Field - Show for all users, pre-filled if signed in */}
        <div>
          <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
            Your Name *
          </label>
          <input
            id="userName"
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b8860b] focus:border-transparent"
            disabled={isSubmitting || isSignedIn}
            required
          />
          {isSignedIn && (
            <p className="text-xs text-gray-500 mt-1">
              This is pre-filled from your account. Contact support to update.
            </p>
          )}
        </div>

        {/* Email Field - Show for all users, pre-filled if signed in */}
        <div>
          <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 mb-2">
            Your Email *
          </label>
          <input
            id="userEmail"
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b8860b] focus:border-transparent"
            disabled={isSubmitting || isSignedIn}
            required
          />
          {isSignedIn && (
            <p className="text-xs text-gray-500 mt-1">
              This is pre-filled from your account. Contact support to update.
            </p>
          )}
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Your Review *
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              setCharCount(e.target.value.length);
            }}
            placeholder="Share your experience with this product..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b8860b] focus:border-transparent resize-none"
            disabled={isSubmitting}
            required
            maxLength={MAX_COMMENT_LENGTH}
          />
          <div className={`text-xs mt-1 ${
            charCount > MAX_COMMENT_LENGTH * 0.9 ? 'text-red-600' : 'text-gray-500'
          }`}>
            {charCount}/{MAX_COMMENT_LENGTH}
          </div>
        </div>

        {/* File Upload Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Photos/Videos (Optional)
          </label>
          <div className="space-y-3">
            {/* File Input */}
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FaUpload className="w-8 h-8 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF, MP4, WebM (MAX. 10MB each)
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Up to {MAX_FILE_COUNT} files
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  disabled={isSubmitting || selectedFiles.length >= MAX_FILE_COUNT}
                  className="hidden"
                />
              </label>
            </div>

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group bg-gray-50 rounded-lg p-2 border">
                    {file.type.startsWith('image/') ? (
                      <div className="aspect-square relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover rounded-md"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square relative bg-black rounded-md flex items-center justify-center">
                        <video className="w-full h-full object-cover rounded-md">
                          <source src={URL.createObjectURL(file)} type={file.type} />
                        </video>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                            <span className="text-white text-lg">▶</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      disabled={isSubmitting}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-90 hover:opacity-100 transition-opacity shadow-md"
                      aria-label={`Remove ${file.name}`}
                    >
                      <FaTimes />
                    </button>
                    <div className="mt-2 text-xs text-gray-600 truncate" title={file.name}>
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* File Count */}
            {selectedFiles.length > 0 && (
              <div className="text-sm text-gray-600">
                {selectedFiles.length} of {MAX_FILE_COUNT} files selected
              </div>
            )}
          </div>
        </div>

        {/* Info Message */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-700 text-sm">
            Your review will be submitted for approval before appearing on the site.
            {!isSignedIn && ' As a guest, you can track your review status using your email.'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="bg-[#b8860b] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#997500] disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full flex items-center justify-center"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Uploading Files...
            </>
          ) : isSubmitting ? (
            'Submitting Review...'
          ) : (
            'Submit Review'
          )}
        </button>
      </form>
    </div>
  );
}