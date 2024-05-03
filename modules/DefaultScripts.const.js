

export default class DefaultScripts {
  static scripts = {};

  static register(name, content){
    this.scripts[name] = content;
  }

}