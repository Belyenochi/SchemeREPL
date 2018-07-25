/*
		Type Definitiions
		Symbol = str              # A Scheme Symbol is implemented as a JavaScript str
		Number = double           # A Scheme Number is implemented as a JavaScript double
		Booleans = boolean        # A Scheme Boolean is implemented as a JavaScript boolean
		Characters = str          # A Scheme Character is implemented as a JavaScript str
		Strings = str             # A Scheme Character is implemented as a JavaScript str
		Atom   = (Symbol, Number) # A Scheme Atom is a Symbol or Number
		List   = list             # A Scheme List is implemented as a JavaScript list
		Exp    = (Atom, List)     # A Scheme expression is an Atom or List
		Env    = dict             # A Scheme environment (defined below)
                              # is a mapping of (key, value)

		<Symbol>          := /"[^"]*"/

		<Number>          := /^[+-]?\d+(\.\d+)?/

		<Boolean>         := /(#[t|f])?/

		<Strings>         := /"[^"]*"/

		<Character>       := + | - | * | /

		<Atom>            := <Symbol> | <Number> | <Boolean> | <Strings> | <Character>

		<Pair>            := (cons <Atom> <Atom>) | (cons <Atom> <Pair>)

    <expr>            := <Symbol>|<Number>|<Boolean>|<Word>|<Character>|<Procedures>

    <exprs>           := <expr> | <expr> <exprs>

		<Procedures>      := ( <expr> ) | ( <expr> ) <Procedures>

		<Word>            := /^[^\s(),"]+/

*/

class SExpression {
  constructor(value, children = [], parent) {
    this.value  = value
    this.children  = children
    this.parent  = parent
  }
}

class Pair {
	constructor(first, second) {
		this.first = first
		this.second = second
	}
}

class SchemeError {
  constructor(errorMsg) {
    this.errorMsg = errorMsg;
  }
}

function Lexer(program, token) {
  var match, expr;

  program = skipSpace(program);
  if (match = /"[^"]*"/.exec(program)) { // Strings
    token.push({type: "value", value: match[0]});
  }
  else if (match = /^[+-]?\d+(\.\d+)?/.exec(program)) {// number
    token.push({type: "value", value: Number(match[0])});
  }
	else if (match = /#[t|f]/.exec(program)) { // Boolean
    token.push({type: "value", value: Boolean(match[0])});
  }
  else if (match = /^cons/.exec(program)) { // Pair
    token.push({type: "word", name: match[0]});
  }
  else if (match = /^[^\s(),"]+/.exec(program)) {// word 关键字 (变量名和函数名)
    token.push({type: "word", name: match[0]});
  }
  else if (match =  /^[()]/.exec(program)) {
    token.push(match[0]);
  }
  else {
    throw new SchemeError("Unexpected syntax: " + program);
	}
  //token.push(match);
  program = skipSpace(program.slice(match[0].length));

  return program.length != 0 ? Lexer(program, token) : token;
}

function skipSpace(string) {
  var first = string.search(/[\S|\u0000]/);
  if (first == -1) return "";
  return string.slice(first);
}

function parse(tokens) {
  // 获取token
  let token = Lexer(tokens, []);
  let current, program = new SExpression();

  program.value = "Top SExpression";
  current = program;
  token.forEach((Node) => {
    if (Node === "(") {
        let newNode = new SExpression();
        newNode.value = {type: "apply", name: "SExpression"};
        newNode.parent = current;
        current.children.push(newNode);
        current = newNode;
    } else if (Node === ")") {
        current = current.parent;
    } else {
        current.children.push(
        	new SExpression(Node, [] ,current));
    }
  })

  if (current !== program) {
    throw new SchemeError("Parentheses do not appear in pairs")
  }

  return program.children;
}


/*
< Scheme so cool >
 --------
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||
*/
function evaluate(SExpression, Scope) {
	console.log(SExpression);
  switch(SExpression.value.type) {
    case "value":
      return SExpression.value.value;

    case "word":
      if (SExpression.value.name in Scope)
        return Scope[SExpression.value.name];
      else
        throw new SchemeError("Undefined variable: " +
                                 SExpression.value.name);
    // eval apply元语言循环把语句（SExpression）在作用域（Scope）
    // 转化成对象（SObject）并对作用域（Scope）产生作用的过程
    case "apply":
      if (SExpression.children[0].value.type == "word" &&
          SExpression.children[0].value.name in specialForms)
        return specialForms[SExpression.children[0].value.name]
      (SExpression.children.slice(1), Scope);
      let SObject = evaluate(SExpression.children[0], Scope);
      if (typeof SObject != "function")
        throw new SchemeError("Applying a non-function.");

      return SObject.apply(null, SExpression.children.map(function(args, index) {
        if (index !== 0) {
          return evaluate(args, Scope);
        }
      }).slice(1));
  }
}


/*
	#################
	# Special forms #
	#################
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

specialForms["while"] = function(args, env) {
  if (args.length != 2)
    throw new SchemeError("Bad number of args to while");

  while (evaluate(args[0], env) !== false)
    evaluate(args[1], env);

  // Since undefined does not exist in Egg, we return false,
  // for lack of a meaningful result.
  return false;
};

specialForms["evals"] = function(args, env) {
  var value = false;
  args.forEach(function(arg) {
    value = evaluate(arg, env);
  });
  return value;
};

specialForms["define"] = function(args, env) {
  if (args.length != 2 || args[0].value.type != "word")
    throw new SchemeError("Bad use of define");
  var value = evaluate(args[1], env);
  env[args[0].value.name] = value;
  return value;
};

specialForms["lambda"] = function(args, env, trans) {
  if (!args.length)
    throw new SchemeError("Functions need a body");
  function name(expr) {
    if (expr.value.type != "word")
      throw new SchemeError("Arg names must be words");
    return expr.value.name;
  }
  var argNames = trans ? args : args.slice(0, args.length - 1)[0].children.map(name);
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

specialForms["let"] = function(args, env) {
  let arg = [], argNames = [];
  console.log(args);
  if (!args.length)
    throw new SchemeError("let need a body");

  // 分别取出形参和实参
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

/*
	########################
	# Primitive Operations #
	########################
*/
var topEnv = Object.create(null);

// Scheme Boolean -> js boolean
topEnv["#t"] = true;
topEnv["#f"] = false;

// Scheme Character implement
["+", "-", "*", "/", "==", "<", ">"].forEach(function(op) {
  topEnv[op] = new Function("a, b", "return a " + op + " b;");
});

topEnv["cons"] = (x, y) => { return new Pair(x, y) }
topEnv["car"] = (pair) => { return pair.first }
topEnv["cdr"] = (pair) => { return pair.second }
topEnv["boolean?"] = (x) => { return x === true || x === false }
topEnv["not"] = (x) => { return !A }
topEnv["eq?"] = (x, y) => { return x === y }
topEnv["pair?"] = (x) => { return x.constructor.name === "Pair" }
topEnv["null?"] = (x) => { return x === "nil" }
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

var env = Object.create(topEnv);
// run Scheme!!!
// function run() {
//   var program = Array.prototype.slice
//     .call(arguments, 0).join("\n");

//   let process = parse(program);
//   while (process.length !== 0) {
//     if (process.length === 1) {
//       return evaluate(process[0], env)
//     }
//     evaluate(process.shift(), env);
//   }
// }
function run(test) {

  let process = parse(test);
  evaluate(process[0], env);
}



