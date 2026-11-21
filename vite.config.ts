import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'

// Only production builds get a worker. The manifest is generated from this build's actual files.
export default defineConfig({
  plugins: [
    {
      name: 'sitrep-offline-edition',
      apply: 'build',
      enforce: 'post',
      transformIndexHtml() {
        return [
          {
            tag: 'script',
            injectTo: 'body',
            children:
              "if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}))",
          },
        ]
      },
      generateBundle: {
        order: 'post',
        handler(_, bundle) {
          const assets = Object.keys(bundle).sort()
          const worker = readFileSync(new URL('./offline/worker.js', import.meta.url), 'utf8')
          const hash = createHash('sha256').update(worker)
          for (const file of assets) {
            const output = bundle[file]
            hash.update(file).update(output.type === 'asset' ? output.source : output.code)
          }
          const edition = { revision: hash.digest('hex').slice(0, 20), assets }
          this.emitFile({
            type: 'asset',
            fileName: 'sw.js',
            source: 'const edition = ' + JSON.stringify(edition) + '\n' + worker,
          })
        },
      },
    },
  ],
})
