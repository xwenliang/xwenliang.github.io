//test regenerator
function sleep(time){
    return new Promise((resolve, reject) => {
        setTimeout(()=>{
            resolve();
        }, time);
    });
};

async function test(){
    const time = 1000;
    await sleep(time);
    console.log(`I have waited for ${time} ms.`);
};

test();

//test String.prototype.includes
const sStr = 'abcd';
console.log(sStr.includes('a'));