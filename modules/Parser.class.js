import Context from "./Context.class";
import Tokenizer from "./Tokenizer.class";



export default class Parser {

  /**
   * 
   * @param {Tokenizer} tokenizer 
   */
  constructor(tokenizer){
    this.tokenizer = tokenizer;
    this.context = new Context();
  }

  

}