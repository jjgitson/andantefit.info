#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Regenerate the sitemaps from what is actually on disk.

The sitemaps are hand-maintained, so they drift: pages get added without being
listed, and the <lastmod> values in sitemap-main.xml keep saying February while
the child sitemaps underneath them change. Run this after adding or editing
pages, then commit the result.

    python3 tools/build-sitemaps.py

A page is included when it is a real, indexable page: it is not a fragment, an
asset, a print variant or a preview, and its rel=canonical points at itself.
That last rule is what keeps redirect stubs and per-locale English fallbacks
(whose canonical points at the localized version) out of the sitemaps without
needing a hand-kept exclusion list.
"""
import os
import re
import subprocess
import sys
from datetime import date

SITE = 'https://andantefit.info/'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Directories that hold fragments and assets rather than pages.
SKIP_DIRS = ('includes/', 'assets/', 'docs/', 'tools/', '.git/')
# Filenames that are never pages in their own right.
SKIP_NAMES = ('404.html',)
SKIP_PATTERNS = ('print', 'preview-', 'naver')

# locale prefix -> sitemap file. Order matters: longest prefix first.
LOCALES = [('ko/', 'sitemap-ko.xml'),
           ('jp/', 'sitemap-jp.xml'),
           ('es/', 'sitemap-es.xml'),
           ('ru/', 'sitemap-ru.xml'),
           ('',   'sitemap-en.xml')]

INDEX = 'sitemap-main.xml'
# A short list of the site's entry points. Every URL in it also appears in a
# per-locale sitemap, so it adds no coverage — it is regenerated rather than
# dropped only to leave the submitted sitemap structure unchanged.
CORE = 'sitemap-core.xml'
CORE_URLS = ['index.html', 'ko/index.html', 'jp/index.html', 'es/index.html',
             'ru/index.html', 'product.html', 'validation.html', 'references.html']


def git_date(path):
    """Date of the commit that last touched the file, or today if it is dirty."""
    dirty = subprocess.run(['git', 'diff', '--quiet', '--', path],
                           cwd=ROOT).returncode != 0
    if dirty or not os.path.exists(os.path.join(ROOT, path)):
        return date.today().isoformat()
    out = subprocess.run(['git', 'log', '-1', '--format=%ad', '--date=short', '--', path],
                         cwd=ROOT, capture_output=True, text=True).stdout.strip()
    return out or date.today().isoformat()


def is_page(rel):
    if not rel.endswith('.html'):
        return False
    if rel.startswith(SKIP_DIRS) or os.path.basename(rel) in SKIP_NAMES:
        return False
    if any(p in rel for p in SKIP_PATTERNS):
        return False
    src = open(os.path.join(ROOT, rel), encoding='utf-8').read(8192)
    m = re.search(r'rel="canonical"\s+href="([^"]+)"', src)
    if not m:
        return True                      # no canonical declared: treat as its own page
    return m.group(1).rstrip('/') in (   # self-canonical only
        (SITE + rel).rstrip('/'),
        (SITE + rel[:-len('index.html')]).rstrip('/') if rel.endswith('index.html') else None,
    )


def url_for(rel):
    return SITE + (rel[:-len('index.html')] if rel.endswith('index.html') else rel)


def collect():
    pages = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in ('.git', 'assets', 'includes', 'docs', 'tools')]
        for fn in filenames:
            rel = os.path.relpath(os.path.join(dirpath, fn), ROOT).replace(os.sep, '/')
            if is_page(rel):
                pages.append(rel)
    return sorted(pages)


def bucket(rel):
    for prefix, sm in LOCALES:
        if rel.startswith(prefix):
            return sm
    return 'sitemap-en.xml'


def write_urlset(path, entries):
    body = '\n'.join(
        '  <url>\n    <loc>%s</loc>\n    <lastmod>%s</lastmod>\n  </url>' % e
        for e in entries)
    open(os.path.join(ROOT, path), 'w', encoding='utf-8').write(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        '%s\n</urlset>\n' % body)


def main():
    pages = collect()
    groups = {sm: [] for _, sm in LOCALES}
    for rel in pages:
        groups[bucket(rel)].append((url_for(rel), git_date(rel)))

    for sm, entries in groups.items():
        write_urlset(sm, entries)
        print('%-18s %3d URLs' % (sm, len(entries)))

    core = [(url_for(r), git_date(r)) for r in CORE_URLS if os.path.exists(os.path.join(ROOT, r))]
    write_urlset(CORE, core)
    print('%-18s %3d URLs' % (CORE, len(core)))

    # The index's lastmod is the date each child sitemap file itself changed —
    # it is what tells Google a sitemap is worth re-reading.
    today = date.today().isoformat()
    children = [CORE] + [sm for _, sm in LOCALES]
    rows = '\n'.join(
        '  <sitemap>\n    <loc>%s%s</loc>\n    <lastmod>%s</lastmod>\n  </sitemap>'
        % (SITE, sm, today)
        for sm in children)
    open(os.path.join(ROOT, INDEX), 'w', encoding='utf-8').write(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        '%s\n</sitemapindex>\n' % rows)
    print('%-18s %3d child sitemaps' % (INDEX, len(children)))
    print('\nTotal indexable pages: %d' % len(pages))


if __name__ == '__main__':
    sys.exit(main())
