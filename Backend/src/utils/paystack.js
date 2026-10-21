require('dotenv').config();

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

const isPaystackConfigured = () => Boolean(process.env.PAYSTACK_SECRET_KEY);

// Never trust a frontend's claim that a card payment succeeded — this is
// the only source of truth for whether money actually moved. Uses Node's
// built-in fetch (stable since Node 18), no extra HTTP client needed.
const verifyPaystackTransaction = async (reference) => {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Could not verify payment with Paystack.');
  }
  return data.data; // { status, amount (in kobo), currency, reference, ... }
};

module.exports = { isPaystackConfigured, verifyPaystackTransaction };
