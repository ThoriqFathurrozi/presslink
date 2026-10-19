const fs = require('node:fs/promises');
const path = require('node:path');
const esbuild = require('esbuild');

const projectRoot = path.resolve(__dirname, '..');
const metadataPath = path.join(projectRoot, 'presslink-meta.user.js');
const outputPath = path.join(
    projectRoot,
    'presslink.user.js'
);

async function readMetadata() {
    const source = await fs.readFile(metadataPath, 'utf8');
    const match = source.match(
        /\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/
    );

    if (!match) {
        throw new Error(
            `Userscript metadata not found in ${metadataPath}`
        );
    }

    return match[0];
}

async function createBuildOptions() {
    const metadata = await readMetadata();

    return {
        banner: {
            js: `${metadata}\n`
        },
        bundle: true,
        charset: 'utf8',
        entryPoints: [path.join(projectRoot, 'src', 'main.js')],
        format: 'iife',
        legalComments: 'none',
        minify: false,
        outfile: outputPath,
        platform: 'browser',
        target: ['es2020']
    };
}

async function build() {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    const options = await createBuildOptions();

    if (process.argv.includes('--watch')) {
        const context = await esbuild.context(options);
        await context.watch();
        console.log(`Watching ${path.relative(projectRoot, outputPath)}`);
        return;
    }

    await esbuild.build(options);
    console.log(`Built ${path.relative(projectRoot, outputPath)}`);
}

build().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
