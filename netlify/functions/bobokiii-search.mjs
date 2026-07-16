// Netlify Function: Proxy search for car chapters on bobokiii.car.blog
// Called as: /.netlify/functions/bobokiii-search?title=解药
export default async function handler(req) {
  const url = new URL(req.url);
  const title = url.searchParams.get('title');
  if (!title) {
    return new Response(JSON.stringify({ error: 'Missing title param' }), { status: 400 });
  }

  try {
    // Search bobokiii
    const searchUrl = `https://bobokiii.car.blog/?s=${encodeURIComponent(title)}`;
    const resp = await fetch(searchUrl);
    const html = await resp.text();

    // Extract post links matching the title
    const postRegex = /<a[^>]*href="(https:\/\/bobokiii\.car\.blog\/\d{4}\/\d{2}\/\d{2}\/[^"]+)"[^>]*>([^<]+)<\/a>/g;
    let match;
    const posts = [];
    while ((match = postRegex.exec(html)) !== null) {
      posts.push({ url: match[1], title: match[2].trim() });
    }

    // Find the matching post and extract chapter numbers
    for (const post of posts) {
      if (post.title.includes(title)) {
        const postResp = await fetch(post.url);
        const postHtml = await postResp.text();
        const contentMatch = postHtml.match(/<div class="entry-content">(.*?)<\/div>/s);
        if (contentMatch) {
          const text = contentMatch[1].replace(/<[^>]+>/g, ' ').trim();
          const firstLine = text.split('\n')[0].trim();
          // Parse chapter numbers: e.g., "60 | 70 | 79 | 82" or "番外2 | 番外3"
          const chapters = [];
          for (const part of firstLine.split(/[ |，,\n]+/)) {
            const p = part.trim();
            if (/^\d+$/.test(p)) {
              chapters.push(parseInt(p));
            } else if (/^番外/.test(p)) {
              const n = p.match(/(\d+)/);
              chapters.push(1000 + (n ? parseInt(n[1]) : 1));
            } else if (/^Chapter\s*\d+$/i.test(p)) {
              chapters.push(parseInt(p.match(/\d+/)[0]));
            }
          }
          return new Response(JSON.stringify({ found: true, chapters }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
      }
    }

    return new Response(JSON.stringify({ found: false, chapters: [] }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
