import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

export default function Button({ children, variant = 'primary', className, ...props }) {
  const baseClasses = 'rounded-md px-6 py-2 font-semibold transition focus:outline focus:outline-4 focus:outline-sunGoldHighlight';

  const variants = {
    primary: 'bg-sunGold text-creamBg hover:bg-sunGoldHighlight',
    secondary: 'bg-earthyBrownDark text-creamBg hover:bg-earthyBrownLight',
    outline: 'bg-transparent border border-sunGold text-sunGold hover:bg-sunGold hover:text-creamBg',
  };

  const combinedClasses = clsx(baseClasses, variants[variant], className);

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline']),
  className: PropTypes.string,
};
