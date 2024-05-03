import STD from './STD.class';

// Import required modules
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// const importRegex = /^!import ('|")(.+)('|")/mg


export default class Parser {
  constructor() {
    this.parsedFiles = new Set();

    this.yamlSchema = new yaml.Schema([
      new yaml.Type('!folder', {
        kind: 'scalar',
        construct: (data) => this.folderTagHandler(data),
      }),
      new yaml.Type('!import', {
        kind: 'scalar',
        construct: (data) => this.importFile(data, data),
      }),
      new yaml.Type('!id', {
        kind: 'scalar',
        construct: (data) => this.context.currentID ? this.context.currentID + ':' + data : data,
      }),
      ...(
        STD.getSchemas()
        .map(schema => new yaml.Type('!'+schema.name, {
          kind: 'mapping',
          construct: (data) => ({
            ...schema.values,
            ...data
          }),
        }))
      )
    ]);
  }

  context = {};

  folderTagHandler(data) {
    const relativePath = data;
    const absolutePath = path.resolve(path.dirname(this.context.currentFile), relativePath);
    return absolutePath;
  }

  importFile(filename) {
    const currentPath = this.context.currentFile; 
    const file = filename.endsWith('.yaml')
    ? this.parseYAML(filename)
    : this.lookUpFile(this.folderTagHandler(filename));
    this.context.currentFile = currentPath;
    return file;
    
  }

  lookUpFile(filePath){
    this.context.currentFile = filePath;
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
  }

  parseYAML(filePath) {
    if (this.parsedFiles.has(filePath)) {
      return {};
    }
    let fileContent = this.lookUpFile(filePath);

    const data = yaml.load(fileContent, {
      schema: this.yamlSchema
    });

    this.parsedFiles.add(filePath);

    return data;
  }
}
