import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Carrot,
  ChevronDown,
  CreditCard,
  CupSoda,
  Fish,
  Home as HomeIcon,
  Leaf,
  Milk,
  Package,
  ShieldCheck,
  Truck,
  UserPlus,
  Wheat,
} from 'lucide-react';
import PublicHeader from '../components/PublicHeader.jsx';
import HeroIllustration from '../components/HeroIllustration.jsx';

const NAV_LINKS = [
  { href: '#categories', label: 'Categories' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#faq', label: 'FAQ' },
];

const TRUST_BADGES = [
  { icon: ShieldCheck, title: 'Verified Vendors', body: 'Every seller is reviewed before their storefront goes live.' },
  { icon: Truck, title: 'Local Delivery', body: 'Delivery agents coordinate pickup straight from Nsukka vendors.' },
  { icon: CreditCard, title: 'Flexible Payment', body: 'Pay by card through Paystack, or cash on delivery.' },
];

const CATEGORIES = [
  { icon: Carrot, label: 'Fruits & Vegetables', slug: 'fruits-vegetables' },
  { icon: Wheat, label: 'Grains & Cereals', slug: 'grains-cereals' },
  { icon: Milk, label: 'Dairy & Eggs', slug: 'dairy-eggs' },
  { icon: Fish, label: 'Meat & Fish', slug: 'meat-fish' },
  { icon: CupSoda, label: 'Beverages', slug: 'beverages' },
  { icon: HomeIcon, label: 'Household Essentials', slug: 'household-essentials' },
];

const STEPS = [
  { icon: UserPlus, title: 'Create your account', body: 'Sign up as a shopper or a vendor — it takes about a minute.' },
  { icon: Package, title: 'Browse or list groceries', body: 'Find fresh produce nearby, or list what your shop is selling.' },
  { icon: Truck, title: 'Get it delivered', body: 'Track your order from a verified local vendor to your door.' },
];

const FAQS = [
  {
    question: 'How do I become a vendor?',
    answer:
      'Sign up and choose "Sell as a vendor." Your application is reviewed by an admin before your storefront goes live.',
  },
  {
    question: 'What areas do you deliver to?',
    answer: "We're starting in Nsukka town, Enugu State, with more areas planned as the platform grows.",
  },
  {
    question: 'What payment methods are accepted?',
    answer: 'Card payments through Paystack, or cash on delivery — whichever works for you.',
  },
  {
    question: 'Is there a fee to sign up?',
    answer: 'No — creating an account is free for both customers and vendors.',
  },
];

function FaqItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className="border-b border-gray-100 py-4">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between text-left">
        <span className="font-medium text-gray-900">{question}</span>
        <ChevronDown size={18} className={`shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <p className="mt-2 text-sm text-gray-500">{answer}</p>}
    </div>
  );
}

function LandingPage() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader links={NAV_LINKS} />

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-10 sm:px-12 lg:grid-cols-2 lg:py-16">
        <div>
          <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            Now serving Nsukka
          </span>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-gray-900 sm:text-5xl">
            Fresh groceries from Nsukka&rsquo;s trusted vendors, delivered to your door
          </h1>
          <p className="mt-4 max-w-lg text-gray-600">
            Shop fruits, grains, dairy and more from verified local vendors — pay by card or cash on
            delivery, and know exactly who you're buying from.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/shop"
              className="flex items-center gap-2 rounded-full bg-emerald-800 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Browse Groceries
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/register"
              state={{ role: 'vendor' }}
              className="flex items-center gap-2 rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Sell on FreshBasket
            </Link>
          </div>
        </div>

        <HeroIllustration className="w-full" />
      </section>

      {/* Trust badges */}
      <section className="mx-auto max-w-6xl px-6 pb-6 sm:px-12">
        <div className="grid gap-4 rounded-3xl bg-gray-50 p-6 sm:grid-cols-3">
          {TRUST_BADGES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm">
                <Icon size={20} />
              </span>
              <div>
                <p className="font-medium text-gray-900">{title}</p>
                <p className="mt-0.5 text-sm text-gray-500">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="mx-auto max-w-6xl px-6 py-16 sm:px-12">
        <h2 className="text-2xl font-semibold text-gray-900">Shop by category</h2>
        <p className="mt-1 text-gray-500">Browse what's currently listed by verified Nsukka vendors.</p>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map(({ icon: Icon, label, slug }) => (
            <Link
              key={label}
              to={`/shop?category=${slug}`}
              className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 p-5 text-center transition hover:border-emerald-200 hover:bg-emerald-50/40"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <Icon size={22} />
              </span>
              <p className="text-sm font-medium text-gray-700">{label}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-emerald-50/60 py-16">
        <div className="mx-auto max-w-6xl px-6 sm:px-12">
          <h2 className="text-2xl font-semibold text-gray-900">How it works</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, index) => (
              <div key={title} className="rounded-2xl bg-white p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-800 text-white">
                    <Icon size={18} />
                  </span>
                  <span className="text-sm font-medium text-gray-400">Step {index + 1}</span>
                </div>
                <p className="mt-4 font-semibold text-gray-900">{title}</p>
                <p className="mt-1 text-sm text-gray-500">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-6 py-16 sm:px-12">
        <h2 className="text-2xl font-semibold text-gray-900">Questions? Look here.</h2>
        <div className="mt-6">
          {FAQS.map((faq, index) => (
            <FaqItem
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
              isOpen={openFaq === index}
              onToggle={() => setOpenFaq(openFaq === index ? -1 : index)}
            />
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-16 sm:px-12">
        <div className="flex flex-col items-start gap-6 rounded-3xl bg-emerald-800 p-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Ready to get started?</h2>
            <p className="mt-1 text-emerald-100">Join FreshBasket in less than a minute.</p>
          </div>
          <Link
            to="/register"
            className="flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-emerald-800 hover:bg-emerald-50"
          >
            Create your account
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-8 sm:px-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-gray-500 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-800 text-white">
              <Leaf size={14} />
            </span>
            <span className="font-medium text-gray-700">FreshBasket.</span>
          </div>
          <p>© 2026 FreshBasket — a final year project, Department of Computer Science, University of Nigeria, Nsukka.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
