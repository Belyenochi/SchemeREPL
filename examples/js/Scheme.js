/*
    Type Definitiions
    Symbol      = str                                          # A Scheme Symbol is implemented as a JavaScript str
    Number      = double                                       # A Scheme Number is implemented as a JavaScript double
    Boolean     = boolean                                      # A Scheme Boolean is implemented as a JavaScript boolean
    Characters  = str                                          # A Scheme Character is implemented as a JavaScript str
    Strings     = str                                          # A Scheme Character is implemented as a JavaScript str
    Atom        = (Symbol, Number,Boolean,Strings,Character)   # A Scheme Atom is a Symbol or Number
    Expr        = (Symbol, Number, Boolean,)                   # A Scheme expression is an Atom or List
    Env         = hashTable                                    # A Scheme environment  is a mapping of (key, value)

    Basic Type
    <Symbol>          := /"[^"]*"/

    <Number>          := /^[+-]?\d+(\.\d+)?/

    <Boolean>         := /(#[t|f])?/

    <Strings>         := /"[^"]*"/

    <Character>       := + | - | * | /

    Grammar
    <Atom>            := <Symbol> | <Number> | <Boolean> | <Strings> | <Character>

    <Pair>            := (cons <Atom> <Atom>) | (cons <Atom> <Pair>)

    <expr>            := <Symbol> | <Number> | <Boolean> | <Character> | <Procedures>

    <exprs>           := <expr> | <expr> <exprs>

    <Procedures>      := ( <expr> ) | ( <expr> ) <Procedures>

    <variable>        := <Atom> | <Procedures>


*/

/*
  SExpression: (value, children, parentNode)->SExpression
  usage: value is SExpression Node value,
         children is used as Recursive decline Traversing AST
         parent is used as Backtracking
*/
class SExpression {
  constructor(value, children = [], parent) {
    this.value = value
    this.children = children
    this.parent = parent
  }
}

/*
  Pair: (firstNode, secondNode)->Pair
  usage: Represents the Scheme Pair data structure
*/
class Pair {
  constructor(first, second) {
    this.first = first
    this.second = second
  }
}

/*
  SchemeError: String->SchemeError
  usage: Convert some exceptions from the interpretation
         process to Scheme exception information
*/
class SchemeError {
  constructor(errorMsg) {
    this.errorMsg = errorMsg;
  }
}

/*
  parser: (String, Array)->Array
  usage: Lexical analysis of program and output the
         result to the token array
*/
function Lexer(program, token) {
  var match, expr;

  program = skipSpace(program);
  if (match = /"[^"]*"/.exec(program)) { // Strings
    token.push({
      type: "value",
      value: match[0]
    });
  } else if (match = /^[+-]?\d+(\.\d+)?/.exec(program)) { // number
    token.push({
      type: "value",
      value: Number(match[0])
    });
  } else if (match = /#[t|f]/.exec(program)) { // Boolean
    token.push({
      type: "value",
      value: Boolean(match[0])
    });
  } else if (match = /^cons/.exec(program)) { // Pair
    token.push({
      type: "word",
      name: match[0]
    });
  } else if (match = /^[^\s(),"]+/.exec(program)) { // Word keyword (variable name and function name)
    token.push({
      type: "word",
      name: match[0]
    });
  } else if (match = /^[()]/.exec(program)) {
    token.push(match[0]);
  } else {
    throw new SchemeError("Unexpected syntax: " + program);
  }
  program = skipSpace(program.slice(match[0].length));

  return program.length != 0 ? Lexer(program, token) : token;
}

/*
  parser: String->String
  usage: trim string
*/
function skipSpace(string) {
	console.log(String);
  var first = string.search(/[\S|\u0000]/);
  if (first == -1) return "";
  return string.slice(first);
}

/*
  parser: Array->AST
  usage: Whenever a left parenthesis is matched, the SExpression is
  constructed, the type is apply, apply represents that this is a procedure,
  and then () is inserted into the children array of the number and back to
  the parent node whenever a right parenthesis is matched.
*/
function parser(tokens) {
  // get token
  let token = Lexer(tokens, []);
  let current, program = new SExpression();

  program.value = "Top SExpression";
  current = program;
  token.forEach((Node) => {
    if (Node === "(") {
      let newNode = new SExpression();
      newNode.value = {
        type: "apply",
        name: "SExpression"
      };
      newNode.parent = current;
      current.children.push(newNode);
      current = newNode;
    } else if (Node === ")") {
      current = current.parent;
    } else {
      current.children.push(
        new SExpression(Node, [], current));
    }
  })

  if (current !== program) {
    throw new SchemeError("Parentheses do not appear in pairs")
  }

  return program.children;
}

/*
  evaluate: AST->atom
  usage: Traverse and execute abstract syntax numbers, use Object.assign to act
         as immutable data (each time a new environment is created without
         modifying the original environment), meta-language loops, and
         evaluate a node with SExpression.value.type as apply.
         The essence of eval-apply is: Eval apply meta language loop to put
         the statement (SExpression) in the scope (Scope) and the process of
         transforming into an object (SObject) and acting on the scope.

< Scheme so cool >
 --------
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||

*/
function evaluate(SExpression, Scope) {
  switch (SExpression.value.type) {
    case "value":
      return SExpression.value.value;

    case "word":
      if (SExpression.value.name in Scope)
        return Scope[SExpression.value.name];
      else
        throw new SchemeError("Undefined variable: " +
          SExpression.value.name);
    case "apply":
      // Used to represent immutable data
      //let newScope = Object.assign({}, Scope);
			let newScope = Scope;

      if (SExpression.children[0].value.type == "word" &&
        SExpression.children[0].value.name in specialForms)
        return specialForms[SExpression.children[0].value.name]
          (SExpression.children.slice(1), newScope);
      let SObject = evaluate(SExpression.children[0], newScope);
      if (typeof SObject != "function")
        throw new SchemeError("Applying a non-function.");

      return SObject.apply(null, SExpression.children.map(function(args, index) {
        if (index !== 0) {
          return evaluate(args, newScope);
        }
      }).slice(1));
  }
}

