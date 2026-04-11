#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const projectsPath = path.join(process.cwd(), 'src', 'routes', 'projects.json');
const outDir = path.join(process.cwd(), 'static', 'projects');

const userAgent = 'thumbnail-downloader/1.0 (+https://github.com)';

function slugify(text){
  return text.toString().toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/(^-|-$)/g,'')
    .slice(0,120);
}

async function ensureOutDir(){
  await fs.mkdir(outDir, { recursive: true });
}

async function fetchText(url){
  const res = await fetch(url, { headers: { 'User-Agent': userAgent } });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return await res.text();
}

function findMetaImage(html){
  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i);
  if (og && og[1]) return og[1];
  const tw = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i);
  if (tw && tw[1]) return tw[1];
  const img = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  if (img && img[1]) return img[1];
  return null;
}

function toAbsolute(url, base){
  if (!url) return null;
  if (url.startsWith('//')) return 'https:' + url;
  if (url.startsWith('http')) return url;
  try { return new URL(url, base).toString(); } catch { return null; }
}

function extFromContentType(ct, fallbackUrl){
  if (!ct && fallbackUrl){
    const m = fallbackUrl.match(/\.([a-z0-9]{2,5})(?:[\?|#]|$)/i);
    if (m) return m[1];
  }
  if (!ct) return 'jpg';
  if (ct.includes('png')) return 'png';
  if (ct.includes('gif')) return 'gif';
  if (ct.includes('svg')) return 'svg';
  if (ct.includes('webp')) return 'webp';
  return 'jpg';
}

async function downloadToFile(url, outPath){
  const res = await fetch(url, { headers: { 'User-Agent': userAgent } });
  if (!res.ok) throw new Error(`Failed to fetch image ${url}: ${res.status}`);
  const contentType = res.headers.get('content-type') || '';
  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outPath, buffer);
  return contentType;
}

async function main(){
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  console.log(dryRun ? 'Running in dry-run mode' : 'Running and will save images to static/projects/');

  const raw = await fs.readFile(projectsPath, 'utf8');
  const projects = JSON.parse(raw);
  await ensureOutDir();

  for (const p of projects){
    try {
      let candidate = null;

      // Prefer existing external image if not a placeholder
      if (p.image && /^https?:\/\//i.test(p.image) && !p.image.includes('placehold.co')){
        candidate = p.image;
      }

      // Otherwise fetch the project page and try to find og/twitter image
      if (!candidate && p.link){
        console.log(`Scanning page for ${p.title} -> ${p.link}`);
        const html = await fetchText(p.link);
        const found = findMetaImage(html);
        if (found) candidate = toAbsolute(found, p.link);
      }

      if (!candidate){
        console.log(`No candidate image for: ${p.title}`);
        continue;
      }

      // normalize protocol-relative
      candidate = toAbsolute(candidate, p.link || 'https://');
      if (!candidate) { console.log(`Could not resolve URL for ${p.title}`); continue; }

      const slug = slugify(p.title || p.link || Math.random().toString(36).slice(2,8));
      const extHint = (candidate.match(/\.([a-z0-9]{2,5})(?:[\?|#]|$)/i) || [])[1];
      const tempExt = extHint || 'jpg';
      const filename = `${slug}.${tempExt}`;
      const outPath = path.join(outDir, filename);

      if (dryRun){
        console.log(`[dry] Would download: ${candidate} -> ${outPath}`);
        p.image = `/projects/${filename}`;
        continue;
      }

      console.log(`Downloading ${candidate} -> ${outPath}`);
      const contentType = await downloadToFile(candidate, outPath);
      const realExt = extFromContentType(contentType, candidate);

      if (realExt !== tempExt){
        const realName = `${slug}.${realExt}`;
        await fs.rename(outPath, path.join(outDir, realName));
        p.image = `/projects/${realName}`;
      } else {
        p.image = `/projects/${filename}`;
      }

    } catch (err){
      console.error(`Error processing ${p.title}:`, err.message);
    }
  }

  if (dryRun){
    console.log('Dry-run complete. No files were saved. projects.json would be updated with local /projects/ paths.');
  } else {
    await fs.writeFile(projectsPath, JSON.stringify(projects, null, 4), 'utf8');
    console.log('projects.json updated with local image paths.');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
