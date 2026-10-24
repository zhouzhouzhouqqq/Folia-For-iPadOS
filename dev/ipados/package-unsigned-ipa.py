import argparse
import hashlib
import json
import plistlib
from pathlib import Path
import stat
import subprocess
import zipfile

# Package a public, unsigned device archive without exporting personal signing material.
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--app', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
app = args.app.resolve()
output = args.output.resolve()
info = plistlib.loads((app / 'Info.plist').read_bytes())
if info['CFBundleIdentifier'] != 'org.folia.personal':
    raise SystemExit('Build the public placeholder Bundle ID before packaging.')
if list(app.rglob('embedded.mobileprovision')):
    raise SystemExit('Personal provisioning profiles must not be distributed.')
signature = subprocess.run(['codesign', '-dv', '--verbose=2', str(app)], capture_output=True, text=True)
if 'Authority=' in signature.stderr or any(
    line.startswith('TeamIdentifier=') and line != 'TeamIdentifier=not set'
    for line in signature.stderr.splitlines()
):
    raise SystemExit('Refusing to package a personally signed application.')
architecture = subprocess.check_output(['lipo', '-archs', str(app / info['CFBundleExecutable'])], text=True).strip()
if architecture != 'arm64':
    raise SystemExit('Expected an arm64 iOS device application.')
config = json.loads((app / 'capacitor.config.json').read_text())
if config.get('server', {}).get('url') or (app / 'public/sw.js').exists():
    raise SystemExit('Use bundled iOS resources without a remote page or service worker.')
output.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for path in sorted(app.rglob('*')):
        if path.is_dir() and not path.is_symlink():
            continue
        if path.name == '.DS_Store':
            continue
        if path.is_symlink():
            raise SystemExit('Review application symlinks before packaging.')
        item = zipfile.ZipInfo.from_file(path, arcname='Payload/' + app.name + '/' + str(path.relative_to(app)))
        item.compress_type = zipfile.ZIP_DEFLATED
        archive.writestr(item, path.read_bytes())
with zipfile.ZipFile(output) as archive:
    if archive.testzip() is not None:
        raise SystemExit('IPA CRC verification failed.')
    executable = archive.getinfo('Payload/' + app.name + '/' + info['CFBundleExecutable'])
    if not executable.external_attr >> 16 & stat.S_IXUSR:
        raise SystemExit('IPA executable permissions were lost.')
print(json.dumps({
    'file': output.name, 'bytes': output.stat().st_size,
    'sha256': hashlib.sha256(output.read_bytes()).hexdigest(),
    'bundleIdentifier': info['CFBundleIdentifier'], 'version': info['CFBundleShortVersionString'],
    'buildNumber': info['CFBundleVersion'],
    'minimumOSVersion': info['MinimumOSVersion'], 'architecture': architecture,
    'signing': 'Unsigned public build; requires the recipient to sign before installation.',
}, ensure_ascii=False, indent=2))
