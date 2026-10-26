// TaskMint APK download proxy (Vercel serverless).
//
// Why this exists: GitHub release assets are served from
// release-assets.githubusercontent.com WITHOUT CORS headers, so the
// download page cannot stream the file itself to show live progress
// (% / speed / ETA). This function streams the SAME official APK
// through taskmint.click's own origin instead.
//
//   GET /api/download            → latest version
//   GET /api/download?v=v1.21    → that version
//
// Only the fixed TaskMint.apk asset of earnhalal/TaskMint releases can
// ever be fetched — the tag is strictly validated, so this is not an
// open proxy. Range requests are forwarded (the asset host honours
// them), which lets the page resume an interrupted stream and lets
// slow connections finish in slices under the function time limit.

const TAG_RE = /^v\d+\.\d+$/;

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405).send('Method not allowed');
    return;
  }

  const v = typeof req.query?.v === 'string' ? req.query.v : '';
  let upstream;
  if (v) {
    if (!TAG_RE.test(v)) {
      res.status(400).send('Invalid version');
      return;
    }
    upstream = `https://github.com/earnhalal/TaskMint/releases/download/${v}/TaskMint.apk`;
  } else {
    upstream = 'https://github.com/earnhalal/TaskMint/releases/latest/download/TaskMint.apk';
  }
  const fileName = v ? `TaskMint-${v}.apk` : 'TaskMint.apk';

  const upstreamHeaders = {};
  if (typeof req.headers.range === 'string' && /^bytes=\d+-$/.test(req.headers.range)) {
    upstreamHeaders.Range = req.headers.range;
  }

  let up;
  try {
    up = await fetch(upstream, { headers: upstreamHeaders, redirect: 'follow' });
  } catch {
    res.status(502).send('Download source unavailable');
    return;
  }
  if (!up.ok && up.status !== 206) {
    res.status(up.status === 404 ? 404 : 502).send('APK not found');
    return;
  }

  res.status(up.status);
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  const len = up.headers.get('content-length');
  if (len) res.setHeader('Content-Length', len);
  const range = up.headers.get('content-range');
  if (range) res.setHeader('Content-Range', range);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'HEAD' || !up.body) {
    res.end();
    return;
  }

  const reader = up.body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value && !res.write(Buffer.from(value))) {
        await new Promise((resolve) => res.once('drain', resolve));
      }
    }
    res.end();
  } catch {
    // Client went away or the upstream stream broke mid-way. The page
    // downloader resumes with a Range request when that happens.
    try {
      res.end();
    } catch {
      /* already closed */
    }
  }
}
