import React from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';

export default function Auth({ mode }) {
  // mode can be 'sign-in' or 'sign-up' to display respective forms
  return (
    <div className="auth-wrapper" style={wrapperStyles}>
      <h2 style={headerStyles}>{mode === 'sign-in' ? 'Sign In' : 'Sign Up'}</h2>
      {mode === 'sign-in' ? (
        <SignIn path="/sign-in" routing="path" />
      ) : (
        <SignUp path="/sign-up" routing="path" />
      )}
    </div>
  );
}

const wrapperStyles = {
  maxWidth: '400px',
  margin: '3rem auto',
  padding: '2rem',
  borderRadius: '8px',
  boxShadow: '0 0 10px rgba(0,0,0,0.1)',
  textAlign: 'center',
  backgroundColor: '#fff',
};

const headerStyles = {
  marginBottom: '1rem',
  fontFamily: 'Arial, sans-serif',
};
