// express@4.16.4
// multer@1.4.2
// 示例代码
const express = require('express');
const multer = require('multer');

const app = express();
const upload = multer({ dest: './upload/' });
app.post('/file', upload.single('your_key_1'), (req, res, next) => {
    console.log('file', req.file);
    console.log('field', req.body);
    res.end('ok');
});
app.listen(3001);