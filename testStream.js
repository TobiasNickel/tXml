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