import { useEffect, useState } from 'react';
import { Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';
import GroceryIllustration from './GroceryIllustration.jsx';

function AuthLayout({ highlights, children }) {
  const [activeHighlight, setActiveHighlight] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHighlight((prev) => (prev + 1) % highlights.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [highlights.length]);

  return (
    <div className="flex min-h-screen w-full bg-white">
      <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-12 lg:w-[45%] lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link to="/" className="mb-10 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-800 text-white">
              <Leaf size={18} />
            </span>
            <span className="text-lg font-semibold text-gray-900">
              FreshBasket<span className="text-emerald-700">.</span>
            </span>
          </Link>

          {children}
        </div>
      </div>

      <div className="relative hidden p-4 lg:block lg:w-[55%]">
        <div className="relative h-full w-full overflow-hidden rounded-3xl">
          <GroceryIllustration className="h-full w-full" />
          <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-emerald-950/70 p-5 backdrop-blur-sm">
            <p className="text-sm leading-relaxed text-white/90">{highlights[activeHighlight]}</p>
            <div className="mt-4 flex gap-1.5">
              {highlights.map((highlight, index) => (
                <span
                  key={highlight}
                  className={`h-1.5 rounded-full transition-all ${
                    index === activeHighlight ? 'w-6 bg-amber-400' : 'w-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
