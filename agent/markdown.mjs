// Mini-convertisseur Markdown → HTML (titres, paragraphes, gras, italique, liens, listes).
export const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inline(s) {
  let t = esc(s);
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, txt, url) => {
    const ext = /^https?:/.test(url);
    return `<a href="${url}"${ext ? ' target="_blank" rel="noopener"' : ''}>${txt}</a>`;
  });
  t = t.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>');
  return t;
}

export function markdown(md = '', { shiftHeadings = 0 } = {}) {
  const blocks = String(md).replace(/\r\n/g, '\n').split(/\n\s*\n/);
  const out = [];
  let list = [];
  const flush = () => { if (list.length) { out.push(`<ul>${list.map((li) => `<li>${inline(li)}</li>`).join('')}</ul>`); list = []; } };
  for (const raw of blocks) {
    const b = raw.trim();
    if (!b) continue;
    const h = b.match(/^(#{1,6})\s+(.*)$/s);
    if (h) {
      flush();
      const lvl = Math.min(6, Math.max(2, h[1].length - 1 + shiftHeadings));
      out.push(`<h${lvl}>${inline(h[2].replace(/\n/g, ' '))}</h${lvl}>`);
      continue;
    }
    const lines = b.split('\n');
    if (lines.every((l) => /^\s*[-•]\s+/.test(l))) {
      lines.forEach((l) => list.push(l.replace(/^\s*[-•]\s+/, '')));
      continue;
    }
    flush();
    out.push(`<p>${lines.map(inline).join('<br>')}</p>`);
  }
  flush();
  return out.join('\n');
}

/** Texte brut (descriptions d'annonces) → paragraphes HTML. */
export function texte(s = '') {
  return String(s).replace(/\r\n/g, '\n').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('\n');
}

/** Lit un fichier « front matter + Markdown » produit par l'export. */
export function frontMatter(src = '') {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: src };
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    const k = line.slice(0, i).trim(); const v = line.slice(i + 1).trim();
    try { meta[k] = JSON.parse(v); } catch { meta[k] = v.replace(/^"|"$/g, ''); }
  }
  return { meta, body: m[2] };
}
