from pathlib import Path
import json, zipfile
root=Path(__file__).resolve().parent.parent
skip={'.git','node_modules','dist','.sites-runtime','.wrangler','.next','.openai','public'}
files={}
for f in root.rglob('*'):
 if not f.is_file() or f.name == 'source-snapshot.json' or any(x in skip for x in f.relative_to(root).parts) or f.name.startswith('.env'):continue
 try:files[str(f.relative_to(root))]=f.read_text()
 except UnicodeDecodeError:continue
files['public/favicon.svg']=(root/'public/favicon.svg').read_text()
# Hosting declares logical bindings only; no secrets or Site identity needed for reproduction.
files['.openai/hosting.json']=json.dumps({'d1':'DB','r2':None},indent=2)
files['.gitignore']=(root/'.gitignore').read_text()
(root/'data/source-snapshot.json').write_text(json.dumps(files,ensure_ascii=False))
with zipfile.ZipFile(root/'public/source.zip','w',zipfile.ZIP_DEFLATED) as z:
 for name,content in files.items():z.writestr(name,content)
print(f'Public source snapshot: {len(files)} files')
