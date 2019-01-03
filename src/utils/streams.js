const program = require("commander");
const readline = require('readline');
const fs = require('fs');
const csvjson = require("csvjson");
const {promisify} = require('util');

const actions = {
    reverse,
    transform,
    outputFile,
    convertFromFile,
    convertToFile,
    cssBundler
}

program
    .version('0.1.0')
    .option('-a, --action <actionName>','Action to call')
    .option('-f, --file <fileName>')
    .option('-p, --path <pathName>')
    .action((one, two)=>{
        let action = "";
        let arguments = null;
        if(typeof one === "object"){
            action = one.action;
            arguments = one.file || one.path;
        }
        else if (two) {
            action = two.action;
            arguments = one;
        }

        if(!actions[action]){
            throw new Error("Provided action is unvalid!");
        }

        actions[action](arguments);
    });

program.on('--help',(actionName, fileName)=>{
    console.log('-a, --action <actionName>');
    console.log('Actions to call:');
    console.log('\t', 'reverse. Reverses a string');
    console.log('\t', 'transform. Transforms a string to Uppercase');
    console.log('\t', 'outputFile. Outputs contents of the file from --file argument');
    console.log('\t', 'convertFromFile. Converts content of the file from --file argument to json.');
    console.log('\t', 'convertToFile. Converts the file from --file argument to json and wrights the result to the file with same name and json extension.');
    console.log('\t', 'cssBundler. Bundles css form --path argument.');
    console.log('Arguments to pass:');
    console.log('\t', '-f, --file <fileName>', 'File to work with');
    console.log('\t', '-p, --path <pathName>', 'Path to work with');

});

program.parse(process.argv);


function reverse(){

    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
      });

    rl.on('line', function(line){
        let newLine = "";
        for(let i=line.length-1; i>= 0; i--){
            newLine+=line[i];
        }
        console.log(newLine);
    });
}

function transform(){
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
      });

    rl.on('line', function(line){
        let newLine = line.toUpperCase();
        console.log(newLine);
    });
}

function outputFile(filePath){
    if(!filePath){
        throw new Error('No file path provided');
    }

    const stream = fs.createReadStream(filePath);
    
    stream.pipe(process.stdout);
}

function convertFromFile(filePath){
    if(!filePath){
        throw new Error('No file path provided');
    }

    const stream = fs.createReadStream(filePath);
    let allData = "";
    stream.on('data', (data)=>{
        allData+=data;
    })
    .on('end', ()=>{
        console.log(csvjson.toObject(allData, {delimiter : ',', quote : '"'}));
    });
}

function convertToFile(filePath){
    console.log();
    try {
        fs.statSync(filePath);
    }
    catch (e){
        throw new Error(e)
    }

    if(!filePath){
        throw new Error('No file path provided');
    }
    const stream = fs.createReadStream(filePath);
    const newFilePath = `${__getFileName(filePath)}.json`;
    const newStream = fs.createWriteStream(newFilePath);
    let allData = "";
    stream.on('data', (data)=>{
        allData+=data;
    }).on('end', ()=>{
        allData = JSON.stringify(csvjson.toObject(allData, {delimiter : ',', quote : '"'}));
        newStream.write(allData);
    });
}

function cssBundler (dirUrl){
    
    const filesGet =  promisify(fs.readdir);
    filesGet(dirUrl).then(files=>{
        const newStream = fs.createWriteStream(`${dirUrl}/bundeled.css`);
        if(!files || !files.length){
            throw new Error('The directory is emppty');
        }
        __writeFile(files, "", dirUrl, (data)=>{
            newStream.write(data);
            newStream.write(`.ngmp18 {
                background-color: #fff;
                overflow: hidden;
                width: 100%;
                height: 100%;
                position: relative;
            }
            
            .ngmp18__hw3 {
                color: #333;
            }
            
            .ngmp18__hw3--t7 {
                font-weight: bold;
            }`);
        });
    });
}

function __writeFile(files, allData, dirUrl, finalCall=()=>{}){
    const file = files.shift();
    if(!file){
        finalCall(allData);
        return null;
    }

    const stream = fs.createReadStream(`${dirUrl}/${file}`);
    stream.on('data', (data)=>{
        allData+=data;
    }).on('end', ()=>{
        __writeFile(files, `${allData}\n`, dirUrl, finalCall);
    })
}

function __getFileName(str=""){
    return str.substring(0, str.lastIndexOf("."));
}


