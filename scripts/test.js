const esbuild = require('esbuild');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const testsRoot = path.join(projectRoot, 'tests');

async function discoverTests(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const files = await Promise.all(entries.map(async (entry) => {
        const filename = path.join(directory, entry.name);
        if (entry.isDirectory()) return discoverTests(filename);
        return entry.isFile() && entry.name.endsWith('.test.js') ? [filename] : [];
    }));
    return files.flat().sort();
}

async function run() {
    const args = process.argv.slice(2);
    const nodeOptions = args.filter((argument) => argument.startsWith('--'));
    const selections = args.filter((argument) => !argument.startsWith('--'))
        .map((argument) => path.resolve(projectRoot, argument));
    const allTests = await discoverTests(testsRoot);
    for (const selection of selections) {
        if (!allTests.some((file) => file === selection || file.startsWith(selection + path.sep))) {
            throw new Error(`No test files found for ${path.relative(projectRoot, selection)}`);
        }
    }
    const testFiles = selections.length === 0 ? allTests : allTests.filter((file) =>
        selections.some((selection) => file === selection || file.startsWith(selection + path.sep))
    );
    if (testFiles.length === 0) throw new Error('No *.test.js files found under tests/');

    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'pressora-tests-'));
    try {
        await esbuild.build({
            entryPoints: testFiles,
            bundle: true,
            platform: 'node',
            format: 'cjs',
            outbase: testsRoot,
            outdir: directory,
            outExtension: { '.js': '.cjs' },
            sourcemap: 'inline'
        });
        const outputs = testFiles.map((file) =>
            path.join(directory, path.relative(testsRoot, file).replace(/\.js$/, '.cjs'))
        );
        const result = spawnSync(process.execPath, [
            '--enable-source-maps', '--test', ...nodeOptions, ...outputs
        ], { cwd: projectRoot, stdio: 'inherit' });
        if (result.error) throw result.error;
        process.exitCode = result.status ?? 1;
    } finally {
        await fs.rm(directory, { recursive: true, force: true });
    }
}

run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
