import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./UserProfile.css";

// ─── Magic UI: ShineBorder (inline) ──────────────────────────────────────────
const ShineBorder = ({
  shineColor = ["#22c55e", "#16a34a"],
  borderWidth = 1,
  duration = 10,
}: {
  shineColor?: string | string[];
  borderWidth?: number;
  duration?: number;
}) => (
  <span
    className="up-shine-border"
    style={{
      ["--border-width" as string]: `${borderWidth}px`,
      ["--duration" as string]: `${duration}s`,
      backgroundImage: `radial-gradient(transparent, transparent, ${
        Array.isArray(shineColor) ? shineColor.join(",") : shineColor
      }, transparent, transparent)`,
    }}
  />
);
// ─────────────────────────────────────────────────────────────────────────────

const UserProfile = () => {
  const { user } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  return (
    <div className="up-page">
      {/* Page Header */}
      <div className="up-page-header">
        <h1 className="up-page-title">User Profile</h1>
        <p className="up-page-subtitle">
          View and manage your profile information
        </p>
      </div>

      <div className="up-layout">
        {/* ── Left sidebar ── */}
        <div className="up-sidebar">
          <div className="up-profile-card">
            <ShineBorder />
            <div className="up-avatar-wrap">
              <div className="up-avatar">
                {user?.username ? getInitials(user.username) : "U"}
              </div>
            </div>
            <h2 className="up-name">{user?.username || "User"}</h2>
            <p className="up-email">{user?.email || "user@example.com"}</p>
            <span className="up-role-badge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {user?.role || "User"}
            </span>
            <div className="up-status">
              <span className="up-status-dot" />
              Active Account
            </div>
            <button className="up-edit-btn" onClick={() => setShowEditModal(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Edit Profile
            </button>
          </div>
        </div>

        {/* ── Right content ── */}
        <div className="up-content">
          {/* Account Information */}
          <div className="up-card">
            <ShineBorder duration={14} />
            <div className="up-card-header">
              <h3 className="up-card-title">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ marginRight: 8, verticalAlign: "middle" }}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Account Information
              </h3>
              <p className="up-card-subtitle">Your personal account details</p>
            </div>
            <div className="up-info-grid">
              {[
                {
                  label: "User ID",
                  value: user?.id || "1",
                  svg: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="8.5" cy="10.5" r="1.5" stroke="currentColor" strokeWidth="2" />
                      <path d="M14 9h4M14 12h4M6 16h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  ),
                },
                {
                  label: "Username",
                  value: user?.username || "user",
                  svg: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                },
                {
                  label: "Email Address",
                  value: user?.email || "user@example.com",
                  svg: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                },
                {
                  label: "Role",
                  value: user?.role || "User",
                  svg: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                },
                {
                  label: "Account Status",
                  value: "Active",
                  isStatus: true,
                  svg: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                },
                {
                  label: "Member Since",
                  value: "January 2026",
                  svg: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  ),
                },
              ].map((item) => (
                <div key={item.label} className="up-info-item">
                  <div className="up-info-icon">{item.svg}</div>
                  <div className="up-info-content">
                    <span className="up-info-label">{item.label}</span>
                    {item.isStatus ? (
                      <span className="up-info-value up-info-active">
                        <span className="up-active-dot" />
                        {item.value}
                      </span>
                    ) : (
                      <span className="up-info-value">{item.value}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security & Privacy */}
          <div className="up-card">
            <ShineBorder shineColor={["#6366f1", "#818cf8"]} duration={16} />
            <div className="up-card-header">
              <h3 className="up-card-title">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ marginRight: 8, verticalAlign: "middle" }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Security &amp; Privacy
              </h3>
              <p className="up-card-subtitle">Manage your security settings</p>
            </div>
            <div className="up-security-list">
              <div className="up-security-item">
                <div className="up-security-left">
                  <div className="up-security-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="12" y1="18" x2="12.01" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="up-security-details">
                    <span className="up-security-label">Two-Factor Authentication</span>
                    <span className="up-security-desc">Add an extra layer of security to your account</span>
                  </div>
                </div>
                <div className="up-security-right">
                  <span className="up-security-badge up-badge-disabled">Disabled</span>
                  <button className="up-action-btn up-action-green">Enable</button>
                </div>
              </div>

              <div className="up-security-item">
                <div className="up-security-left">
                  <div className="up-security-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="up-security-details">
                    <span className="up-security-label">Password</span>
                    <span className="up-security-desc">Last changed 3 months ago</span>
                  </div>
                </div>
                <div className="up-security-right">
                  <button className="up-action-btn up-action-outline">Change</button>
                </div>
              </div>

              <div className="up-security-item">
                <div className="up-security-left">
                  <div className="up-security-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="up-security-details">
                    <span className="up-security-label">Active Sessions</span>
                    <span className="up-security-desc">2 devices currently logged in</span>
                  </div>
                </div>
                <div className="up-security-right">
                  <button className="up-action-btn up-action-outline">View All</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="up-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="up-modal" onClick={(e) => e.stopPropagation()}>
            <div className="up-modal-header">
              <h2 className="up-modal-title">Edit Profile</h2>
              <button
                className="up-modal-close"
                onClick={() => setShowEditModal(false)}
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="up-modal-body">
              <div className="up-modal-section-label">Personal Information</div>
              <div className="up-modal-row">
                <div className="up-modal-group">
                  <label className="up-modal-label" htmlFor="up-firstname">First Name</label>
                  <input id="up-firstname" type="text" className="up-modal-input" placeholder="Enter first name" />
                </div>
                <div className="up-modal-group">
                  <label className="up-modal-label" htmlFor="up-lastname">Last Name</label>
                  <input id="up-lastname" type="text" className="up-modal-input" placeholder="Enter last name" />
                </div>
              </div>

              <div className="up-modal-group">
                <label className="up-modal-label" htmlFor="up-username">Username</label>
                <input
                  id="up-username"
                  type="text"
                  className="up-modal-input"
                  defaultValue={user?.username || ""}
                  placeholder="Enter username"
                />
              </div>

              <div className="up-modal-section-label">Contact Details</div>
              <div className="up-modal-group">
                <label className="up-modal-label" htmlFor="up-email">Email Address</label>
                <input
                  id="up-email"
                  type="email"
                  className="up-modal-input"
                  defaultValue={user?.email || ""}
                  placeholder="Enter email address"
                />
              </div>

              <div className="up-modal-group">
                <label className="up-modal-label" htmlFor="up-phone">Phone Number</label>
                <input id="up-phone" type="tel" className="up-modal-input" placeholder="Enter phone number" />
              </div>
            </div>

            <div className="up-modal-footer">
              <button className="up-modal-cancel" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button className="up-modal-save" onClick={() => setShowEditModal(false)}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
