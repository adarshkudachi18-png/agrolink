import { Languages } from 'lucide-react';
import { useState } from 'react';

declare global {
  interface Window {
    google?: any;
  }
}

export function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (langCode: string) => {
    const select = document.querySelector<HTMLSelectElement>('select.goog-te-combo');
    if (!select) return;

    select.value = langCode;
    select.dispatchEvent(new Event('change'));
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-1 rounded-full hover:bg-green-700/60 focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Change language"
      >
        <Languages className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white text-gray-900 rounded-lg shadow-lg z-50 text-sm">
          <button
            type="button"
            onClick={() => handleLanguageChange('en')}
            className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-t-lg"
          >
            English
          </button>
          <button
            type="button"
            onClick={() => handleLanguageChange('hi')}
            className="w-full text-left px-3 py-2 hover:bg-gray-100"
          >
            हिन्दी (Hindi)
          </button>
          <button
            type="button"
            onClick={() => handleLanguageChange('kn')}
            className="w-full text-left px-3 py-2 hover:bg-gray-100"
          >
            ಕನ್ನಡ (Kannada)
          </button>
          <button
            type="button"
            onClick={() => handleLanguageChange('mr')}
            className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-b-lg"
          >
            मराठी (Marathi)
          </button>
        </div>
      )}
    </div>
  );
}

