import { State, Options, OnError, OnToken } from '../types';
import { Context } from '../common';

/**
 * Creating the parser
 *
 * @param source The source coode to parser
 * @param options The parser options
 * @param context Context masks
 */
export function parseSource(
  source: string,
  options: Options | void,
  /*@internal*/
  context: Context): any {
  let onError: OnError;
  let onComment: any;
  let onToken: OnToken;
  let sourceFile: string = '';
  let c = context;

  if (options !== undefined) {
     /* // The flag to enable module syntax support
      if (options.module) context |= Context.Module;
      // The flag to enable stage 3 support (ESNext)
      if (options.next) context |= Context.OptionsNext;
      // The flag to enable React JSX parsing
      if (options.jsx) context |= Context.OptionsJSX;
      // The flag to enable start and end offsets to each node
      if (options.ranges) context |= Context.OptionsRanges;
      // The flag to enable line/column location information to each node
      if (options.loc) context |= Context.OptionsLoc;
      // The flag to attach raw property to each literal node
      if (options.raw) context |= Context.OptionsRaw;
      // Attach raw property to each identifier node
      if (options.rawIdentifier) context |= Context.OptionsRawidentifiers;
      // The flag to allow return in the global scope
      if (options.globalReturn) context |= Context.OptionsGlobalReturn;
      // The flag to allow to skip shebang - '#'
      if (options.skipShebang) context |= Context.OptionsShebang;
      // Set to true to record the source file in every node's loc object when the loc option is set.
      if (!!options.source) sourceFile = options.source;
      // Create a top-level comments array containing all comments
      if (!!options.comments) context |= Context.OptionsComments;
      // The flag to enable implied strict mode
      if (options.impliedStrict) context |= Context.Strict;
      // The flag to enable experimental features
      if (options.experimental) context |= Context.OptionsExperimental;
      // The flag to set to bypass methods in Node
      if (options.node) context |= Context.OptionsNode;
      // The flag to enable editor mode
      if (options.edit != null) onError = options.edit;
      */
      if (options.onToken != null) onToken = options.onToken;
      // The callback for handling comments
      if (options.onComment != null) onComment = options.onComment;

  }

  // Create the parser object
   const state = new State(source, onToken, onComment);

   // TODO

  }
