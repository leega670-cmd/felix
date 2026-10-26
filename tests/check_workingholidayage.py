"""Read-only checks for the static release directory. Python standard library only."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
from collections import Counter
import subprocess
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1] / 'workingholidayage'

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.ids, self.links, self.scripts, self.images = [], [], [], []
        self.h1 = 0
        self.script = None
        self.feed(text)
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs: self.ids.append(attrs['id'])
        if tag == 'h1': self.h1 += 1
        if tag == 'a' and 'href' in attrs: self.links.append(attrs)
        if tag == 'img': self.images.append(attrs)
        if tag == 'script': self.script = ''
    def handle_data(self, data):
        if self.script is not None: self.script += data
    def handle_endtag(self, tag):
        if tag == 'script' and self.script is not None:
            self.scripts.append(self.script)
            self.script = None

pages = {p: Page(p.read_text()) for p in ROOT.rglob('*.html')}
for path, page in pages.items():
    assert page.h1 == 1, (path, 'h1 count')
    assert not [k for k,v in Counter(page.ids).items() if v > 1], (path, 'duplicate ID')
    assert all('alt' in img for img in page.images), (path, 'missing alt')
    for script in page.scripts:
        subprocess.run(['node', '--check'], input=script, text=True, check=True, capture_output=True)
    for link in page.links:
        url = urlsplit(link['href'])
        if url.scheme or url.netloc:
            if link.get('target') == '_blank':
                assert {'noopener','noreferrer'} <= set(link.get('rel','').split()), (path, link)
            continue
        target = ROOT / url.path.lstrip('/') if url.path.startswith('/') else path.parent / url.path
        if not url.path: target = path
        if target.is_dir(): target = target / 'index.html'
        assert target.exists(), (path, 'broken local link', link['href'])
        if url.fragment: assert url.fragment in pages[target].ids, (path, 'broken fragment', link['href'])
    for img in page.images:
        if img.get('src','').startswith('/'):
            assert (ROOT / img['src'].lstrip('/')).is_file(), (path, 'missing image')
    text = path.read_text()
    assert 'adsbygoogle' not in text, (path, 'unreviewed ad script')
    assert 'var(--surface)-space' not in text

sitemap = ET.parse(ROOT / 'sitemap.xml')
for loc in sitemap.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc'):
    target = ROOT / urlsplit(loc.text).path.lstrip('/')
    if target.is_dir(): target = target / 'index.html'
    assert target in pages, ('sitemap missing page', loc.text)
assert '/ja/' not in (ROOT/'sitemap.xml').read_text()
assert 'noindex' in (ROOT/'404.html').read_text()
assert 'Sitemap: https://workingholidayage.com/sitemap.xml' in (ROOT/'robots.txt').read_text()
print(f'PASS: {len(pages)} HTML pages, scripts, local links, images, sitemap and advertising checks')
