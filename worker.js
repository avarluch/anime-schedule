// Cloudflare Workers CORS Proxy for NicoNico Anime Scheduler
// Deploy: https://dash.cloudflare.com → Workers → Create Worker → paste this code

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    const { searchParams } = new URL(request.url);
    const target = searchParams.get('url');

    if (!target) {
      return new Response('Missing ?url= parameter', { status: 400, headers: corsHeaders() });
    }

    let parsed;
    try {
      parsed = new URL(target);
    } catch {
      return new Response('Invalid URL', { status: 400, headers: corsHeaders() });
    }

    if (!parsed.hostname.endsWith('nicovideo.jp')) {
      return new Response('Forbidden: only nicovideo.jp is allowed', { status: 403, headers: corsHeaders() });
    }

    try {
      const res = await fetch(target, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
        },
        redirect: 'follow',
      });

      const body = await res.arrayBuffer();
      return new Response(body, {
        status: res.status,
        headers: {
          'Content-Type': res.headers.get('Content-Type') ?? 'text/html; charset=utf-8',
          ...corsHeaders(),
        },
      });
    } catch (err) {
      return new Response('Fetch failed: ' + err.message, { status: 502, headers: corsHeaders() });
    }
  },
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };
}
