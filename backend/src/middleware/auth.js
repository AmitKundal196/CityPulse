/**
 * Role-Based Access Control Middleware for Civic Complaints & System Operations
 *
 * Enforces role checks:
 * - Citizens: can view complaints and submit new complaints (status forced to OPEN).
 * - Municipal Operators / Admins: can update status (OPEN -> IN_REVIEW -> RESOLVED), reopen, and add resolution notes.
 */
function requireAdminOrOperator(req, res, next) {
  // Extract user role from headers (x-user-role, x-role, or authorization token)
  const roleHeader = req.headers['x-user-role'] || req.headers['x-role'];
  const userId = req.headers['x-user-id'] || 'admin-operator-1';

  let role = (roleHeader || '').toLowerCase().trim();

  // Check Bearer token fallback if present
  const authHeader = req.headers['authorization'];
  if (!role && authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token === 'admin-token' || token === 'municipal-operator-token') {
      role = 'admin';
    }
  }

  req.user = {
    id: userId,
    role: role || 'citizen'
  };

  // Strictly enforce role check
  if (req.user.role !== 'admin' && req.user.role !== 'municipal_operator') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Status updates are restricted to authorized administrators and municipal operators.',
      requiredRoles: ['admin', 'municipal_operator'],
      currentRole: req.user.role
    });
  }

  next();
}

module.exports = { requireAdminOrOperator };
