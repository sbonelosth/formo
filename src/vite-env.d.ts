/// <reference types="vite/client" />

// Google Identity Services (GIS) type shim
interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string;
          callback: (response: { credential: string }) => void;
          auto_select?: boolean;
          cancel_on_tap_outside?: boolean;
        }) => void;
        prompt: (momentListener?: () => void) => void;
        disableAutoSelect: () => void;
        revoke: (hint: string, done: (response: { error?: string }) => void) => void;
      };
    };
  };
}