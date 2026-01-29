import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./server/auth";

// Define user roles type based on your session structure
type UserRole = "user" | "admin" | "seller" | "super-admin";

// Define types for route configurations
type RoutePattern = string;
interface RouteAccess {
  PUBLIC: RoutePattern[];
  AUTHENTICATED: RoutePattern[];
  ROLE_PATHS: {
    [key in UserRole]?: {
      exact: RoutePattern[];
      startsWith: RoutePattern[];
    };
  };
}

// Define route access patterns
const ROUTE_ACCESS: RouteAccess = {
  PUBLIC: [
    "/",
    "/auth/login",
    "/auth/register",
    "/products",
    "/product/:id",
    "/search",
    "/404",
  ],
  AUTHENTICATED: ["/user/profile", "/user/settings", "/user/cart"],
  ROLE_PATHS: {
    user: {
      exact: [],
      startsWith: ["/user"],
    },
    seller: {
      exact: ["/seller"],
      startsWith: ["/seller/", "/dashboard/seller"],
    },
    admin: {
      exact: ["/admin"],
      startsWith: ["/admin/", "/dashboard/"],
    },
    "super-admin": {
      exact: ["/super-admin"],
      startsWith: ["/super-admin/", "/admin/", "/dashboard/"],
    },
  },
};

// Helper function to check if a path starts with any of the patterns
const matchesPathStart = (path: string, patterns: string[]): boolean => {
  return patterns.some((pattern) => {
    const normalizedPath = path.endsWith("/") ? path.slice(0, -1) : path;
    const normalizedPattern = pattern.endsWith("/")
      ? pattern.slice(0, -1)
      : pattern;
    return normalizedPath.startsWith(normalizedPattern);
  });
};

// Helper function to check if path matches exact route pattern
const matchExactRoute = (path: string, pattern: string): boolean => {
  const regex = pattern.replace(/:[^/]+/g, "[^/]+").replace(/\//g, "\\/");
  return new RegExp(`^${regex}$`).test(path);
};

// Helper function to check if a route is accessible to a role
const isRouteAccessibleToRole = (
  path: string,
  userRoles: string[],
  isAuthenticated: boolean
): boolean => {
  // Check public routes first
  if (ROUTE_ACCESS.PUBLIC.some((route) => matchExactRoute(path, route))) {
    return true;
  }

  // If not authenticated, only allow public routes
  if (!isAuthenticated) {
    return false;
  }

  // Check authenticated routes
  if (
    ROUTE_ACCESS.AUTHENTICATED.some((route) => matchExactRoute(path, route))
  ) {
    return true;
  }

  // Check role-specific permissions
  return userRoles.some((role) => {
    const rolePaths = ROUTE_ACCESS.ROLE_PATHS[role as UserRole];
    if (!rolePaths) return false;

    // Admin can access everything (based on your roles structure)
    if (role === "admin") return true;

    // Check exact matches
    if (rolePaths.exact.some((route) => matchExactRoute(path, route))) {
      return true;
    }

    // Check path prefixes
    if (matchesPathStart(path, rolePaths.startsWith)) {
      return true;
    }

    return false;
  });
};

// Middleware function
export default async function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const path = nextUrl.pathname;

  // Skip middleware for static files and resources
  if (
    path.startsWith("/_next") ||
    path.startsWith("/static") ||
    path.includes(".") ||
    path === "/404"
  ) {
    return NextResponse.next();
  }

  // Get the session using Auth.js v5
  const session = await auth();

  // Get authentication status and roles from the session
  const isAuthenticated = !!session?.user;
  const userRoles = (session?.user?.role as string[]) || [];

  // Check if the route is accessible
  const canAccess = isRouteAccessibleToRole(path, userRoles, isAuthenticated);

  if (!canAccess) {
    // You might want to redirect to login for authenticated routes
    if (!isAuthenticated && !ROUTE_ACCESS.PUBLIC.includes(path)) {
      // return NextResponse.redirect(new URL("/auth/login", req.url));
      return NextResponse.redirect(new URL("/api/auth/signin", req.url));
    }
    // Otherwise redirect to 404
    return NextResponse.redirect(new URL("/404", req.url));
  }

  return NextResponse.next();
}

// Matcher configuration
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
