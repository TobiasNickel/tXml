var tXml = require('./tXml');
var stream = tXml.parseStream(__dirname+'/long.xml',7);
var count=0;
stream.on('xml',function(data){
    count++;
    if((count%100)===0)
        console.log('got:',count,data.children[0]);
});
stream.on('end',function(){
    process.exit();
}) 

// ;(async function(){
//     console.log('start')
//     for await (const data of stream) {
//         console.log('data')
//         stream.pause();
//         console.log(data);
//         await sleep(300);
//         stream.resume();
//     }

// })().catch(err=>console.log(err));

// function sleep(ms){
//     return new Promise(resolve=>setTimeout(resolve,ms))
// }