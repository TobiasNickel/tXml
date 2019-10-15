const bz2 = require('unbzip2-stream');
const http = require('https');
const xml = require('./tXml.js');

const planetMapUrl = "https://ftp5.gwdg.de/pub/misc/openstreetmap/planet.openstreetmap.org/planet/2019/planet-190930.osm.bz2";
const planetFilePreamble = `<?xml version="1.0" encoding="UTF-8"?>
// <osm license="http://opendatacommons.org/licenses/odbl/1-0/" copyright="OpenStreetMap and contributors" version="0.6" generator="planet-dump-ng 1.1.6" attribution="http://www.openstreetmap.org/copyright" timestamp="2019-09-29T23:59:55Z">
//  <bound box="-90,-180,90,180" origin="http://www.openstreetmap.org/api/0.6"/>`;


main().catch(err => console.log(err));

async function main() {
  let frameCount = 0;
  let xmlItems = 0;
  let dataSize = 0;

  const fileReadStream = (await get(planetMapUrl))
    .pipe(bz2())

  fileReadStream.on('data', (data) => {
    frameCount++;
    dataSize += data.length;
    console.log('data', { frameCount, size: dataSize, xmlItems })
  });

  const xmlStream = fileReadStream.pipe(xml.transformStream(planetFilePreamble.length));

  const typeStats = {};

  for await (const node of xmlStream) {
    xmlItems++;
    await sleep(1);
    if (!typeStats[node.tagName]) typeStats[node.tagName] = 0;
    typeStats[node.tagName]++;
    if (xmlItems % 100 == 0)
      console.log('loop', xmlItems, typeStats);
  }
  console.log(typeStats)
}


function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, resolve);
  });
}

function sleep(ms) {
  return new Promise(resolve => setInterval(resolve, ms || 0))
}