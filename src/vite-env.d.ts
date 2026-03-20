/// <reference types="vite/client" />

// Google Identity Services (GIS) type shim
// Loaded by Supabase's OAuth flow via accounts.google.com/gsi/client

interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string;
          callback: (response: { credential: string }) => void;
          auto_select?: boolean;
          cancel_on_tap_outside?: boolean;
          use_fedcm_for_prompt?: boolean;
        }) => void;
        prompt: (momentListener?: (notification: {
          isNotDisplayed: () => boolean;
          getNotDisplayedReason: () => string;
          isSkippedMoment: () => boolean;
          getSkippedReason: () => string;
        }) => void) => void;
        disableAutoSelect: () => void;
        revoke: (hint: string, done: (response: { error?: string }) => void) => void;
      };
    };
  };
}