import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

function FormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  required = true,
  placeholder,
  autoComplete,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-900">
        {label} {required && <span aria-hidden="true">*</span>}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          name={id}
          type={inputType}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}

export default FormField;
