import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { hasApiKey, generateApiKey, regenerateApiKey } from '../../firebase/firestore';
import { logOut } from '../../hooks/useAuth';
import { selectUser } from './authSlice';

interface UserSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserSettings: React.FC<UserSettingsProps> = ({ isOpen, onClose }) => {
  const user = useSelector(selectUser);
  // newlyGeneratedKey holds the key ONLY when just generated (shown once)
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkApiKey = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    try {
      const exists = await hasApiKey(user.uid);
      setHasExistingKey(exists);
    } catch (err) {
      console.error('Failed to check API key:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (isOpen && user?.uid) {
      // Reset state when opening
      setNewlyGeneratedKey(null);
      setShowApiKey(false);
      setCopied(false);
      setError(null);
      checkApiKey();
    }
  }, [isOpen, user?.uid, checkApiKey]);

  const handleGenerateKey = async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    setError(null);
    try {
      const newKey = await generateApiKey(user.uid);
      setNewlyGeneratedKey(newKey);
      setHasExistingKey(true);
      setShowApiKey(true);
    } catch (err: any) {
      setError(err.message || 'Failed to generate API key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (!user?.uid) return;
    if (
      !confirm(
        'Are you sure? This will invalidate your existing API key. The new key will only be shown once.'
      )
    )
      return;

    setIsLoading(true);
    setError(null);
    try {
      const newKey = await regenerateApiKey(user.uid);
      setNewlyGeneratedKey(newKey);
      setShowApiKey(true);
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate API key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyKey = async () => {
    if (!newlyGeneratedKey) return;
    try {
      await navigator.clipboard.writeText(newlyGeneratedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleLogout = async () => {
    await logOut();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          x
        </button>

        <h3 className="font-bold text-lg mb-4">Settings</h3>

        {/* User Info */}
        <div className="flex items-center gap-3 mb-6">
          {user?.photoURL && (
            <div className="avatar">
              <div className="w-12 rounded-full">
                <img src={user.photoURL} alt={user.displayName || 'User'} />
              </div>
            </div>
          )}
          <div>
            <div className="font-medium">{user?.displayName || 'User'}</div>
            <div className="text-sm text-base-content/70">{user?.email}</div>
          </div>
        </div>

        <div className="divider"></div>

        {/* API Key Section */}
        <div className="mb-6">
          <h4 className="font-medium mb-2">API Key (for Claude)</h4>
          <p className="text-sm text-base-content/70 mb-3">
            Use this key to let Claude add tasks to your account via the API.
          </p>

          {isLoading ? (
            <div className="flex items-center gap-2">
              <span className="loading loading-spinner loading-sm"></span>
              <span>Loading...</span>
            </div>
          ) : newlyGeneratedKey ? (
            // Show newly generated key (only shown once)
            <div className="space-y-3">
              <div className="alert alert-warning py-2 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span className="text-sm">Copy this key now! It won&apos;t be shown again.</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={newlyGeneratedKey}
                  readOnly
                  className="input input-bordered input-sm flex-1 font-mono text-xs"
                />
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setShowApiKey(!showApiKey)}
                  title={showApiKey ? 'Hide' : 'Show'}
                >
                  {showApiKey ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
                <button
                  className={`btn btn-sm ${copied ? 'btn-success' : 'btn-primary'}`}
                  onClick={handleCopyKey}
                  title="Copy"
                >
                  {copied ? (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>

              {/* API Usage Info - shown with new key */}
              <div className="collapse collapse-arrow bg-base-200 mt-4">
                <input type="checkbox" defaultChecked />
                <div className="collapse-title text-sm font-medium">How to use with Claude</div>
                <div className="collapse-content">
                  <p className="text-xs text-base-content/70 mb-2">
                    Add this to your Claude MCP config or use the API directly:
                  </p>
                  <pre className="text-xs bg-base-300 p-2 rounded overflow-x-auto">
                    {`POST https://us-central1-new-day-69f04.cloudfunctions.net/addTask
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "text": "Task description",
  "type": "Other"
}`}
                  </pre>
                </div>
              </div>
            </div>
          ) : hasExistingKey ? (
            // Has existing key but can't show it (already generated before)
            <div className="space-y-3">
              <div className="alert alert-info py-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="stroke-current shrink-0 w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span className="text-sm">
                  You have an API key configured. If you&apos;ve lost it, regenerate a new one.
                </span>
              </div>
              <button
                className="btn btn-sm btn-warning btn-outline"
                onClick={handleRegenerateKey}
                disabled={isLoading}
              >
                Regenerate API Key
              </button>
            </div>
          ) : (
            // No key yet
            <div className="space-y-2">
              <p className="text-sm text-base-content/60">
                Generate an API key to allow external tools to add tasks to your account.
              </p>
              <button
                className="btn btn-sm btn-primary"
                onClick={handleGenerateKey}
                disabled={isLoading}
              >
                Generate API Key
              </button>
            </div>
          )}

          {error && (
            <div className="alert alert-error mt-3 py-2">
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        <div className="divider"></div>

        {/* Logout */}
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-error btn-outline" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};
