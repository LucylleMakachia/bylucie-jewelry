import React, { useState } from 'react';
import { useSignUp } from '@clerk/clerk-react';
import { useNavigate, NavLink } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';

export default function SignUp() {
  const { signUp, isLoaded, setActive } = useSignUp();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [usePhone, setUsePhone] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;

  const validatePassword = (pwd) => {
    const passwordRule = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=<>?{}[\]~]).{8,}$/;
    return passwordRule.test(pwd);
  };

  const validateInputs = () => {
    let valid = true;

    if (!fullName.trim()) {
      setError('Full Name is required');
      return false;
    }

    if (!username.trim()) {
      setError('Username is required');
      return false;
    }

    if (!email.trim() || !emailRegex.test(email)) {
      setError('Enter a valid email address');
      return false;
    }

    if (!phone.trim() || !phoneRegex.test(phone)) {
      setError('Enter a valid phone number with country code (e.g., +1234567890)');
      return false;
    }

    if (!validatePassword(password)) {
      setError(
        'Password must be 8+ chars, have uppercase letter, number and special character'
      );
      valid = false;
    }

    if (password !== passwordConfirm) {
      setError('Passwords do not match');
      valid = false;
    }

    if (valid) setError('');
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateInputs()) return;

    if (!isLoaded || !signUp) {
      setError('Sign-up not ready');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await signUp.create({
        emailAddress: email,
        phoneNumber: phone,
        username: username,
        password,
        firstName: fullName.split(' ')[0] || '',
        lastName: fullName.split(' ').slice(1).join(' ') || '',
      });

      await signUp.prepareVerification({
        strategy: 'email_code'
      });

      navigate('/verify', { state: { usePhone: false } });

    } catch (err) {
      const errorMessage = err.errors?.[0]?.longMessage || 
                          err.errors?.[0]?.message || 
                          err.message || 
                          'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isLoaded || !signUp) return;
    try {
      await signUp.authenticateWithRedirect({ 
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/'
      });
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Google sign-in failed');
    }
  };

  const handleAppleSignIn = async () => {
    if (!isLoaded || !signUp) return;
    try {
      await signUp.authenticateWithRedirect({ 
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
      <h1 className="text-3xl font-serif font-semibold mb-6 text-[#b8860b] text-center">Sign Up</h1>

      {error && <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">{error}</div>}

      <div id="clerk-captcha" />

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <label className="block">
          <span className="text-earthyBrownDark font-semibold">Full Name</span>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full mt-1 p-3 border border-[#b8860b] rounded-lg focus:outline-none focus:border-[#ff8c00] transition"
            placeholder="Your full name"
            required
            disabled={loading}
          />
        </label>

        <label className="block">
          <span className="text-earthyBrownDark font-semibold">Username</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full mt-1 p-3 border border-[#b8860b] rounded-lg focus:outline-none focus:border-[#ff8c00] transition"
            placeholder="Choose a username"
            required
            disabled={loading}
          />
        </label>

        <label className="block">
          <span className="text-earthyBrownDark font-semibold">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mt-1 p-3 border border-[#b8860b] rounded-lg focus:outline-none focus:border-[#ff8c00] transition"
            placeholder="you@example.com"
            required
            disabled={loading}
          />
        </label>

        <label className="block">
          <span className="text-earthyBrownDark font-semibold">Phone Number</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full mt-1 p-3 border border-[#b8860b] rounded-lg focus:outline-none focus:border-[#ff8c00] transition"
            placeholder="+1234567890"
            required
            disabled={loading}
          />
          <span className="text-sm text-gray-500 mt-1 block">Include country code (e.g., +1 for US)</span>
        </label>

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

        <label className="block">
          <span className="text-earthyBrownDark font-semibold">Confirm Password</span>
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
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
          {loading ? 'Creating Account...' : 'Sign Up'}
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
          <span className="font-semibold">Sign up with Google</span>
        </button>
        <button
          onClick={handleAppleSignIn}
          className="flex items-center justify-center space-x-2 w-full py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition"
          type="button"
        >
          <FaApple size={24} />
          <span className="font-semibold">Sign up with Apple</span>
        </button>
      </div>

      <p className="mt-6 text-center text-gray-600">
        Already have an account?{' '}
        <NavLink to="/sign-in" className="text-[#b8860b] hover:text-[#997500] font-semibold">
          Sign In
        </NavLink>
      </p>
    </div>
  );
}