/*
  if: (args, env)->atom
  usage: Special forms if in Scheme grammar,
         args[0] is a Analyzing conditions
         args[1] if true
         args[2] if false
*/
var specialForms = Object.create(null);

specialForms["if"] = function(args, env) {
  if (args.length != 3)
    throw new SchemeError("Bad number of args to if");

  if (evaluate(args[0], env) !== false)
    return evaluate(args[1], env);
  else
    return evaluate(args[2], env);
};

/*
  while: (args, env)->atom
  usage: Special forms while in Scheme grammar,
         args[0] is a Analyzing conditions
         args[1] if true
         args[2] eval false
*/
specialForms["while"] = function(args, env) {
  if (args.length != 2)
    throw new SchemeError("Bad number of args to while");

  while (evaluate(args[0], env) !== false)
    evaluate(args[1], env);

  // Since undefined does not exist in Egg, we return false,
  // for lack of a meaningful result.
  return false;
};

/*
  evals: (args, env)->atom
  usage: Special forms evals in Scheme grammar,
         Cycle evaluate args
*/
specialForms["evals"] = function(args, env) {
  var value = false;
  args.forEach(function(arg) {
    value = evaluate(arg, env);
  });
  return value;
};

/*
  define: (args, env)->atom
  usage: Special forms define in Scheme grammar,
         Modify the environment
*/
specialForms["define"] = function(args, env) {
  if (args.length != 2 || args[0].value.type != "word")
    throw new SchemeError("Bad use of define");
  var value = evaluate(args[1], env);
  env[args[0].value.name] = value;
  return value;
};

/*
  lambda: (args, env, translation)->atom
  usage: Special forms lambda in Scheme grammar,
         Construct an anonymous function,translation
         Translation for various grammatical transformations
*/
specialForms["lambda"] = function(args, env, trans) {
  if (!args.length)
    throw new SchemeError("Functions need a body");

  function name(expr) {
    if (expr.value.type != "word")
      throw new SchemeError("Arg names must be words");
    return expr.value.name;
  }
  var argNames = trans ? args.slice(0, args.length - 1) : args.slice(0, args.length - 1)[0].children.map(name);
  var body = args[args.length - 1];

  return function() {
    if (arguments.length != argNames.length)
      throw new SchemeError("Wrong number of arguments");
    var localEnv = Object.create(env);
    for (var i = 0; i < arguments.length; i++)
      localEnv[argNames[i]] = arguments[i];
    return evaluate(body, localEnv);
  };
};

/*
  let: (args, env)->atom
  usage: Convert the letter syntax to, for example:
         (let ((a 1) (b 2)) body) =>
        （(lambda (a b) body) 1 2）
*/
specialForms["let"] = function(args, env) {
  let arg = [],argNames = [];
  if (!args.length)
    throw new SchemeError("let need a body");

  // Take out the formal parameters and actual parameters
  args[0].children.forEach((item) => {
    if (item.children[0].value.type !== "word" &&
      item.children[1].value.type !== "value") {
      return new SchemeError("let variable is Error");
    }
    argNames.push(item.children[0].value.name);
    arg.push(item.children[1].value.value);
  })

  argNames.push(args[args.length - 1]);
  return specialForms["lambda"](argNames, env, 'let')(...arg);
};

var topEnv = Object.create(null);

/*
  Primitive Operations: (...)->atom
  usage: Primitive Operations in Javascript implement
*/

["+", "-", "*", "/", "==", "<", ">"].forEach(function(op) {
  topEnv[op] = new Function("a, b", "return a " + op + " b;");
})

topEnv["cons"] = (x, y) => {
  return new Pair(x, y)
}
topEnv["#t"] = true;

topEnv["#f"] = false;

topEnv["car"] = (pair) => {
  return pair.first
}
topEnv["cdr"] = (pair) => {
  return pair.second
}
topEnv["boolean?"] = (x) => {
  return x === true || x === false
}
topEnv["not"] = (x) => {
  return !A
}
topEnv["eq?"] = (x, y) => {
  return x === y
}
topEnv["pair?"] = (x) => {
  return x.constructor.name === "Pair"
}
topEnv["null?"] = (x) => {
  return x === "nil"
}
topEnv["list?"] = (x) => {
  while (x !== "nil") {
    if (x.constructor.name !== "Pair") {
      return false;
    }
    x = x.second;
  }
  return false;
}
topEnv["list"] = (vals) => {
  result = "nil";
  for (let i = 0; i < vals.length; i++) {
    result = new Pair(vals[i], result)
  }
  return result;
}

topEnv["print"] = (value) => {
  console.log(value);
  return value;
};

// CLI global envirinment
var env = Object.create(topEnv);

/*
  define: (args)->atom
  usage: Run the interpreter by typing the contents of the Command
*/
function run() {
  var program = Array.prototype.slice
    .call(arguments, 0).join("\n");

  let process = parser(program);
  return evaluate(process[0], env);
}
