import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const path = req.nextUrl.pathname;
  const isAuthPage = path.startsWith("/login") || path.startsWith("/register");
  const isAdmin = req.auth?.user?.role === "ADMIN";
  const isAdminArea = path.startsWith("/admin");

  if (!isLoggedIn && !isAuthPage && !isAdminArea) {
    return Response.redirect(new URL("/login", req.nextUrl.origin));
  }
  if (isLoggedIn && isAuthPage) {
    return Response.redirect(new URL(isAdmin ? "/admin" : "/home", req.nextUrl.origin));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
