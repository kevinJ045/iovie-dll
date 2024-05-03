import STD from './STD.class';

// Import required modules
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const importRegex = /^!import ('|")(.+)('|")/mg


export default class Parser {
  constructor() {
    this.parsedFiles = new Set();

    this.yamlSchema = new yaml.Schema([
      new yaml.Type('!folder', {
        kind: 'scalar',
        construct: this.folderTagHandler,
      }),
      new yaml.Type('!import', {
        kind: 'scalar',
        construct: this.importFile,
      }),
    ]);
  }

  folderTagHandler(data) {
    const relativePath = data;
    const absolutePath = path.resolve(this.currentFile, relativePath);
    return absolutePath;
  }

  importFile(filename, packageName) {
    return this.parseYAML(filename, packageName, true);
  }

  currentFile = "";
  lookUpFile(filePath, packageName){
    console.log(packageName);
    if(STD.find(packageName)){
      return STD.find(packageName);
    } else {
      this.currentFile = filePath;
      return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
    }
  }

  sanitizeData(data){
    for(let i in data){
      if(i.startsWith('iovie.')){
        delete data[i];
      }
    }
  }

  parseYAML(filePath, packageName, string) {
    if (this.parsedFiles.has(filePath)) {
      return {};
    }
    let fileContent = this.lookUpFile(filePath, packageName);

    let match;
    while(match = importRegex.exec(fileContent)){
      fileContent = fileContent.replace(match[0], () => {
        return this.importFile(path.resolve(path.dirname(filePath), match[2]), match[2]);
      });
    }

    const data = string ? fileContent : yaml.load(fileContent, {
      schema: this.yamlSchema
    });

    this.parsedFiles.add(filePath);

    if(!string){
      this.sanitizeData(data);
    }

    return data;
  }
}
