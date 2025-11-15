import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useRef, useContext, useEffect } from 'react';
import {
  FaShoppingCart,
  FaUserCircle,
  FaBars,
  FaTimes,
  FaSun,
  FaMoon,
} from 'react-icons/fa';
import { CartContext } from '../contexts/CartContext';
import { useUser, useClerk } from '@clerk/clerk-react';

export default function Navbar() {
  const user = useUser();
  const { signOut } = useClerk();
  const { cartItems } = useContext(CartContext);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') &&
          window.matchMedia('(prefers-color-scheme: dark)').matches)
      );
    }
    return false;
  });
  const profileRef = useRef(null);
  const dropdownRef = useRef(null);

  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const navLinksLeft = [
    { to: '/', label: 'Home' },
    { to: '/products', label: 'Products' },
  ];

  const navLinksRight = [
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const toggleProfileDropdown = () => setProfileDropdownOpen((prev) => !prev);

  const handleLogout = async () => {
    await signOut();
    setProfileDropdownOpen(false);
    navigate('/');
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setProfileDropdownOpen(false);
      }
    }
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  if (!user.isLoaded) return null;

  return (
    <nav
      role="navigation"
      aria-label="Main Navigation"
      className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300 bg-white dark:bg-gray-900"
      style={{ minHeight: 72 }}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">
        {/* Hamburger toggle button */}
        <button
          onClick={toggleMobileMenu}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          className="md:hidden p-2 rounded-md hover:bg-var(--color-earthyBrownLight) transition ml-4"
          style={{ backgroundColor: 'transparent', border: 'none', outline: 'none' }}
        >
          {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>

        {/* Left links */}
        <div className="hidden md:flex space-x-8 items-center">
          {navLinksLeft.map(({ to, label }) => (
            <NavLink
              key={label}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `font-serif text-base tracking-wide cursor-pointer transition-colors duration-200 ${
                  isActive
                    ? 'font-semibold border-b-2 border-yellow-400 dark:border-yellow-400'
                    : 'hover:text-yellow-400 dark:hover:text-yellow-400'
                }`
              }
              style={({ isActive }) => ({
                color: isActive ? 'var(--color-sunGold)' : 'var(--color-text)',
              })}
              aria-label={label}
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Logo */}
        <NavLink
          to="/"
          className="text-2xl font-serif font-bold tracking-wide select-none mx-4 text-forestGreenDark dark:text-forestGreenLight"
          aria-label="Homepage"
        >
          bylucie jewelry
        </NavLink>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex space-x-8 items-center mr-4">
            {navLinksRight.map(({ to, label }) => (
              <NavLink
                key={label}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `font-serif text-base tracking-wide cursor-pointer transition-colors duration-200 ${
                    isActive
                      ? 'font-semibold border-b-2 border-yellow-400 dark:border-yellow-400'
                      : 'hover:text-yellow-400 dark:hover:text-yellow-400'
                  }`
                }
                style={({ isActive }) => ({
                  color: isActive ? 'var(--color-sunGold)' : 'var(--color-text)',
                })}
                aria-label={label}
              >
                {label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center space-x-4 relative mr-4">
            {user.isSignedIn ? (
              <>
                <div
                  className="relative flex items-center space-x-2 cursor-pointer select-none"
                  ref={profileRef}
                >
                  <button
                    onClick={toggleProfileDropdown}
                    className="flex items-center space-x-2 focus:outline-none"
                    aria-haspopup="true"
                    aria-expanded={profileDropdownOpen}
                    aria-label="User menu"
                    style={{ background: 'transparent', border: 'none', padding: 0 }}
                  >
                    {user.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={`${user.firstName || 'User'} profile`}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <FaUserCircle size={28} color="var(--color-forestGreenDark)" />
                    )}
                    <span className="font-semibold select-none text-current">
                      Hi, {user.firstName || 'User'}
                    </span>
                  </button>
                </div>
                {profileDropdownOpen && (
                  <ul
                    ref={dropdownRef}
                    className="absolute right-0 mt-1 w-48 py-2 bg-var(--color-bg) border border-var(--color-border) rounded-md shadow-lg z-50"
                    style={{ top: 'calc(100% + 8px)' }}
                    role="menu"
                    aria-label="User profile options"
                  >
                    <li>
                      <NavLink
                        to="/profile"
                        className="block px-4 py-2 hover:bg-var(--color-sunGoldHighlight) hover:text-var(--color-forestGreenDark)"
                        role="menuitem"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        Edit Profile
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        to="/settings"
                        className="block px-4 py-2 hover:bg-var(--color-sunGoldHighlight) hover:text-var(--color-forestGreenDark)"
                        role="menuitem"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        Settings
                      </NavLink>
                    </li>
                    <li>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 hover:bg-var(--color-sunGoldHighlight) hover:text-var(--color-forestGreenDark)"
                        role="menuitem"
                      >
                        Sign Out
                      </button>
                    </li>
                  </ul>
                )}
              </>
            ) : (
              <div className="flex space-x-4">
                <NavLink
                  to="/sign-in"
                  className="px-4 py-2 text-base font-medium font-serif border border-var(--color-sunGold) rounded-lg text-var(--color-sunGold) hover:bg-var(--color-sunGold) hover:text-var(--color-bg) transition"
                  aria-label="Sign In"
                >
                  Sign In
                </NavLink>
                <NavLink
                  to="/sign-up"
                  className="px-4 py-2 text-base font-medium font-serif bg-var(--color-sunGold) rounded-lg text-var(--color-bg) hover:bg-var(--color-earthyBrownLight) transition"
                  aria-label="Sign Up"
                >
                  Sign Up
                </NavLink>
              </div>
            )}

            <NavLink
              to="/cart"
              aria-label="Shopping Cart"
              className="hover:text-var(--color-sunGoldHighlight) transition-colors duration-200 relative"
              style={{ color: 'var(--color-forestGreenDark)' }}
            >
              <FaShoppingCart size={24} />
              {itemCount > 0 && (
                <span
                  className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full"
                  style={{
                    backgroundColor: 'var(--color-sunGoldHighlight)',
                    color: 'var(--color-forestGreenDark)',
                    minWidth: 18,
                    height: 18,
                    fontSize: '0.75rem',
                    lineHeight: 1,
                  }}
                >
                  {itemCount}
                </span>
              )}
            </NavLink>
          </div>

          <button
            onClick={toggleDarkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-1 rounded-md hover:bg-var(--color-earthyBrownLight) transition ml-2"
            style={{ backgroundColor: 'transparent', border: 'none', outline: 'none' }}
          >
            {darkMode ? (
              <FaSun size={20} color="var(--color-sunGold)" />
            ) : (
              <FaMoon size={20} color="var(--color-earthyBrownDark)" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-var(--color-bg) border-t border-var(--color-border) shadow-inner">
          <nav className="flex flex-col">
            {[...navLinksLeft, ...navLinksRight].map(({ to, label }) => (
              <NavLink
                key={label}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `block px-6 py-4 font-serif cursor-pointer border-b border-var(--color-border) tracking-wide text-lg ${
                    isActive
                      ? 'bg-var(--color-sunGoldHighlight) text-var(--color-forestGreenDark)'
                      : 'text-var(--color-text) hover:bg-var(--color-earthyBrownLight) hover:text-var(--color-creamBg)'
                  }`
                }
                aria-label={label}
                onClick={() => setMobileMenuOpen(false)}
              >
                {label}
              </NavLink>
            ))}
            {!user.isSignedIn && (
              <>
                <NavLink
                  to="/sign-in"
                  className="block px-6 py-4 font-serif cursor-pointer border-b border-var(--color-border) tracking-wide text-lg text-var(--color-sunGold) hover:bg-var(--color-earthyBrownLight) hover:text-var(--color-creamBg)"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </NavLink>
                <NavLink
                  to="/sign-up"
                  className="block px-6 py-4 font-serif cursor-pointer border-b border-var(--color-border) tracking-wide text-lg bg-var(--color-sunGold) text-var(--color-creamBg) hover:bg-var(--color-earthyBrownLight)"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </NavLink>
              </>
            )}
          </nav>
        </div>
      )}

      <style>{`
        .hover\\:text-primaryHighlight:hover {
          color: var(--color-sunGold) !important;
        }
        .border-b-2 {
          border-bottom-width: 2px;
        }
      `}</style>
    </nav>
  );
}
