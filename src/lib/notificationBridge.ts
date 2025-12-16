// Central notification & confirmation bridge
// Sends events to external application (e.g., desktop wrapper or mobile app) via postMessage.
// Falls back to internal UI if external mode not enabled or no response.

export type BridgeNotificationType = 'success' | 'error' | 'info';

export interface BridgeNotification {
  id: string;
  type: BridgeNotificationType;
  message: string;
  context?: Record<string, any>;
}

export interface BridgeConfirmRequest {
  id: string;
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info';
  context?: Record<string, any>;
}

let externalMode = false;
let initialized = false;

const EXTERNAL_FLAG_KEY = 'external_app_mode'; // set to '1' to activate

export function isExternalMode() {
  if (!initialized) {
    externalMode = typeof window !== 'undefined' &&
      (localStorage.getItem(EXTERNAL_FLAG_KEY) === '1');
    initialized = true;
  }
  return externalMode;
}

function postMessage(payload: any) {
  try {
    window.postMessage(payload, '*');
  } catch (e) {
    // ignore
  }
}

export function sendNotification(message: string, type: BridgeNotificationType = 'info', context?: Record<string, any>) {
  const note: BridgeNotification = {
    id: Date.now().toString() + '_' + Math.random().toString(36).slice(2),
    type,
    message,
    context,
  };
  if (isExternalMode()) {
    postMessage({ source: 'inventory-app', kind: 'notification', payload: note });
  }
  return note;
}

// Request confirmation from external app. Returns promise<boolean>.
// If external app does not respond within timeout, we fallback (return null to let caller show internal dialog).
export async function requestExternalConfirmation(req: BridgeConfirmRequest, timeoutMs = 2500): Promise<boolean | null> {
  if (!isExternalMode()) return null;
  return new Promise((resolve) => {
    const id = req.id || (Date.now().toString() + '_' + Math.random().toString(36).slice(2));
    const confirmReq: BridgeConfirmRequest = { ...req, id };
    const handler = (ev: MessageEvent) => {
      if (ev.data && ev.data.source === 'external-app' && ev.data.kind === 'confirm-response' && ev.data.payload?.id === id) {
        window.removeEventListener('message', handler);
        resolve(!!ev.data.payload.accepted);
      }
    };
    window.addEventListener('message', handler);
    postMessage({ source: 'inventory-app', kind: 'confirm-request', payload: confirmReq });
    setTimeout(() => {
      window.removeEventListener('message', handler);
      resolve(null); // no response, let UI fallback
    }, timeoutMs);
  });
}
