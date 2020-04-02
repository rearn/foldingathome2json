import { promises as fs } from 'fs';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import * as argv from 'argv';

argv.option([
  {
    name: 'out',
    short: 'o',
    type : 'path',
    description :'出力先',
    example: '指定しないときは、標準出力'
  },
  {
    name: 'team',
    short: 't',
    type : 'int',
    description :'チーム番号',
  },
]);

const conf = argv.run().options;
const out = conf.out;
const team = conf.team;
if (team === undefined) {
  console.log('Non team number');
  argv.help();
  process.exit(1);
}
const uri = `https://apps.foldingathome.org/teamstats/team${team}.html`;

(async () => {
  const response = await axios.get(uri);
  const html = response.data.toString()
  const dom = new JSDOM(html);
  const window = dom.window;
  const document = window.document;

  const table = document.getElementsByClassName('members')[0];
  const tbody = table.getElementsByTagName('tbody')[0];
  const trs = tbody.getElementsByTagName('tr');

  let head = [];
  let data: any[][] = [];
  for (let i = 0; i < trs.length; i++) {
    const tds = trs[i].getElementsByTagName('td');
    if (tds.length === 0) {
      const ths = trs[i].getElementsByTagName('th');
      for (let j = 0; j < ths.length; j++) {
        head[j] = ths[j].textContent;
      }
      continue;
    }
    let d = [];  
    for (let j = 0; j < tds.length; j++) {
      d[j] = tds[j].textContent;
    }
    data.push(d);
  }
  const ret = data.map((v) => {
    const r = {};
    for (let i = 0; i < v.length; i++) {
      r[head[i]] = v[i];
    }
    return r;
  });

  if (out === undefined) {
    return console.log(JSON.stringify(ret));
  }
  return await fs.writeFile(out, JSON.stringify(ret));
})();