import { NextResponse } from "next/server";

export const config = {
  matcher: "/integrations/:path*",
};

export function middleware(request) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-createxyz-project-id", "521fa73d-f4ac-4e6c-90bf-65598c65c7ac");
  requestHeaders.set("x-createxyz-project-group-id", "152c18d7-ef37-4567-92e1-ee8a72c2aaad");


  request.nextUrl.href = `https://www.create.xyz/${request.nextUrl.pathname}`;

  return NextResponse.rewrite(request.nextUrl, {
    request: {
      headers: requestHeaders,
    },
  });
}