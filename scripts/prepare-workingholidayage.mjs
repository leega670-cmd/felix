// Preserve the historical source and synchronize the directory used by existing Pages builds.
import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, relative, dirname } from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'..');
const source=resolve(root,'workingholidayage');
const target=resolve(root,'backups/workingholidayage/2026-10-26');
const original=resolve(root,'backups/workingholidayage/original-2026-10-26');
try { await readFile(resolve(original,'index.html')); }
catch { await cp(target,original,{recursive:true,errorOnExist:true,force:false}); }
const allowed=new Set(['.html','.png','.jpg','.xml','.txt']);
async function sync(folder){
 for(const entry of await readdir(folder,{withFileTypes:true})){
  const from=resolve(folder,entry.name);
  if(entry.isDirectory()){await sync(from);continue;}
  const path=relative(source,from);
  assert.ok(path==='_redirects'||[...allowed].some(suffix=>path.endsWith(suffix)),`Unexpected public file: ${path}`);
  const to=resolve(target,path);await mkdir(dirname(to),{recursive:true});
  const data=await readFile(from);await writeFile(to,data);
  assert.ok(data.equals(await readFile(to)),`Copy mismatch: ${path}`);
 }
}
await sync(source);
console.log('Existing Cloudflare deployment directory synchronized; original snapshot retained separately.');
