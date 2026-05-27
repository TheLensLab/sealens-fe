import React from 'react';
import SeaLenslogo from '../assests/SeaLenslogo.svg';

interface SignInProps {
  onSignIn: () => void;
}

export default function SignIn({ onSignIn }: SignInProps) {
  return (
    <div className="signin-container">
      {/* Left Panel */}
      <div className="signin-left">
        <div className="signin-logo">
          <img src={SeaLenslogo} alt="SeaLens Logo" width={32} height={32} />
        </div>

        <div className="signin-content">
          <h1 className="signin-title">Analyze reef ecosystems in minutes, not weeks.</h1>
          <p className="signin-subtitle">
            Detect, identify, and count fish from underwater footage with researchers in control through review and validation.
          </p>

          <div className="signin-providers">
            <button className="provider-btn" onClick={onSignIn}>
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width="20" height="20" />
              Continue with Google
            </button>
            <button className="provider-btn" onClick={onSignIn}>
              <img src="https://www.svgrepo.com/show/511330/apple-173.svg" alt="Apple" width="20" height="20" />
              Continue with Apple
            </button>
            <button className="provider-btn" onClick={onSignIn}>
              <img src="https://www.svgrepo.com/show/452062/microsoft.svg" alt="Microsoft" width="20" height="20" />
              Continue with Microsoft
            </button>
          </div>

          <div className="signin-divider">
            <span>or</span>
          </div>

          <div className="signin-email-form">
            <div className="input-group">
              <label htmlFor="email">Email <span className="required">*</span></label>
              <input type="email" id="email" />
            </div>
            <button className="btn-continue-email" onClick={onSignIn}>
              Continue with email
            </button>
          </div>

          <p className="signin-terms">
            By continuing, you agree to our <a href="#">Terms & Conditions</a> and <a href="#">Privacy Policy</a>.
          </p>
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
    </div >
  );
}
