import React, { useState } from "react";

function LoginGate({ onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Enter a valid email";
    if (!agreed) errs.agreed = "You must accept the terms";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onLogin(name.trim(), email.trim());
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        <h1 className="login-title">Voice App</h1>
        <p className="login-subtitle">Natural Text to Speech</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="login-name">Full Name</label>
            <input
              id="login-name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={errors.name ? "input-error" : ""}
              autoComplete="name"
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="login-field">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? "input-error" : ""}
              autoComplete="email"
            />
            {errors.email && (
              <span className="field-error">{errors.email}</span>
            )}
          </div>

          <div className="login-checkbox-row">
            <input
              id="login-agree"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <label htmlFor="login-agree">
              I agree to the{" "}
              <button
                type="button"
                className="link-btn"
                onClick={() => setShowTerms(true)}
              >
                Terms of Service
              </button>{" "}
              and{" "}
              <button
                type="button"
                className="link-btn"
                onClick={() => setShowPrivacy(true)}
              >
                Privacy Policy
              </button>
            </label>
          </div>
          {errors.agreed && (
            <span className="field-error">{errors.agreed}</span>
          )}

          <button type="submit" className="login-submit-btn">
            Continue to Voice App
          </button>
        </form>

        <div className="login-content-notice">
          <p>
            <strong>Content Policy:</strong> The following content is strictly
            prohibited:
          </p>
          <ul>
            <li>Hate speech or discrimination</li>
            <li>Abusive or threatening language</li>
            <li>Sexual or explicit content</li>
            <li>Religious insults or defamation</li>
            <li>Violence encouragement</li>
            <li>Illegal instructions or activities</li>
          </ul>
          <p>
            Violations are logged and may result in access restriction.
          </p>
        </div>
      </div>

      {showPrivacy && (
        <PolicyModal
          title="Privacy Policy"
          onClose={() => setShowPrivacy(false)}
        >
          <PrivacyPolicyContent />
        </PolicyModal>
      )}

      {showTerms && (
        <PolicyModal
          title="Terms of Service"
          onClose={() => setShowTerms(false)}
        >
          <TermsOfServiceContent />
        </PolicyModal>
      )}
    </div>
  );
}

