import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, 'dist');
const indexHtmlPath = path.join(distDir, 'index.html');
const manifestPath = path.join(distDir, 'manifest.json');

const REQUIRED_ASSETS = ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png'];
const REQUIRED_META_SNIPPETS = [
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />',
  '<meta name="theme-color" content="#070B0D" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default" />',
  '<meta name="apple-mobile-web-app-title" content="Konanut" />',
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png" />',
  '<link rel="manifest" href="/manifest.json" />',
];

function assertFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required build artifact: ${filePath}`);
  }
}

function ensureBuildArtifacts() {
  assertFileExists(indexHtmlPath);
  assertFileExists(manifestPath);

  for (const assetFileName of REQUIRED_ASSETS) {
    assertFileExists(path.join(distDir, assetFileName));
  }
}

function patchIndexHtml() {
  let html = fs.readFileSync(indexHtmlPath, 'utf8');

  html = html.replace('<html lang="en">', '<html lang="he" dir="rtl">');
  html = html.replace('<body>', '<body dir="rtl">');
  html = html.replace(
    /<meta name="viewport" content="[^"]*" ?\/>/,
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />'
  );

  const themeColorPattern = /<meta name="theme-color" content="[^"]*" ?\/?>/g;
  if (themeColorPattern.test(html)) {
    html = html.replace(themeColorPattern, '<meta name="theme-color" content="#070B0D" />');
  } else {
    html = html.replace(
      '</head>',
      `  <meta name="theme-color" content="#070B0D" />\n</head>`
    );
  }

  const injectedHeadBlock = [
    '<meta name="apple-mobile-web-app-capable" content="yes" />',
    '<meta name="mobile-web-app-capable" content="yes" />',
    '<meta name="apple-mobile-web-app-status-bar-style" content="default" />',
    '<meta name="apple-mobile-web-app-title" content="Konanut" />',
    '<link rel="manifest" href="/manifest.json" />',
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png" />',
  ]
    .filter((snippet) => !html.includes(snippet))
    .join('\n');

  if (injectedHeadBlock) {
    html = html.replace('</head>', `${injectedHeadBlock}\n</head>`);
  }

  html = html.replace(
    /<style id="expo-reset">[\s\S]*?<\/style>/,
    `<style id="expo-reset">
      html {
        background: #070B0D;
        direction: rtl;
        height: 100%;
        overflow-x: hidden;
        width: 100%;
      }
      body {
        background: #070B0D;
        direction: rtl;
        margin: 0;
        min-height: 100%;
        min-height: -webkit-fill-available;
        overflow: hidden;
        overflow-x: hidden;
        -webkit-tap-highlight-color: transparent;
        width: 100%;
      }
      html,
      body,
      #root {
        min-height: 100%;
        overscroll-behavior: none;
      }
      #root {
        direction: rtl;
        display: flex;
        flex: 1;
        min-height: 100dvh;
        overflow-x: hidden;
        width: 100%;
      }
      @supports (min-height: 100dvh) {
        html,
        body,
        #root {
          min-height: 100dvh;
        }
      }
    </style>`
  );

  fs.writeFileSync(indexHtmlPath, html);

  const patchedHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  for (const requiredSnippet of REQUIRED_META_SNIPPETS) {
    if (!patchedHtml.includes(requiredSnippet)) {
      throw new Error(`Failed to inject required head tag: ${requiredSnippet}`);
    }
  }
}

function patchManifest() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  manifest.name = 'Konanut';
  manifest.short_name = 'Konanut';
  manifest.start_url = '/';
  manifest.scope = '/';
  manifest.display = 'standalone';
  manifest.background_color = '#070B0D';
  manifest.theme_color = '#070B0D';

  const requiredIcons = [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
  ];

  manifest.icons = requiredIcons;

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}

ensureBuildArtifacts();
patchIndexHtml();
patchManifest();

console.log('Prepared Expo web export for iPhone standalone PWA.');
