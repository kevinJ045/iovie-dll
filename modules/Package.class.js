import { Script } from "./Script.class";



export default class Package {
  packagePath = "";
  packageName = "";

  /**
   * @type {Script[]}
   */
  scripts = [];

  constructor({ packagePath }){
    this.packagePath = packagePath;
  }

}