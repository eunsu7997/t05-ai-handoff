"""Keep local tool state and credentials out of the public source download."""
import importlib.util
from pathlib import Path
import tempfile
import unittest
import zipfile

spec = importlib.util.spec_from_file_location('source_snapshot', Path(__file__).with_name('source-snapshot.py'))
snapshot = importlib.util.module_from_spec(spec)
spec.loader.exec_module(snapshot)


class SourceSnapshotTests(unittest.TestCase):
    def test_local_state_is_excluded_and_public_source_is_preserved(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            public = {'app/page.tsx': 'export default 1', 'lib/core.ts': '// 한글',
                      'public/favicon.svg': '<svg/>', '.openai/hosting.json': '{}', '.gitignore': '*.pem'}
            local = ['.env.local', 'private.pem', 'signing.key', '.agents/session.json',
                     '.codex/config.json', 'outputs/result.json', 'work/task.md', '.venv/settings.py',
                     '__pycache__/test.pyc', 'tsconfig.tsbuildinfo', '.wrangler/state.json',
                     'node_modules/package/index.js', 'debug.log', 'id_ed25519']
            for name, content in {**public, **dict.fromkeys(local, 'local-only')}.items():
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(content, encoding='utf-8')
            files = snapshot.collect_source(root)
            self.assertEqual(files, public)
            archive = root / 'download.zip'
            snapshot.write_zip(archive, files)
            with zipfile.ZipFile(archive) as result:
                self.assertEqual(set(result.namelist()), set(public))
                self.assertEqual(result.read('lib/core.ts').decode('utf-8'), '// 한글')

    def test_symlink_to_an_external_file_is_not_exported(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / 'project'
            root.mkdir()
            for name in ('public/favicon.svg', '.openai/hosting.json', '.gitignore'):
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text('public', encoding='utf-8')
            outside = Path(tmp) / 'external.txt'
            outside.write_text('private outside project', encoding='utf-8')
            try:
                (root / 'linked.txt').symlink_to(outside)
            except (OSError, NotImplementedError):
                self.skipTest('symlinks unavailable')
            self.assertNotIn('linked.txt', snapshot.collect_source(root))


if __name__ == '__main__':
    unittest.main()
