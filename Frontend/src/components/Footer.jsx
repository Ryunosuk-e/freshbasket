import { Link } from 'react-router-dom';
import { Leaf, MapPin, Phone, Mail, ShieldCheck, Heart, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white pt-16 pb-12 text-gray-600">
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
            <p className="mt-4 max-w-sm text-xs leading-relaxed text-gray-500">
              A localized online agricultural and food market platform connecting University of Nigeria, Nsukka
              (UNN) students, staff, and residents with verified local traders across Ogige Market and campus environs.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-800">
                <ShieldCheck size={14} className="text-emerald-600" />
                Verified Local Vendors
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-gray-600">
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
                <Link to="/shop?sort=price_asc" className="hover:text-emerald-800 transition flex items-center gap-1">
                  Compare Prices
                  <ArrowUpRight size={12} className="text-emerald-700" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Delivery Hubs */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Nsukka Hubs</h3>
            <ul className="mt-4 space-y-2.5 text-xs text-gray-500">
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
            <ul className="mt-4 space-y-2.5 text-xs text-gray-500">
              <li className="flex items-center gap-2">
                <Mail size={13} className="text-emerald-700 shrink-0" />
                <a href="mailto:support@freshbasket.unn.edu.ng" className="hover:underline">
                  support@freshbasket.unn.edu.ng
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={13} className="text-emerald-700 shrink-0" />
                <span>+234 803 123 4567</span>
              </li>
              <li className="pt-2 text-[11px] leading-relaxed text-gray-400">
                Department of Computer Science, Faculty of Physical Sciences, University of Nigeria, Nsukka.
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-gray-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>
            &copy; 2026 FreshBasket Nsukka. Supervised by Dr. Mrs. A. E. Ezema.
          </p>
          <div className="flex items-center gap-6 text-gray-500">
            <span>NDPA 2023 Compliant</span>
            <span>Local Dispatch</span>
            <Link to="/register" className="font-semibold text-emerald-800 hover:underline">
              Sell on FreshBasket
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
