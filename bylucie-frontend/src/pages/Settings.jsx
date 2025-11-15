import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Settings() {
  const { t, i18n } = useTranslation();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState(i18n.language || 'en');
  const [currency, setCurrency] = useState('USD');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      // Save settings (e.g., API or localStorage)
      setSuccess(t('Settings Saved'));  // Title Case visible string from translation JSON
    } catch (err) {
      setError(t('Settings Save Failed')); // Title Case
    }
  };

  return (
    <div className="w-4/5 mx-auto mt-24 p-8 bg-white rounded-lg shadow-md border border-[#b8860b]">
      <h1 className="text-3xl font-serif font-semibold text-[#b8860b] mb-6">
        {t('Settings')}
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 p-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={() => setNotificationsEnabled(!notificationsEnabled)}
              className="form-checkbox h-5 w-5 text-[#ff8c00] rounded focus:ring-[#ff8c00] focus:ring-opacity-50"
            />
            <span className="ml-3 text-gray-800 font-semibold">
              {t('Enable Notifications')}
            </span>
          </label>
        </div>

        <div>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={darkMode}
              onChange={() => setDarkMode(!darkMode)}
              className="form-checkbox h-5 w-5 text-[#ff8c00] rounded focus:ring-[#ff8c00] focus:ring-opacity-50"
            />
            <span className="ml-3 text-gray-800 font-semibold">{t('Dark Mode')}</span>
          </label>
        </div>

        <div>
          <label
            className="block text-gray-800 font-semibold mb-1"
            htmlFor="languageSelect"
          >
            {t('Language')}
          </label>
          <select
            id="languageSelect"
            value={language}
            onChange={handleLanguageChange}
            className="w-full border border-[#b8860b] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff8c00]"
          >
            <option value="en">English</option>
            <option value="sw">Swahili</option>
            <option value="fr">French</option>
            <option value="es">Spanish</option>
          </select>
        </div>

        <div>
          <label
            className="block text-gray-800 font-semibold mb-1"
            htmlFor="currencySelect"
          >
            {t('Currency')}
          </label>
          <select
            id="currencySelect"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full border border-[#b8860b] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff8c00]"
          >
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="KES">KES - Kenyan Shilling</option>
          </select>
        </div>

        <button
          type="submit"
          className="inline-flex items-center space-x-2 border border-[#b8860b] bg-white text-[#b8860b] hover:bg-[#b8860b] hover:text-white px-6 py-3 rounded-md transition font-semibold"
        >
          {t('Save Settings')}
        </button>
      </form>
    </div>
  );
}
