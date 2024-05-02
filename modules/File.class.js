import 
  fs
from 
  "fs";


/**
 * File Class
 */
export default class IFile {
  /**
   * Full file path
   */
  filepath = "";

  /**
   * File Constructor
   * @param {{ filepath: string }} param0 
   */
  constructor({
    filepath
  }){
    this.filepath = filepath
  }

  /**
   * Full file content
   */
  content = "";

  /**
   * Read file
   */
  read(){
    if(!this.content) this.content = fs.readFileSync(this.filepath, { encoding: 'utf-8' });
    return this.content;
  }


}