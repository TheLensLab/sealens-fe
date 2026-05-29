import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import SeaLenslogo from '../assets/SeaLenslogo.svg';

const ORG_TYPES = [
  'University or Research Institution',
  'Conservation Organization / NGO',
  'Government Agency',
  'Environmental Consulting',
  'Marine Research Lab',
  'Aquarium or Marine Park',
  'Commercial / Industry',
  'Student',
  'Independent Researcher',
  'Other',
];

const ROLES_BY_ORG: Record<string, string[]> = {
  'University or Research Institution': [
    'Marine Scientist', 'Research Assistant', 'Professor / Lecturer',
    'PhD Researcher', "Master's Student", 'Undergraduate Student',
    'Lab Technician', 'Data Analyst', 'Other',
  ],
  'Conservation Organization / NGO': [
    'Conservation Scientist', 'Program Manager', 'Field Researcher',
    'Marine Ecologist', 'GIS / Data Specialist', 'Operations Team',
    'Volunteer', 'Other',
  ],
  'Government Agency': [
    'Research Officer', 'Environmental Analyst', 'Marine Policy Specialist',
    'Program Coordinator', 'Data Manager', 'Other',
  ],
  'Environmental Consulting': [
    'Environmental Consultant', 'Marine Ecologist', 'Field Surveyor',
    'Project Manager', 'GIS / Spatial Analyst', 'Data Analyst',
    'Environmental Scientist', 'Operations Team', 'Research Coordinator',
    'Technical Specialist', 'Other',
  ],
  'Marine Research Lab': [
    'Principal Investigator', 'Marine Scientist', 'Research Assistant',
    'Lab Technician', 'Postdoctoral Researcher', 'PhD Researcher',
    "Master's Student", 'Undergraduate Researcher', 'Data Analyst',
    'Field Researcher', 'Other',
  ],
  'Aquarium or Marine Park': [
    'Marine Biologist', 'Conservation Specialist', 'Aquarium Researcher',
    'Animal Care Staff', 'Education Team', 'Field Researcher',
    'Operations Team', 'Data Analyst', 'Program Coordinator',
    'Exhibit Manager', 'Other',
  ],
  'Commercial / Industry': [
    'Environmental Consultant', 'Marine Surveyor', 'Project Manager',
    'Operations Team', 'Data Analyst', 'Other',
  ],
  'Student': [
    'Undergraduate Student', "Master's Student", 'PhD Student',
    'Independent Study', 'Other',
  ],
  'Independent Researcher': [
    'Marine Researcher', 'Wildlife Researcher', 'Filmmaker / Explorer',
    'Citizen Scientist', 'Data Analyst', 'Other',
  ],
};

const REFERRAL_SOURCES = [
  'Google Search',
  'YouTube',
  'Social Media (LinkedIn, X, Instagram, etc.)',
  'Research Paper or Publication',
  'University or Professor',
  'Colleague or Friend',
  'Conference or Event',
  'Conservation Organization',
  'Online Community',
  'App Store',
  'Other',
];

export default function OnboardingForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const subscribe: boolean = location.state?.subscribe ?? true;

  const [orgType, setOrgType] = useState('');
  const [orgName, setOrgName] = useState('');
  const [role, setRole] = useState('');
  const [roleCustom, setRoleCustom] = useState('');
  const [referralSource, setReferralSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const availableRoles = orgType && orgType !== 'Other' ? ROLES_BY_ORG[orgType] ?? [] : [];
  const showRoleDropdown = orgType !== '' && orgType !== 'Other';
  const showRoleTextInput = orgType === 'Other' || role === 'Other';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      navigate('/sign-in');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        organizationType: orgType,
        organizationName: orgName.trim() || null,
        role: showRoleDropdown ? role : null,
        roleCustom: roleCustom.trim() || null,
        referralSource,
        subscribeToEmails: subscribe,
        createdAt: serverTimestamp(),
      });

      navigate('/upload');
    } catch (err) {
      console.error('Firestore write failed:', err);
      setError('Failed to save your profile. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="signin-container">
      <div className="signin-left">
        <div className="signin-logo">
          <img src={SeaLenslogo} alt="SeaLens Logo" width={32} height={32} />
        </div>

        <div className="signin-content">
          <h1 className="signin-title">Tell us more</h1>
          <p className="signin-subtitle">Help us personalize your experience.</p>

          <form className="signin-email-form" onSubmit={handleSubmit} style={{ gap: '12px' }}>

            <div className="input-group">
              <div className="select-wrapper">
                <select
                  value={orgType}
                  onChange={(e) => { setOrgType(e.target.value); setRole(''); setRoleCustom(''); }}
                  className={!orgType ? 'select-placeholder' : ''}
                  required
                >
                  <option value="" disabled>Organization type *</option>
                  {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="input-group">
              <input
                type="text"
                placeholder="Organization name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>

            {showRoleDropdown && (
              <div className="input-group">
                <div className="select-wrapper">
                  <select
                    value={role}
                    onChange={(e) => { setRole(e.target.value); setRoleCustom(''); }}
                    className={!role ? 'select-placeholder' : ''}
                    required
                  >
                    <option value="" disabled>What's your role? *</option>
                    {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            )}

            {showRoleTextInput && (
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Enter your role"
                  value={roleCustom}
                  onChange={(e) => setRoleCustom(e.target.value)}
                />
              </div>
            )}

            <div className="input-group">
              <div className="select-wrapper">
                <select
                  value={referralSource}
                  onChange={(e) => setReferralSource(e.target.value)}
                  className={!referralSource ? 'select-placeholder' : ''}
                  required
                >
                  <option value="" disabled>How did you hear about SeaLens? *</option>
                  {REFERRAL_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {error && <p style={{ color: 'red', fontSize: '14px', margin: 0 }}>{error}</p>}

            <button
              type="submit"
              className="btn-continue-email"
              disabled={loading}
              style={{ marginTop: '8px' }}
            >
              {loading ? 'Saving...' : 'Get started'}
            </button>
          </form>

          <p className="signin-terms" style={{ marginTop: '24px' }}>
            By continuing, you agree to our <a href="#">Terms & Conditions</a> and <a href="#">Privacy Policy</a>.
          </p>
        </div>
      </div>

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
