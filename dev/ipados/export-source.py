import argparse
import hashlib
import json
import re
import subprocess
import zipfile
from pathlib import Path

# Export the current modified source without local signing settings, dependencies or private files.
ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
output = args.output.resolve()
if output.is_relative_to(ROOT):
    raise SystemExit('Place the archive outside the repository to prevent recursive exports.')
output.parent.mkdir(parents=True, exist_ok=True)
paths = subprocess.check_output(
    ['git', 'ls-files', '--cached', '--others', '--exclude-standard', '-z'], cwd=ROOT,
).decode().split('\0')
# Build logs are normally ignored by Git but are linked by the validation report.
paths.extend(str(path.relative_to(ROOT)) for path in (ROOT / 'docs/ipados-validation').glob('*')
             if path.is_file() and path.suffix in {'.log', '.json'})
manifest = []
project_text = (ROOT / 'ios/App/App.xcodeproj/project.pbxproj').read_text()
personal_teams = set(re.findall(r'(?:DEVELOPMENT_TEAM|DevelopmentTeam)\s*=\s*"?([A-Za-z0-9]+)"?;', project_text))
personal_bundles = set(re.findall(r'PRODUCT_BUNDLE_IDENTIFIER\s*=\s*"?([^;"\s]+)"?;', project_text))
with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for relative in sorted(set(filter(None, paths))):
        source = ROOT / relative
        name = source.name.lower()
        if not source.is_file():
            continue
        if source.is_symlink():
            raise SystemExit(f'Review symlink before exporting: {relative}')
        if (name == '.ds_store' or (name.startswith('.env') and not name.endswith('.example'))
                or source.suffix.lower() in {'.p12', '.p8', '.cer', '.mobileprovision', '.ipa', '.key'}):
            continue
        data = source.read_bytes()
        if relative == 'ios/App/App.xcodeproj/project.pbxproj':
            text = data.decode()
            text = re.sub(r'^.*(?:DEVELOPMENT_TEAM|DevelopmentTeam|PROVISIONING_PROFILE(?:_SPECIFIER)?)\s*=.*\n', '', text, flags=re.M)
            text = re.sub(r'PRODUCT_BUNDLE_IDENTIFIER\s*=\s*[^;]+;', 'PRODUCT_BUNDLE_IDENTIFIER = org.folia.personal;', text)
            text = re.sub(r'CODE_SIGN_IDENTITY\s*=\s*[^;]+;', 'CODE_SIGN_IDENTITY = "Apple Development";', text)
            data = text.encode()
        elif relative == 'capacitor.config.ts':
            data = re.sub(r"appId:\s*(['\"])[^'\"]+\1", "appId: 'org.folia.personal'", data.decode()).encode()
        elif relative.startswith('docs/ipados-validation/') and source.suffix in {'.log', '.json'}:
            data = data.replace(str(ROOT).encode(), b'/FOLIA_SOURCE')
            data = data.replace(str(ROOT.parent.parent).encode(), b'/FOLIA_WORKSPACE')
            data = data.replace(str(Path.home()).encode(), b'/FOLIA_USER')
            for team in personal_teams:
                data = data.replace(team.encode(), b'PERSONAL_TEAM_REMOVED')
            for bundle in personal_bundles:
                data = data.replace(bundle.encode(), b'org.folia.personal')
        archive.writestr(f'folia-major/{relative}', data)
        manifest.append({'path': relative, 'sha256': hashlib.sha256(data).hexdigest()})
    archive.writestr('folia-major/SOURCE-EXPORT.json', json.dumps({
        'baseline': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
        'containsUncommittedChanges': True,
        'signingSanitized': True,
        'runtimeAndDeviceValidation': 'See docs/ipados-test-report.md; not a signed or fully verified app.',
        'files': manifest,
    }, ensure_ascii=False, indent=2) + '\n')
print(f'Exported {len(manifest)} source files to {output}')
print(f'Archive SHA256: {hashlib.sha256(output.read_bytes()).hexdigest()}')
