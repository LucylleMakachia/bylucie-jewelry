import React, { useState } from 'react';
import { useSignIn } from '@clerk/clerk-react';
import { useNavigate, NavLink } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';

export default function SignIn() {
  const { signIn, isLoaded, setActive } = useSignIn();
  const navigate = useNavigate();

  const [usePhone, setUsePhone] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;

  const validateInputs = () => {
    if (usePhone) {
      if (!phoneRegex.test(phone)) {
        setError('Enter a valid phone number with country code');
        return false;
      }
    } else {
      if (!emailRegex.test(email)) {
        setError('Enter a valid email address');
        return false;
      }
    }
    if (!password) {
      setError('Password is required');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    if (!isLoaded || !signIn) {
      setError('Authentication not ready');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: usePhone ? phone : email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigate('/');
      } else {
        // Handle other statuses
        setError('Sign in incomplete. Please try again.');
      }
    } catch (err) {
      const errorMsg = err.errors?.[0]?.message || err.message || 'Login failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isLoaded || !signIn) return;
    try {
      await signIn.authenticateWithRedirect({ 
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/'
      });
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Google sign-in failed');
    }
  };

  const handleAppleSignIn = async () => {
    if (!isLoaded || !signIn) return;
    try {
      await signIn.authenticateWithRedirect({ 
        strategy: 'oauth_apple',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/'
      });
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Apple sign-in failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-24 p-8 bg-white rounded-lg shadow-md border border-[#b8860b]">
      <h1 className="text-3xl font-serif font-semibold mb-6 text-[#b8860b] text-center">Sign In</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="relative">
          <label className="text-earthyBrownDark font-semibold block">
            {usePhone ? 'Phone Number' : 'Email'}
          </label>
          <button
            type="button"
            onClick={() => setUsePhone(!usePhone)}
            className="absolute right-0 top-0 text-[#b8860b] font-semibold hover:text-[#997500]"
            style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
          >
            {usePhone ? 'Use Email' : 'Use Phone Number'}
          </button>

          {!usePhone && (
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-6 p-3 border border-[#b8860b] rounded-lg focus:outline-none focus:border-[#ff8c00] transition"
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          )}

          {usePhone && (
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full mt-6 p-3 border border-[#b8860b] rounded-lg focus:outline-none focus:border-[#ff8c00] transition"
              placeholder="+1234567890"
              required
              disabled={loading}
            />
          )}
        </div>

        <label className="block">
          <span className="text-earthyBrownDark font-semibold">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mt-1 p-3 border border-[#b8860b] rounded-lg focus:outline-none focus:border-[#ff8c00] transition"
            placeholder="••••••••"
            required
            disabled={loading}
          />
        </label>

        <button
          type="submit"
          className="w-full bg-[#b8860b] hover:bg-[#997500] text-white font-semibold py-3 rounded-lg transition"
          disabled={loading}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div className="flex flex-col space-y-4 mt-6">
        <button
          onClick={handleGoogleSignIn}
          className="flex items-center justify-center space-x-2 w-full py-3 rounded-lg transition"
          type="button"
          style={{ backgroundColor: '#4285F4', color: 'white' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#357ae8')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4285F4')}
        >
          <FcGoogle size={24} />
          <span className="font-semibold">Sign in with Google</span>
        </button>
        <button
          onClick={handleAppleSignIn}
          className="flex items-center justify-center space-x-2 w-full py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition"
          type="button"
        >
          <FaApple size={24} />
          <span className="font-semibold">Sign in with Apple</span>
        </button>
      </div>

      <p className="mt-6 text-center text-gray-600">
        Don&apos;t have an account?{' '}
        <NavLink to="/sign-up" className="text-[#b8860b] hover:text-[#997500] font-semibold">
          Sign Up
        </NavLink>
      </p>
    </div>
  );
}