function PolicyModal({ title, onClose, children }) {
  return (
    <div className="policy-overlay" onClick={onClose}>
      <div className="policy-modal" onClick={(e) => e.stopPropagation()}>
        <div className="policy-header">
          <h2>{title}</h2>
          <button className="policy-close" onClick={onClose} type="button">
            {"\u2715"}
          </button>
        </div>
        <div className="policy-body">{children}</div>
        <div className="policy-footer">
          <button className="btn policy-accept-btn" onClick={onClose} type="button">
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}

function PrivacyPolicyContent() {
  return (
    <div className="policy-content">
      <p><em>Last updated: February 2026</em></p>

      <h3>1. Information We Collect</h3>
      <p>
        When you use Voice App, we collect the following information to provide and
        improve our service:
      </p>
      <ul>
        <li><strong>Name and Email:</strong> Provided during registration to identify users.</li>
        <li><strong>Usage Data:</strong> Actions performed (speak, download), timestamps, language selections, and text length (not full text content).</li>
        <li><strong>Content Moderation Logs:</strong> If your text triggers our content filters, the violation category is logged for safety purposes.</li>
        <li><strong>Session Data:</strong> A unique session ID to track activity during your session.</li>
      </ul>

      <h3>2. How We Use Your Information</h3>
      <ul>
        <li>To provide the text-to-speech service.</li>
        <li>To enforce our content policy and prevent misuse.</li>
        <li>To maintain usage logs for accountability.</li>
        <li>To improve service quality and user experience.</li>
      </ul>

      <h3>3. Data Storage</h3>
      <p>
        All data is stored locally in your browser's localStorage. We do not
        transmit your personal data to external servers. Your data remains on
        your device.
      </p>

      <h3>4. Data Retention</h3>
      <p>
        Usage logs are retained locally for up to 500 entries. You can clear
        your data at any time by clearing your browser's localStorage or using
        the logout feature.
      </p>

      <h3>5. Third-Party Services</h3>
      <ul>
        <li><strong>Web Speech API:</strong> Your text is processed by your browser's built-in speech engine for voice playback.</li>
        <li><strong>Google Translate TTS:</strong> When downloading audio as MP3, text may be sent to Google's TTS service.</li>
        <li><strong>FlagCDN:</strong> Country flag images are loaded from flagcdn.com.</li>
      </ul>

      <h3>6. Your Rights</h3>
      <p>You have the right to:</p>
      <ul>
        <li>Access your stored data (available in browser localStorage).</li>
        <li>Delete your data by logging out or clearing browser storage.</li>
        <li>Opt out by simply not using the service.</li>
      </ul>

      <h3>7. Children's Privacy</h3>
      <p>
        Voice App is not intended for children under 13. We do not knowingly
        collect data from children.
      </p>

      <h3>8. Contact</h3>
      <p>
        For privacy concerns, please contact the application administrator.
      </p>
    </div>
  );
}

function TermsOfServiceContent() {
  return (
    <div className="policy-content">
      <p><em>Last updated: February 2026</em></p>

      <h3>1. Acceptance of Terms</h3>
      <p>
        By accessing and using Voice App, you agree to be bound by these Terms of
        Service. If you do not agree, please do not use this application.
      </p>

      <h3>2. Service Description</h3>
      <p>
        Voice App is a text-to-speech web application that converts written text
        into spoken audio using browser-based speech synthesis technology.
      </p>

      <h3>3. User Registration</h3>
      <p>
        You must provide a valid name and email address to use Voice App. You are
        responsible for the accuracy of the information you provide. All usage
        is logged for accountability purposes.
      </p>

      <h3>4. Prohibited Content</h3>
      <p>
        You agree NOT to use Voice App to generate speech containing:
      </p>
      <ul>
        <li><strong>Hate Speech:</strong> Content promoting hatred or discrimination based on race, ethnicity, nationality, religion, gender, or sexual orientation.</li>
        <li><strong>Abusive Language:</strong> Threats, harassment, bullying, or personally abusive content.</li>
        <li><strong>Sexual Content:</strong> Pornographic, explicit, or sexually suggestive material.</li>
        <li><strong>Religious Insults:</strong> Content that defames, mocks, or incites hatred against any religion or religious figures.</li>
        <li><strong>Violence Encouragement:</strong> Content that promotes, glorifies, or instructs violence against people, animals, or property.</li>
        <li><strong>Illegal Instructions:</strong> Content that provides instructions for illegal activities including drug manufacturing, hacking, fraud, or trafficking.</li>
      </ul>

      <h3>5. Content Moderation</h3>
      <p>
        Voice App employs automated content filtering. If prohibited content is
        detected, your request will be blocked and the violation will be
        logged. Repeated violations may result in access restrictions.
      </p>

      <h3>6. User Logging</h3>
      <p>
        All usage is logged including: user identity, actions performed,
        timestamps, and any content policy violations. These logs may be
        reviewed for safety and compliance purposes.
      </p>

      <h3>7. Intellectual Property</h3>
      <p>
        You retain ownership of the text you input. The generated speech audio
        is provided for personal and non-commercial use unless otherwise
        authorized.
      </p>

      <h3>8. Limitation of Liability</h3>
      <p>
        Voice App is provided "as is" without warranties. We are not liable for
        any damages resulting from use of the service, including but not
        limited to audio quality, availability, or content accuracy.
      </p>

      <h3>9. Termination</h3>
      <p>
        We reserve the right to restrict or terminate access for users who
        violate these terms, particularly the content policy.
      </p>

<h3>10. Piper TTS – Free AI Voices</h3>
<p>
  For supported languages, SunAI uses <strong>Piper TTS</strong>, a fully local, open‑source neural text‑to‑speech system. 
  Piper voices run entirely in your browser – no external servers, no usage limits, and <strong>100% free forever</strong>. 
  The same high‑quality AI voice is used for both live playback and MP3 downloads.
</p>

      <h3>11. Changes to Terms</h3>
      <p>
        We may update these terms at any time. Continued use of Voice App after
        changes constitutes acceptance of the revised terms.
      </p>
    </div>
  );
}

export { PolicyModal, PrivacyPolicyContent, TermsOfServiceContent };
export default LoginGate;
