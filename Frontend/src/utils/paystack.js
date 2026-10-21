// Loads Paystack's Inline popup script on demand (only when someone
// actually reaches checkout), rather than on every page via index.html.
export function loadPaystackScript() {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) {
      resolve(window.PaystackPop);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => resolve(window.PaystackPop);
    script.onerror = () => reject(new Error('Could not load Paystack. Check your connection and try again.'));
    document.body.appendChild(script);
  });
}
