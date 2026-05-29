import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider
} from 'firebase/auth';
import { auth } from '../lib/firebase';

// Assets
import SeaLenslogo from '../assets/SeaLenslogo.svg';
import googleIcon from "../assets/google.svg";
import appleIcon from "../assets/apple.svg";

interface SignInProps {
  onSignIn: () => void;
}

type SignInStep = 'login' | 'signup';

export default function SignIn({ onSignIn }: SignInProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<SignInStep>('login');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [subscribe, setSubscribe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onSignIn();
      navigate('/upload');
    } catch (err: any) {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || !firstName) return;

    setLoading(true);
    setError('');

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      if (result.user) {
        await updateProfile(result.user, { displayName: `${firstName} ${lastName}`.trim() });
      }

      onSignIn();
      navigate('/onboarding', { state: { subscribe } });
    } catch (err: any) {
      setError(err.message || 'An error occurred during account creation.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onSignIn();
      navigate('/upload');
    } catch (err: any) {
      setError(err.message || 'Google sign in failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAppleSignIn() {
    setLoading(true);
    setError('');
    try {
      const provider = new OAuthProvider('apple.com');
      await signInWithPopup(auth, provider);
      onSignIn();
      navigate('/upload');
    } catch (err: any) {
      setError(err.message || 'Apple sign in failed.');
    } finally {
      setLoading(false);
    }
  }

  // Helper for password visibility toggle
  const togglePasswordBtn = (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      style={{
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#6a6c6a',
        padding: '4px'
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {showPassword ? (
          <>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </>
        ) : (
          <>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </>
        )}
      </svg>
    </button>
  );

  return (
    <div className="signin-container">
      {/* Left Panel */}
      <div className="signin-left">
        <div className="signin-logo">
          <img src={SeaLenslogo} alt="SeaLens Logo" width={32} height={32} />
        </div>

        <div className="signin-content">
          {step === 'login' && (
            <>
              <h1 className="signin-title">Welcome back</h1>
              <p className="signin-subtitle">
                Log in to continue your reef ecosystem analysis.
              </p>

              <div className="signin-providers">
                <button className="provider-btn" onClick={handleGoogleSignIn}>
                  <img src={googleIcon} alt="Google" width="20" height="20" />
                  Continue with Google
                </button>

                <button className="provider-btn" onClick={handleAppleSignIn}>
                  <img src={appleIcon} alt="Apple" width="20" height="20" />
                  Continue with Apple
                </button>
              </div>

              <div className="signin-divider">
                <span>or</span>
              </div>

              <form className="signin-email-form" onSubmit={handleLogin} style={{ gap: '12px' }}>
                <div className="input-group">
                  <input
                    type="email"
                    placeholder="Email *"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group" style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password *"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {togglePasswordBtn}
                </div>
                {error && <p style={{ color: 'red', fontSize: '14px', margin: 0 }}>{error}</p>}

                <button
                  type="submit"
                  className="btn-continue-email"
                  disabled={loading}
                  style={{ marginTop: '8px' }}
                >
                  {loading ? 'Loggin in...' : 'Log in'}
                </button>
              </form>

              <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#6a6c6a' }}>
                Don't have an account?{' '}
                <button
                  onClick={() => { setStep('signup'); setError(''); }}
                  style={{ background: 'none', border: 'none', color: '#0078f0', fontWeight: '600', cursor: 'pointer', padding: 0 }}
                >
                  Sign up
                </button>
              </div>
            </>
          )}

          {step === 'signup' && (
            <>
              <h1 className="signin-title">Create account</h1>
              <p className="signin-subtitle">
                Analyze reef ecosystems in minutes, not weeks.
              </p>

              <form className="signin-email-form" onSubmit={handleSignUp} style={{ gap: '12px' }}>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="First name *"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <input
                    type="email"
                    placeholder="Email *"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group" style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password *"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {togglePasswordBtn}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <input
                    type="checkbox"
                    id="subscribe"
                    checked={subscribe}
                    onChange={(e) => setSubscribe(e.target.checked)}
                    style={{ width: '16px', height: '16px', margin: 0, accentColor: '#0078f0', cursor: 'pointer' }}
                  />
                  <label htmlFor="subscribe" style={{ fontSize: '13px', color: '#6a6c6a', cursor: 'pointer' }}>
                    Subscribe to our email updates
                  </label>
                </div>

                {error && <p style={{ color: 'red', fontSize: '14px', margin: 0 }}>{error}</p>}

                <button
                  type="submit"
                  className="btn-continue-email"
                  disabled={loading}
                  style={{ marginTop: '8px' }}
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </form>

              <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#6a6c6a' }}>
                Already have an account?{' '}
                <button
                  onClick={() => { setStep('login'); setError(''); }}
                  style={{ background: 'none', border: 'none', color: '#0078f0', fontWeight: '600', cursor: 'pointer', padding: 0 }}
                >
                  Log in
                </button>
              </div>

              <p className="signin-terms" style={{ marginTop: '24px' }}>
                By continuing, you agree to our <a href="#">Terms & Conditions</a> and <a href="#">Privacy Policy</a>.
              </p>
            </>
          )}

        </div>
      </div>

      {/* Right Panel */}
      <div className="signin-right">
        <div className="signin-image-container">
          <img
            src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=2000&auto=format&fit=crop"
            alt="Underwater footage"
            className="signin-image"
          />
        </div>
      </div>
    </div>
  );
}
