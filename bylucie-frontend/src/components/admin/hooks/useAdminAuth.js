import { useState, useEffect } from 'react';

export const useAdminAuth = (user) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!user) {
      setAuthChecked(true);
      return;
    }
    
    const userRoles = user.publicMetadata?.roles || [];
    setIsAuthorized(userRoles.includes('admin'));
    setAuthChecked(true);
  }, [user]);

  return { isAuthorized, authChecked };
};