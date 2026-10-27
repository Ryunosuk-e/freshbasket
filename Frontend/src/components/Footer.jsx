import { Link } from 'react-router-dom';
import { Leaf, MapPin, Phone, Mail, ShieldCheck, Heart, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-gray-300 bg-gray-100 pt-16 pb-12 text-gray-700 shadow-inner">
      <div className="mx-auto max-w-7xl px-6 sm:px-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand & Mission */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-800 text-white shadow-xs">
                <Leaf size={18} />
              </span>
              <span className="text-xl font-bold text-gray-900 tracking-tight">
                FreshBasket<span className="text-emerald-700">.</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-xs leading-relaxed text-gray-600">
              A localized online agricultural and food market platform connecting University of Nigeria, Nsukka
              (UNN) students, staff, and residents with verified local traders across Ogige Market and campus environs.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 px-3 py-1 font-semibold text-emerald-900">
                <ShieldCheck size={14} className="text-emerald-700" />
                Verified Local Vendors
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-200 px-3 py-1 text-gray-700 font-medium">
                Paystack PCI-DSS Certified
              </span>
            </div>
          </div>

          {/* Market Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Marketplace</h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <Link to="/shop" className="hover:text-emerald-800 transition">
                  All Groceries
                </Link>
              </li>
              <li>
                <Link to="/shop?category=fruits-vegetables" className="hover:text-emerald-800 transition">
                  Fruits & Fresh Vegetables
                </Link>
              </li>
              <li>
                <Link to="/shop?category=grains-cereals" className="hover:text-emerald-800 transition">
                  Grains, Rice & Cereals
                </Link>
              </li>
              <li>
                <Link to="/shop?category=meat-fish" className="hover:text-emerald-800 transition">
                  Butchery, Catfish & Poultry
                </Link>
              </li>
              <li>
                <Link to="/shop?category=spices-seasonings" className="hover:text-emerald-800 transition">
                  Cooking Spices & Oils
                </Link>
              </li>
              <li>
                <Link to="/shop?category=cooking-utensils" className="hover:text-emerald-800 transition">
                  Cooking Utensils & Pots
                </Link>
              </li>
            </ul>
          </div>

          {/* Delivery Hubs */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Nsukka Hubs</h3>
            <ul className="mt-4 space-y-2.5 text-xs text-gray-600">
              <li className="flex items-center gap-1.5">
                <MapPin size={13} className="text-emerald-700 shrink-0" />
                <span>Ogige Modern Market</span>
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin size={13} className="text-emerald-700 shrink-0" />
                <span>Hilltop Commercial Area</span>
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin size={13} className="text-emerald-700 shrink-0" />
                <span>Behind Flat / Market Road</span>
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin size={13} className="text-emerald-700 shrink-0" />
                <span>Odenigwe & Green House</span>
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin size={13} className="text-emerald-700 shrink-0" />
                <span>UNN Campus Hostels</span>
              </li>
            </ul>
          </div>

          {/* Support & Academic Info */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Contact & Support</h3>
            <ul className="mt-4 space-y-2.5 text-xs text-gray-600">
              <li className="flex items-center gap-2">
                <Mail size={13} className="text-emerald-700 shrink-0" />
                <a href="mailto:support@freshbasketnsukka.com" className="font-semibold text-emerald-800 hover:underline">
                  support@freshbasketnsukka.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={13} className="text-emerald-700 shrink-0" />
                <a href="tel:+2348086329812" className="font-semibold text-emerald-800 hover:underline">
                  +2348086329812
                </a>
              </li>
              <li className="pt-2 text-[11px] leading-relaxed text-gray-500">
                FreshBasket Logistics & Operations, Nsukka, Enugu State, Nigeria.
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-gray-200 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} FreshBasket Nsukka. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-gray-600">
            <span>NDPA 2023 Compliant</span>
            <span>Speedy Hostel Dispatch</span>
            <Link to="/register" state={{ role: 'vendor' }} className="font-semibold text-emerald-800 hover:underline">
              Sell on FreshBasket
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
