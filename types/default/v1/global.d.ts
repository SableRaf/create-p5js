// Limitations: vscode will auto-acquire these type definitions from @types/p5 (DefinitelyTyped repo) which are not all up to date.
// For better types consider moving to p5.js 2.x

// All that's needed for p5 global-mode...
// IF we're not referring to the p5 types in JSDoc comments
import * as p5Global from "p5/global";

//Needed for p5 instance-mode and/or for referring to the
//types (e.g. in jsdoc comments, even in p5 global-mode)
import module from "p5";
export = module;
export as namespace p5;