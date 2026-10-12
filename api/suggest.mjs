// Search suggestions for the Celerity extension.
// GET /api/suggest?q=weather&hl=en-ZA returns a JSON array of Google suggestions.
//
// The extension can't fetch Google's suggestions itself. Manifest V3 bans
// remote scripts, and Google's endpoint sends no CORS headers. This function
// fetches them and hands back plain JSON, which the extension may read
// without any extra permission. Queries are never logged or stored.

const GOOGLE_SUGGEST_URL = "https://suggestqueries.google.com/complete/search";
const MAX_QUERY_LENGTH = 100;
const LANGUAGE = /^[a-z]{2,3}(-[a-z0-9]{2,8})?$/i;
const COUNTRY = /^[A-Z]{2}$/;

// Only the extension and local development may read replies, so other
// websites can't borrow this server for their own search boxes.
// TODO: once Celerity is on the Chrome Web Store, narrow this to its store ID.
function allowedOrigin(origin) {
  if (/^chrome-extension:\/\/[a-p]{32}$/.test(origin)) return origin;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
  return null;
}

function reply(request, suggestions, status, cacheControl) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": cacheControl,
    Vary: "Origin",
  };
  const origin = allowedOrigin(request.headers.get("origin") ?? "");
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return new Response(JSON.stringify(suggestions), { status, headers });
}

export async function GET(request) {
  // Browsers always send an Origin here. Turn other sites away before
  // spending a call to Google that they couldn't read anyway.
  const origin = request.headers.get("origin");
  if (origin && !allowedOrigin(origin)) return reply(request, [], 403, "no-store");

  const params = new URL(request.url).searchParams;
  const query = (params.get("q") ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  if (!query) return reply(request, [], 400, "no-store");

  const language = params.get("hl") ?? "";
  // Vercel sets the visitor's country. Passing it on keeps suggestions
  // local, because the function itself may run in another country.
  const country = request.headers.get("x-vercel-ip-country") ?? "";

  const upstream = new URL(GOOGLE_SUGGEST_URL);
  upstream.search = new URLSearchParams({
    client: "firefox",
    oe: "utf-8",
    hl: LANGUAGE.test(language) ? language : "en",
    q: query,
  });
  if (COUNTRY.test(country)) upstream.searchParams.set("gl", country);

  try {
    const response = await fetch(upstream, { signal: AbortSignal.timeout(2000) });
    if (!response.ok) return reply(request, [], 502, "no-store");

    const [, suggestions] = await response.json();
    const phrases = Array.isArray(suggestions)
      ? suggestions.filter((phrase) => typeof phrase === "string")
      : [];
    // Suggestions change slowly, so the browser may reuse a reply for an hour.
    return reply(request, phrases, 200, "private, max-age=3600");
  } catch {
    // Timeout or bad reply. Search still works without suggestions.
    return reply(request, [], 502, "no-store");
  }
}
