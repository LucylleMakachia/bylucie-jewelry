import { getAuth } from '@clerk/express';

export const requireAdmin = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user from Clerk
    const user = req.auth;
    const userRoles = user?.publicMetadata?.roles || [];
    
    console.log('User roles for admin check:', userRoles); // Debug log
    
    if (!userRoles.includes('admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};