#!/usr/bin/env python3
"""Prepare a scratch Swift test package from the current source and a SHA-verified official SDK archive."""
import argparse
import hashlib
import shutil
import subprocess
import zipfile
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--work', type=Path, required=True)
parser.add_argument('--archive', type=Path, required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parents[3]
work = args.work.resolve()
assert not work.is_relative_to(root), 'Use a scratch directory outside the source tree'
assert hashlib.sha256(args.archive.read_bytes()).hexdigest() == 'f7100a992d2a8135168c8afd831e6a58b465349101982aa58b3e11d36e600b54'
work.mkdir(parents=True, exist_ok=True)
source = root / 'ios/FoliaAutomixRuntime'
for name in ('Sources', 'Tests'):
    shutil.copytree(source / name, work / name, dirs_exist_ok=True)
shutil.copyfile(source / 'ORT-LICENSE', work / 'ORT-LICENSE')
sdk = work / 'SDK'
if not (sdk / 'onnxruntime.xcframework/macos-arm64_x86_64/onnxruntime.framework/Headers/onnxruntime_cxx_api.h').is_file():
    if sdk.exists():
        shutil.rmtree(sdk)
    with zipfile.ZipFile(args.archive) as archive:
        for item in archive.infolist():
            assert not item.filename.startswith('/') and '..' not in Path(item.filename).parts
    subprocess.run(["ditto", "-x", "-k", str(args.archive.resolve()), str(sdk)], check=True)
frameworks = list(sdk.rglob('onnxruntime.xcframework'))
assert len(frameworks) == 1
relative = frameworks[0].relative_to(work)
manifest = (source / 'Package.swift').read_text()
start = manifest.index('        .binaryTarget(')
end = manifest.index('        .target(', start)
manifest = manifest[:start] + f'        .binaryTarget(name: "onnxruntime", path: "{relative}"),\n' + manifest[end:]
(work / 'Package.swift').write_text(manifest)
test_sources = work / 'Tests/FoliaAutomixRuntimeTests'
for file in (root / 'ios/App/App/Automix').glob('*.swift'):
    if file.name != 'FoliaAutomixPlugin.swift':
        shutil.copyfile(file, test_sources / file.name)
shutil.copyfile(root / 'dev/ipados/automix/NativeStorageTests.swift', test_sources / 'NativeStorageTests.swift')
print(f'Prepared current native source and official ORT SDK at {work}')
