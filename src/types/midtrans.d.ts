/**
 * Midtrans Snap.js global type declarations.
 * Snap.js is loaded via <script> tag from https://app.sandbox.midtrans.com/snap/snap.js
 */

interface SnapPayResult {
  order_id: string;
  transaction_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  transaction_status: string;
  fraud_status?: string;
  status_code: string;
  status_message: string;
  pdf_url?: string;
  finish_redirect_url?: string;
}

interface SnapCallbacks {
  onSuccess?: (result: SnapPayResult) => void;
  onPending?: (result: SnapPayResult) => void;
  onError?: (result: SnapPayResult) => void;
  onClose?: () => void;
}

interface Snap {
  pay: (token: string, callbacks?: SnapCallbacks) => void;
  hide: () => void;
}

interface Window {
  snap?: Snap;
}
