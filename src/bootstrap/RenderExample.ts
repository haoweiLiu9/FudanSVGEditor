import { readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

export class RenderExample {
  static run(source = 'examples/flowchart.svg', target = 'examples/flowchart.png'): void {
    const svg = readFileSync(source, 'utf8');
    const renderer = new Resvg(svg, { background: 'white', font: { loadSystemFonts: true, defaultFontFamily: 'Microsoft YaHei' } });
    writeFileSync(target, renderer.render().asPng());
    console.log(`rendered ${source} to ${target}`);
  }
}
RenderExample.run(process.argv[2], process.argv[3]);
