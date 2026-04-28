import type { PropsWithChildren } from 'react';

import { ScrollViewStyleReset } from 'expo-router/html';

export default function RootHtml({ children }: PropsWithChildren) {
  return (
    <html dir="rtl" lang="he">
      <head>
        <meta charSet="utf-8" />
        <meta content="IE=edge" httpEquiv="X-UA-Compatible" />
        <meta content="width=device-width, initial-scale=1, viewport-fit=cover" name="viewport" />
        <meta content="Konanut" name="application-name" />
        <meta content="yes" name="mobile-web-app-capable" />
        <meta content="#070B0D" name="theme-color" />
        <meta content="yes" name="apple-mobile-web-app-capable" />
        <meta content="default" name="apple-mobile-web-app-status-bar-style" />
        <meta content="Konanut" name="apple-mobile-web-app-title" />
        <meta content="telephone=no" name="format-detection" />
        <meta content="#070B0D" name="msapplication-TileColor" />
        <link href="/manifest.json" rel="manifest" />
        <link href="/favicon.png" rel="icon" />
        <link href="/apple-touch-icon.png" rel="apple-touch-icon" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html:
              'html{background:#070B0D;direction:rtl;height:100%;overflow-x:hidden;width:100%;}body{margin:0;background:#070B0D;direction:rtl;-webkit-tap-highlight-color:transparent;min-height:100%;min-height:-webkit-fill-available;overflow-x:hidden;width:100%;}html,body,#root{min-height:100%;overscroll-behavior:none;}#root{direction:rtl;min-height:100dvh;overflow-x:hidden;width:100%;}@supports (min-height: 100dvh){html,body,#root{min-height:100dvh;}}',
          }}
        />
      </head>
      <body dir="rtl">{children}</body>
    </html>
  );
}
