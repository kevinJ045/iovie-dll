import path from "path";
import Parser from "./Parser.class";
import fs from 'fs';

export default class Package {

  data = [];

  constructor(pathname) {
    this.pathname = pathname;
    const mainfile = path.join(pathname, 'main.yaml');
    this.parser = new Parser();

    const mainFileData = this.parser.parseYAML(mainfile);

    this.manifest = mainFileData.manifest;
    this.parser.context.currentID = this.manifest.id;

    this.lookUp(mainFileData.data.lookUp);
  }

  lookUp(lpath) {
    const lookupPath = path.resolve(this.pathname, lpath);

    const files = fs.readdirSync(lookupPath);

    files.forEach((file) => {
      const filePath = path.join(lookupPath, file);
      
      if (fs.statSync(filePath).isDirectory()) {
        this.lookUp(filePath);
      } else if (path.extname(file) === '.yaml') {
        const parsedData = this.parser.parseYAML(filePath);
        this.data.push(parsedData);
      }
    });
  }

  findById(id){
    return this.data.find(i => i.manifest.id == id);
  }

}