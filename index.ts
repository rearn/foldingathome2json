import { promises as fs } from 'fs';
import axios from 'axios';
import { JSDOM } from 'jsdom';
const conf = require('./config.json');

const filenamehead = `team${conf.team}`; 
const tmpfilename = `${filenamehead}.html`;
const jsonfilename = `${filenamehead}.json`;
const uri = `https://apps.foldingathome.org/teamstats/${tmpfilename}`;
const name = conf.name;

(async () => {
  const isgethtml = await fs.stat(tmpfilename).then((v) => {
    const now = new Date();
    const diff = now.getTime() - v.mtime.getTime();
    return diff > 5 * 60 * 100;
  }).catch((error) => {
    if (error.code === 'ENOENT') {
      return true;
    }
    throw error;
  });
  
  let html: string;
  if (isgethtml) {
    const response = await axios.get(uri);
    html = response.data.toString()
  } else {
    const b = await fs.readFile(tmpfilename);
    html = b.toString('utf8')
  }
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
  await fs.writeFile(jsonfilename, JSON.stringify(ret));
})();