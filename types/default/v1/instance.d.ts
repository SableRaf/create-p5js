// Limitations: vscode will auto-acquire these type definitions from @types/p5 (DefinitelyTyped repo) which are not all up to date.
// For better types consider moving to p5.js 2.x

//Needed for p5 instance-mode and/or for referring to the
//types (e.g. in jsdoc comments)
import module from "p5";
export = module;
export as namespace p5;