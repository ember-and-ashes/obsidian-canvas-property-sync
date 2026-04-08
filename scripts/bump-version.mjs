import { readFileSync, writeFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
const version = pkg.version;

// Update manifest.json
const manifest = JSON.parse(readFileSync('manifest.json', 'utf-8'));
manifest.version = version;
writeFileSync('manifest.json', JSON.stringify(manifest, null, '  ') + '\n');

// Update versions.json
const versions = JSON.parse(readFileSync('versions.json', 'utf-8'));
versions[version] = manifest.minAppVersion;
writeFileSync('versions.json', JSON.stringify(versions, null, '  ') + '\n');

console.log(`Bumped version to ${version}`);
