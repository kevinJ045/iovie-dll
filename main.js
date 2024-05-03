import fs from "fs";
import STD from "./modules/STD.class";
import path from "path";
import Parser from "./modules/Parser.class";
import Package from "./modules/Package.class";
console.log('==========================');

STD.registerMap(new Parser().parseYAML('./packages/iovie/std.yaml'));

const f = new Package('./packages/i/');

console.log(f.findById('i:goober'));