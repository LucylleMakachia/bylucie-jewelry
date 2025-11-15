import { clerkMiddleware, requireAuth, getAuth } from '@clerk/express';
import { createClerkClient } from '@clerk/backend';

// Create Clerk client with SECRET KEY for proper token verification
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY, 
  apiVersion: 'v1'
});

// Global Clerk middleware that verifies tokens and attaches auth to req.auth
export const clerkAuthMiddleware = clerkMiddleware();

// Debug middleware to see what Clerk is detecting
export const debugAuth = (req, res, next) => {
  console.log('=== 🔍 DEBUG AUTH MIDDLEWARE ===');
  console.log('📝 Request path:', req.path);
  console.log('📝 Request method:', req.method);
  console.log('🔑 Auth headers present:', {
    authorization: !!req.headers.authorization,
    cookie: !!req.headers.cookie
  });
  
  try {
    const auth = getAuth(req);
    console.log('👤 Auth object from getAuth:', {
      hasAuth: !!auth,
      userId: auth?.userId,
      sessionClaims: auth?.sessionClaims ? 'Present' : 'Missing',
      publicMetadata: auth?.sessionClaims?.publicMetadata
    });
    
    if (auth?.sessionClaims) {
      console.log('📋 Full session claims:', JSON.stringify(auth.sessionClaims, null, 2));
    }
  } catch (error) {
    console.log('❌ Error in getAuth:', error.message);
  }
  
  console.log('=== END DEBUG ===');
  next();
};

// Enhanced authentication middleware with proper token verification
export const authenticateClerk = requireAuth({
  onError: (err, req, res, next) => {
    console.error('🔐 Clerk authentication error:', err);

    // Handle authentication errors with appropriate responses
    if (err.status === 401) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Authentication required' 
      });
    }

    if (err.name === 'TokenExpiredError' || err.message.includes('token')) {
      return res.status(401).json({ 
        error: 'Session expired', 
        message: 'Please refresh your session' 
      });
    }

    return res.status(500).json({ 
      error: 'Authentication failed',
      message: 'Internal server error during authentication'
    });
  },
});

// Helper function with timeout for Clerk API calls
async function withTimeout(promise, timeoutMs = 5000) {
  let timeoutHandle;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error(`Clerk API call timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutHandle);
    return result;
  } catch (error) {
    clearTimeout(timeoutHandle);
    throw error;
  }
}

// Middleware to fetch Clerk user details and attach to req.user
export async function attachClerkUser(req, res, next) {
  console.log('🔐 attachClerkUser middleware called');
  
  try {
    const { userId, sessionClaims } = getAuth(req);
    console.log('👤 User ID from getAuth:', userId);
    console.log('📋 Session claims present:', !!sessionClaims);

    if (!userId) {
      console.log('❌ No user ID found in request');
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No authentication information found' 
      });
    }

    // Try to use session claims first (optimized - no API call)
    if (sessionClaims && sessionClaims.publicMetadata) {
      console.log('✅ Using session claims for user data');
      req.user = {
        id: userId,
        email: sessionClaims.email,
        roles: sessionClaims.publicMetadata.roles || sessionClaims.publicMetadata.role || ['user'],
        permissions: sessionClaims.publicMetadata.permissions || [],
        firstName: sessionClaims.firstName,
        lastName: sessionClaims.lastName,
      };
      console.log(`✅ Attached user from session: ${req.user.email} with roles:`, req.user.roles);
      return next();
    }

    // Fallback to API call if session claims don't have metadata
    console.log('🔄 Falling back to API call for user data...');
    
    // Use timeout to prevent hanging
    const clerkUser = await withTimeout(
      clerkClient.users.getUser(userId),
      8000 // 8 second timeout
    );

    if (!clerkUser) {
      console.log('❌ User not found in Clerk');
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'User not found' 
      });
    }

    // Attach user info including roles and permissions
    req.user = {
      id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress,
      roles: clerkUser.publicMetadata?.roles || clerkUser.publicMetadata?.role || ['user'],
      permissions: clerkUser.publicMetadata?.permissions || [],
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      createdAt: clerkUser.createdAt
    };

    console.log(`✅ Attached user via API: ${req.user.email} with roles:`, req.user.roles);
    next();
  } catch (err) {
    console.error('❌ Error fetching user from Clerk:', err);

    // Handle timeout specifically
    if (err.message.includes('timed out')) {
      console.error('⏰ Clerk API timeout - using fallback user data');
      // Create a minimal user object to allow the request to proceed
      const { userId } = getAuth(req);
      req.user = {
        id: userId,
        email: 'unknown@example.com',
        roles: ['user'], // Default to user role for safety
        permissions: [],
        firstName: 'User',
        lastName: 'Unknown'
      };
      console.log('⚠️ Using fallback user data due to Clerk API timeout');
      return next();
    }

    if (err.status === 404) {
      return res.status(404).json({ 
        error: 'User not found', 
        message: 'The authenticated user was not found in the system' 
      });
    }

    if (err.status === 401) {
      return res.status(401).json({ 
        error: 'Invalid token', 
        message: 'Authentication token is invalid' 
      });
    }

    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to retrieve user information' 
    });
  }
}

// Middleware to verify token sessions explicitly (optional additional security)
export async function verifyClerkToken(req, res, next) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No authentication token provided' 
      });
    }

    const sessions = await withTimeout(
      clerkClient.sessions.getSessionList({
        userId: userId,
        status: 'active'
      }),
      5000
    );

    if (sessions.length === 0) {
      return res.status(401).json({ 
        error: 'Session expired', 
        message: 'No active sessions found' 
      });
    }

    next();
  } catch (err) {
    console.error('Token verification error:', err);
    
    // Allow request to continue on timeout
    if (err.message.includes('timed out')) {
      console.warn('⚠️ Session verification timed out, allowing request to continue');
      return next();
    }
    
    return res.status(401).json({ 
      error: 'Token verification failed', 
      message: 'Failed to verify authentication token' 
    });
  }
}

// Middleware to enforce admin role requirement
export function requireAdmin(req, res, next) {
  console.log('🔒 requireAdmin middleware called');
  console.log('👤 req.user exists:', !!req.user);
  
  if (!req.user) {
    console.log('❌ requireAdmin: User information not available');
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'User information not available' 
    });
  }

  // Support both 'admin' role in array or single role
  const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.roles];
  console.log('🎭 User roles:', userRoles);
  
  if (!userRoles.includes('admin')) {
    console.warn(`🚫 Forbidden access attempt - User ${req.user.id} (${req.user.email}) missing admin role. Current roles:`, userRoles);
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Administrator privileges required' 
    });
  }

  console.log(`✅ Admin access granted to user ${req.user.email}`);
  next();
}

// Middleware for flexible role-based access control
export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'User information not available' 
      });
    }

    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.roles];
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      console.warn(`Forbidden - User ${req.user.id} missing required role(s). Required: ${requiredRoles}, Current: ${userRoles}`);
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `Required role(s) missing: ${requiredRoles}` 
      });
    }

    next();
  };
}

// Optional authentication middleware for routes where auth is optional
export const optionalAuth = clerkMiddleware();

// Utility to manually verify a JWT token if needed
export async function verifyToken(token) {
  try {
    const jwt = await withTimeout(
      clerkClient.verifyToken(token),
      5000
    );
    return { valid: true, payload: jwt };
  } catch (err) {
    console.error('Token verification failed:', err);
    return { valid: false, error: err.message };
  }
}