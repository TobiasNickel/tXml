var fs = require('fs')
fs.writeFileSync('./long.xml');

var writer = fs.createWriteStream('./long.xml');
writer.write("<test>\n");

for(var i=0;i<1000000;i++){
    writer.write("<item><prop attr='"+(i+1)+"'>"+i+"</prop></item>\n");
}
writer.write('</test>\n')