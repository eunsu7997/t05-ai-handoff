"""Build the downloadable source from project files, excluding local state and credentials."""
import json
from pathlib import Path
import zipfile

EXCLUDED_PARTS = {
    '.git', 'node_modules', 'dist', '.sites-runtime', '.wrangler', '.next', '.vinext',
    '.openai', 'public', '.agents', '.codex', 'outputs', 'work', '.venv', 'venv',
    '__pycache__', '.pytest_cache', '.ruff_cache', 'coverage', '.vercel',
}
SECRET_SUFFIXES = {'.pem', '.key', '.p12', '.pfx'}


def collect_source(root):
    root = Path(root)
    files = {}
    for path in sorted(root.rglob('*')):
        relative = path.relative_to(root)
        if (not path.is_file() or path.is_symlink()
                or any(part in EXCLUDED_PARTS for part in relative.parts)
                or path.name == 'source-snapshot.json'
                or path.name.startswith(('.env', 'id_rsa', 'id_ed25519'))
                or path.suffix.lower() in SECRET_SUFFIXES
                or path.name.endswith(('.tsbuildinfo', '.pyc', '.log'))):
            continue
        try:
            files[relative.as_posix()] = path.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            continue
    # These two public configuration assets are intentionally included.
    for name in ('public/favicon.svg', '.openai/hosting.json', '.gitignore'):
        path = root / name
        if path.is_symlink():
            raise ValueError(f'Public source asset must not be a symlink: {name}')
        files[name] = path.read_text(encoding='utf-8')
    return files


def write_zip(path, files):
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as archive:
        for name, content in sorted(files.items()):
            archive.writestr(name, content)


def main():
    root = Path(__file__).resolve().parent.parent
    files = collect_source(root)
    (root / 'data/source-snapshot.json').write_text(json.dumps(files, ensure_ascii=False), encoding='utf-8')
    write_zip(root / 'public/source.zip', files)
    print(f'Public source snapshot: {len(files)} files')
    baseline = root / 'data/pinned/b44e8fe8aa886ae26cdf4e4b5ac5c8d17c2e7d9c.json'
    if baseline.exists():
        write_zip(root / 'public/source-baseline-b44e8fe8aa886ae26cdf4e4b5ac5c8d17c2e7d9c.zip',
                  json.loads(baseline.read_text(encoding='utf-8')))


if __name__ == '__main__':
    main()
