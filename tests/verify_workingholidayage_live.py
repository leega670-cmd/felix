"""Verify published assets match the reviewed release and check HTTP routing."""
from pathlib import Path
from urllib.request import urlopen, Request, build_opener, HTTPRedirectHandler
from urllib.error import HTTPError
from hashlib import sha256
import json, datetime, os

ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('WHA_QA_URL','https://workingholidayage.com').rstrip('/')
checks=[]
def request(path):
    try:
        with urlopen(Request(BASE+path,headers={'User-Agent':'WorkingHolidayAge-Release-Verification/1.0'}),timeout=30) as r:
            return r.status,r.headers,r.read(),r.url
    except HTTPError as e:
        return e.code,e.headers,e.read(),e.url
for path,file in [('/', 'index.html'),('/about/','about/index.html'),('/privacy/','privacy/index.html'),('/contact/','contact/index.html'),('/robots.txt','robots.txt'),('/sitemap.xml','sitemap.xml'),('/ads.txt','ads.txt'),('/working-map_2026.jpg','working-map_2026.jpg'),('/favicon.png','favicon.png')]:
    status,headers,data,url=request(path)
    expected=(ROOT/'workingholidayage'/file).read_bytes()
    assert status==200,(path,status)
    assert data==expected,(path,'published content differs from release',sha256(data).hexdigest(),sha256(expected).hexdigest())
    if path=='/robots.txt': assert headers.get_content_type()=='text/plain'
    checks.append({'path':path,'status':status,'matchesRelease':True,'sha256':sha256(data).hexdigest()})
    print(f'PASS {path} HTTP {status}: matches release',flush=True)
status,headers,data,url=request('/wha-qa-nonexistent-20261026')
assert status==404,('missing URL',status)
assert data==(ROOT/'workingholidayage/404.html').read_bytes()
assert 'adsbygoogle' not in data.decode()
checks.append({'path':'/wha-qa-nonexistent-20261026','status':status,'matchesRelease':True})
print('PASS missing URL: real HTTP 404 with reviewed error page',flush=True)
for path in ['/ja','/ja/']:
    status,headers,data,url=request(path)
    assert status==200 and url.rstrip('/')==BASE,(path,status,url)
    assert data==(ROOT/'workingholidayage/index.html').read_bytes()
    checks.append({'path':path,'redirectsTo':url,'status':status})
    print(f'PASS {path}: redirects to homepage',flush=True)
result={'base':BASE,'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'checks':checks}
(ROOT/'qa').mkdir(exist_ok=True)
(ROOT/'qa/workingholidayage-live.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(f'PASS {len(checks)} live HTTP/asset checks')
