import React, { useState, useEffect } from 'react';
import { useSignUp } from '@clerk/clerk-react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { MdVerified } from 'react-icons/md';

export default function Verify() {
  const { signUp, isLoaded, setActive } = useSignUp();
  const navigate = useNavigate();
  const location = useLocation();
  const usePhone = location.state?.usePhone || false;

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!isLoaded || !signUp) {
      navigate('/sign-up');
    }
  }, [isLoaded, signUp, navigate]);

  const handleVerification = async (e) => {
    e.preventDefault();

    if (!code.trim()) {
      setError('Please enter the verification code');
      return;
    }

    if (!isLoaded || !signUp) {
      setError('Verification not ready');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Attempt verification based on method used
      const result = usePhone
        ? await signUp.attemptPhoneNumberVerification({ code })
        : await signUp.attemptEmailAddressVerification({ code });


      // If verification successful and session created, activate it
      if (result.status === 'complete') {
        if (result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
          navigate('/');
        } else {
          setError('Account created but session failed. Please try signing in.');
          setTimeout(() => navigate('/sign-in'), 2000);
        }
      } else {
        setError(`Verification status: ${result.status}. Please try again or contact support.`);
      }
    } catch (err) {
      
      const errorMessage = err.errors?.[0]?.message || err.message;
      
      // Handle specific error cases
      if (errorMessage?.includes('already been verified')) {
        setError('This account is already verified. Redirecting to sign in...');
        setTimeout(() => navigate('/sign-in'), 2000);
      } else {
        setError(errorMessage || 'Invalid verification code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || !signUp) return;

    setResending(true);
    setError('');
    setResendSuccess(false);

    try {
      await signUp.prepareVerification({
        strategy: usePhone ? 'phone_code' : 'email_code'
      });
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setCode(value);
    }
  };

  if (!isLoaded) {
    return (
      <div className="max-w-md mx-auto mt-24 p-8 text-center">
        <div className="text-[#b8860b] text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-24 p-8 bg-white rounded-lg shadow-md border border-[#b8860b]">
      <div className="flex justify-center mb-6">
        <div className="bg-[#b8860b] bg-opacity-10 rounded-full p-4">
          <MdVerified size={48} className="text-[#b8860b]" />
        </div>
      </div>

      <h1 className="text-3xl font-serif font-semibold mb-3 text-[#b8860b] text-center">
        Verify Your {usePhone ? 'Phone' : 'Email'}
      </h1>

      <p className="text-gray-600 text-center mb-6">
        We've sent a verification code to your {usePhone ? 'phone number' : 'email address'}.
        Please enter the code below to complete your registration.
      </p>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">
          {error}
        </div>
      )}

      {resendSuccess && (
        <div className="bg-green-100 text-green-700 p-3 mb-4 rounded">
          Verification code resent successfully!
        </div>
      )}

      <form onSubmit={handleVerification} className="space-y-6">
        <label className="block">
          <span className="text-earthyBrownDark font-semibold">Verification Code</span>
          <input
            type="text"
            value={code}
            onChange={handleCodeChange}
            className="w-full mt-2 p-4 text-center text-2xl font-semibold tracking-widest border-2 border-[#b8860b] rounded-lg focus:outline-none focus:border-[#ff8c00] transition"
            placeholder="000000"
            maxLength="6"
            required
            disabled={loading}
            autoComplete="one-time-code"
            inputMode="numeric"
          />
          <span className="text-sm text-gray-500 mt-1 block">
            Enter the 6-digit code
          </span>
        </label>

        <button
          type="submit"
          className="w-full bg-[#b8860b] hover:bg-[#997500] text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || code.length !== 6}
        >
          {loading ? 'Verifying...' : 'Verify Account'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600 mb-2">Didn't receive the code?</p>
        <button
          type="button"
          onClick={handleResendCode}
          className="text-[#b8860b] hover:text-[#997500] font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={resending}
        >
          {resending ? 'Resending...' : 'Resend Code'}
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200 text-center">
        <p className="text-gray-600">
          Wrong {usePhone ? 'phone number' : 'email'}?{' '}
          <NavLink 
            to="/sign-up" 
            className="text-[#b8860b] hover:text-[#997500] font-semibold"
          >
            Go Back
          </NavLink>
        </p>
      </div>
    </div>
  );
}