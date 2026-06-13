import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from './auth';

// ============================================
// Types
// ============================================

export interface ApiRequest extends NextApiRequest {
  user?: {
    uid: string;
    email: string;
    name?: string;
    permissions: string[];
    mustChangePassword: boolean;
  };
}

export type ApiHandler = (req: ApiRequest, res: NextApiResponse) => Promise<void>;

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

// ============================================
// Error Classes
// ============================================

export class BadRequestError extends Error implements ApiError {
  statusCode = 400;
  code = 'BAD_REQUEST';
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends Error implements ApiError {
  statusCode = 401;
  code = 'UNAUTHORIZED';
  constructor(message = 'Unauthorized: Login required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error implements ApiError {
  statusCode = 403;
  code = 'FORBIDDEN';
  constructor(message = 'Forbidden: Insufficient permissions', public details?: any) {
    super(message);
    this.name = 'ForbiddenError';
    this.details = details;
  }
}

export class NotFoundError extends Error implements ApiError {
  statusCode = 404;
  code = 'NOT_FOUND';
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error implements ApiError {
  statusCode = 409;
  code = 'CONFLICT';
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class InternalServerError extends Error implements ApiError {
  statusCode = 500;
  code = 'INTERNAL_SERVER_ERROR';
  constructor(message = 'Internal Server Error', public details?: any) {
    super(message);
    this.name = 'InternalServerError';
  }
}

// ============================================
// Middleware Options
// ============================================

export interface MiddlewareOptions {
  /** Required permission keys (e.g. 'viewEquipment') */
  requiredPermissions?: string[];
  /** Method-specific required permissions (e.g. { GET: ['viewAppointments'], POST: ['viewAppointments', 'manageAppointments'] }) */
  requiredPermissionsByMethod?: Record<string, string[]>;
  /** How required permissions are checked: all or any */
  permissionMode?: 'all' | 'any';
  /** Method-specific permission mode; falls back to permissionMode */
  permissionModeByMethod?: Record<string, 'all' | 'any'>;
  /** Optional roleUid gate in addition to permissions */
  allowWildcardPermission?: boolean;
  /** Whether authentication is optional (for public endpoints) */
  optionalAuth?: boolean;
  /** Whether detailed error information should be returned (only in development) */
  verboseErrors?: boolean;
}

function hasRequiredPermissions(
  userPermissions: string[],
  requiredPermissions: string[],
  mode: 'all' | 'any',
  allowWildcardPermission: boolean
): boolean {
  if (requiredPermissions.length === 0) {
    return true;
  }

  if (allowWildcardPermission && userPermissions.includes('*')) {
    return true;
  }

  if (mode === 'any') {
    return requiredPermissions.some((permission) => userPermissions.includes(permission));
  }

  return requiredPermissions.every((permission) => userPermissions.includes(permission));
}

// ============================================
// Error Handler
// ============================================

function handleApiError(error: any, res: NextApiResponse, verbose = false): void {
  console.error('[API Error]', {
    name: error.name,
    message: error.message,
    statusCode: error.statusCode,
    code: error.code,
    stack: verbose ? error.stack : undefined
  });

  const statusCode = error.statusCode || 500;
  
  const response: any = {
    success: false,
    error: {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred'
    }
  };

  const isDevInstance = process.env.DEV_INSTANCE === 'true';
  if (isDevInstance && error.details) {
    response.error.details = error.details;
  }

  // In Development: Füge Stack-Trace hinzu
  if (verbose && process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
  }

  res.status(statusCode).json(response);
}

// ============================================
// Main Middleware
// ============================================

/**
 * API Middleware with built-in authentication, authorization, and error handling.
 * 
 * @example
 * ```typescript
 * export default withApi(async (req, res) => {
 *   // req.user ist automatisch verfügbar
 *   return res.json({ message: 'Success', user: req.user });
 * }, { requiredPermissions: ['viewEquipment'] });
 * ```
 */
export function withApi(
  handler: ApiHandler,
  options: MiddlewareOptions = {}
): (req: NextApiRequest, res: NextApiResponse) => Promise<void> {
  const {
    requiredPermissions = [],
    requiredPermissionsByMethod = {},
    permissionMode = 'all',
    permissionModeByMethod = {},
    allowWildcardPermission = true,
    optionalAuth = false,
    verboseErrors = process.env.DEV_INSTANCE === 'true'
  } = options;

  return async (req: ApiRequest, res: NextApiResponse) => {
    try {
      const session = await getSession(req, res);

      if (!session && !optionalAuth) {
        throw new UnauthorizedError();
      }

      if (session) {
        const userUid: string = (session.user as any)?.uid || '';
        const userPermissions: string[] = Array.isArray((session.user as any)?.permissions)
          ? (session.user as any).permissions.filter((value: unknown): value is string => typeof value === 'string')
          : [];
        const userMustChangePassword: boolean = Boolean((session.user as any)?.mustChangePassword);

        req.user = {
          uid: userUid,
          email: session.user?.email || '',
          name: session.user?.name ?? undefined,
          permissions: userPermissions,
          mustChangePassword: userMustChangePassword
        };

        const method = (req.method || '').toUpperCase();
        const effectiveRequiredPermissions = requiredPermissionsByMethod[method] ?? requiredPermissions;
        const effectivePermissionMode = permissionModeByMethod[method] ?? permissionMode;

        if (!hasRequiredPermissions(userPermissions, effectiveRequiredPermissions, effectivePermissionMode, allowWildcardPermission)) {
          throw new ForbiddenError('Missing required permission', {
            method,
            userPermissions,
            requiredPermissions: effectiveRequiredPermissions,
            permissionMode: effectivePermissionMode,
            allowWildcardPermission
          });
        }
      }

      await handler(req, res);

    } catch (error: any) {
      handleApiError(error, res, verboseErrors);
    }
  };
}

// ============================================
// Utility Functions
// ============================================

export function requireQueryParams(
  req: NextApiRequest,
  params: string[]
): void {
  const missing = params.filter(param => !req.query[param]);
  if (missing.length > 0) {
    throw new BadRequestError('Missing required query parameters', { missing });
  }
}

export function requireBodyFields(
  body: any,
  fields: string[]
): void {
  if (!body || typeof body !== 'object') {
    throw new BadRequestError('Request body is required');
  }
  
  const missing = fields.filter(field => {
    const value = body[field];
    return value === undefined || value === null || value === '';
  });
  
  if (missing.length > 0) {
    throw new BadRequestError('Missing required fields', { missing });
  }
}


export function getUidFromQuery(query: string | string[] | undefined): string {
  if (!query) {
    throw new BadRequestError('uid is required');
  }
  return Array.isArray(query) ? query[0] : query;
}


export function successResponse(data: any, message?: string): any {
  return {
    success: true,
    ...(message && { message }),
    data
  };
}

export function requireMethod(
  req: NextApiRequest,
  res: NextApiResponse,
  allowedMethods: string[]
): void {
  if (!req.method || !allowedMethods.includes(req.method)) {
    res.setHeader('Allow', allowedMethods.join(', '));
    throw new ApiMethodNotAllowedError(`Method ${req.method} not allowed`, { allowedMethods });
  }
}

export class ApiMethodNotAllowedError extends Error implements ApiError {
  statusCode = 405;
  code = 'METHOD_NOT_ALLOWED';
  constructor(message = 'Method not allowed', public details?: any) {
    super(message);
    this.name = 'ApiMethodNotAllowedError';
  }
}
