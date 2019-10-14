const fs = require('fs');
const http = require('http');

http.createServer((req, res) => {
    const postData = [];
    req.on('data', chunk => {
        console.log(chunk);
        postData.push(chunk);
    }).on('end', () => {
        const buffer = Buffer.concat(postData);
        fs.writeFile('./a.zip', buffer, err => {
            if(err){
                return console.log(err);
            }
            else{
                console.log('succ');
                res.end('ok');
            }
        });
    });
}).listen(3001);