const txml = require('../tXml.js');
const fs = require('fs');
const http = require('http');
const https = require('https');
const bz = require('unbzip2-stream');

const downloadURL = 'https://ftp5.gwdg.de/pub/misc/openstreetmap/planet.openstreetmap.org/planet/2019/planet-190930.osm.bz2';

function get(url){
    return new Promise(resolve=>http.get(url,resolve));
}
function gets(url){
    return new Promise(resolve=>https.get(url,resolve));
}

main().catch(err=>console.log(err));

async function main(){
    var xmlCounts = 0;
    var numberOfChunks = 0;

    const dataStream = await gets(downloadURL);
    const textStream = dataStream.pipe(bz());
    dataStream.pipe(fs.createWriteStream('./planet.xml.bz2'))
    txml.parseStream(textStream);

    textStream.on('data',chunk=>{
        numberOfChunks++;
    });
    textStream.on('end', ()=>console.log('end'));


    textStream.on('xml',node=>{
        xmlCounts++;



        if(!(xmlCounts%10000)){
            const tags = node.children.filter(c=>c.tagName==='tag').reduce((p,tagNode)=>{
                p[tagNode.attributes.k]=tagNode.attributes.v;
                return p;
            },{});
            console.log(xmlCounts, numberOfChunks, node, tags);
        }
    });

    await new Promise((resolve,reject)=>{
        textStream.on('end', resolve);
        textStream.on('error',reject);
    });

    process.exit();
}