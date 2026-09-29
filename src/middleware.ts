import { NextResponse, type NextRequest } from "next/server";

// Site is paused unless SITE_PAUSED is explicitly set to "false".
const SITE_PAUSED = process.env.SITE_PAUSED !== "false";

const NOT_FOUND_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>404: This page could not be found.</title>
<style>
  body { margin: 0; height: 100vh; display: flex; align-items: center; justify-content: center;
    font-family: system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #fff; color: #000; }
  h1 { display: inline-block; margin: 0 20px 0 0; padding: 0 23px 0 0; font-size: 24px; font-weight: 500;
    vertical-align: top; line-height: 49px; border-right: 1px solid rgba(0, 0, 0, .3); }
  h2 { font-size: 14px; font-weight: 400; line-height: 49px; margin: 0; display: inline-block; }
  @media (prefers-color-scheme: dark) {
    body { background: #000; color: #fff; }
    h1 { border-right: 1px solid rgba(255, 255, 255, .3); }
  }
</style>
</head>
<body>
  <div><h1>404</h1><h2>This page could not be found.</h2></div>
</body>
</html>`;

export function middleware(req: NextRequest) {
  if (!SITE_PAUSED) return NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  return new NextResponse(NOT_FOUND_HTML, {
    status: 404,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
