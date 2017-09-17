class Calculator {
  constructor (inputString) {
    this.tokenStream = this.lexer(inputString);
    console.log(this.tokenStream);
  }

  peek () {
    return this.tokenStream[0] || null;
  };

  get () {
    return this.tokenStream.shift();
  };

  lexer (inputString) {
    let tokenTypes = [
      ["NUMBER",  /^\d+/],
      ["ADD",     /^\+/],
      ["SUB",     /^\-/],
      ["MUL",     /^\*/],
      ["DIV",     /^\//],
      ["LPAREN",  /^\(/],
      ["RPAREN",  /^\)/],
      ["WHITESPACE",/^\s/]
    ];

    let tokens = [];
    let matched = true

    while (inputString.length > 0 && matched) {
      matched = false;

      tokenTypes.forEach(tokenRegex => {
        const token = tokenRegex[0]
        const regex = tokenRegex[1]

        const result = regex.exec(inputString)

        if (result !== null) {
          matched = true;
          tokens.push({name: token, value: result[0]});
          inputString = inputString.slice(result[0].length)
        }
      })

      if (!matched) {
        throw new Error("Found unparseable token: " + inputString);
      }

    }

    return tokens;
  };

  parseExpression () {
    const term = this.parseTerm()
    const a = this.parseA()

    return new TreeNode("Expression", term, a);
  };

  parseTerm () {
    const factor = this.parseFactor()
    const b = this.parseB()

    return new TreeNode("Term", factor, b);
  };

  parseA () {
    const nextToken = this.peek()
    if (nextToken && nextToken.name === "ADD") {
      this.get();
      return new TreeNode("A", "+", this.parseTerm(), this.parseA());
    } else if (nextToken && nextToken.name == "SUB") {
      this.get();
      return new TreeNode("A", "-", this.parseTerm(), this.parseA());
    } else {
      return new TreeNode("A")
    }
  };

  parseB () {
    const nextToken = this.peek()
    if (nextToken && nextToken.name === "MUL") {
      this.get();
      return new TreeNode("B", "*", this.parseFactor(), this.parseB());
    } else if (nextToken && nextToken.name == "DIV") {
      this.get();
      return new TreeNode("B", "/", this.parseFactor(), this.parseB());
    } else {
      return new TreeNode("B")
    }
  };

  parseFactor () {
    const nextToken = this.peek()
    switch (nextToken.name) {
      case "LPAREN":
        this.get();
        var expr = this.parseExpression();
        this.get();
        return new TreeNode("Factor", "(", expr, ")");
        break;
      case "SUB":
        this.get();
        var expr = this.parseFactor();
        return new TreeNode("Factor", "-", expr);
        break;
      default:
        const num = this.get()
        return new TreeNode("Factor", num.value);
    }
  };
}


class TreeNode{
  constructor(name, ...children){
  this.name = name;
  this.children = children;
  }
  accept(visitor) {
    return visitor.visit(this);
  }
}

function PrintOriginalVisitor() {
  this.visit = function(node) {
    switch(node.name) {
      case "Term":
      case "Expression":
        return node.children[0].accept(this) + node.children[1].accept(this);
        break;

      case "B":
      case "A":
        if(node.children.length > 0) {
          return  node.children[0] + node.children[1].accept(this) + node.children[2].accept(this);
        } else {
          return "";
        }
        break;
      default:
        switch (node.children.length) {
          case 3:
            return  node.children[0] + node.children[1].accept(this) + node.children[2];
            break;
          case 2:
            return  node.children[0] + node.children[1].accept(this);
            break;
          default:
            return node.children[0];
            break;
        }
        break;
    }
  }
}

function PostfixVisitor() {
  this.visit = function(node) {
    switch(node.name) {
      case "Expression":
        return node.children[0].accept(this) + node.children[1].accept(this);
        break;
      case "Term":
        return node.children[0].accept(this) + node.children[1].accept(this);
        break;
      case "A":
        if(node.children.length > 0) {
          return node.children[1].accept(this) + node.children[2].accept(this) + node.children[0];
        } else {
          return "";
        }
        break;
      case "Factor":
        if(node.children[0] === "(" ){
          return node.children[1].accept(this);
        } else if(node.children[0] ==="-") {
          return "-" + node.children[1].accept(this);
        } else{
          return node.children[0];
        }
        break;
      case "B":
        if(node.children.length > 0) {
          return node.children[1].accept(this) + node.children[2].accept(this) + node.children[0];
        } else {
          return "";
        }
        break;
      default:
        break;
    }
  }
}


function InfixVisitorCalc() {

  this.visit = function(node) {

    console.log('*******')
    console.log('parsing', node)
    switch(node.name) {
      case "Expression":
        var t = node.children[0].accept(this);
        var a = node.children[1].accept(this);
        console.log("adding t, a", t, a, t + a);
        return t+a;
        break;
      case "Term":
        var t = node.children[0].accept(this);
        var a = node.children[1].accept(this);
        console.log("e, f", t, a);
        console.log("multiplying e, f", t, a, t * a);
        return t*a;
        break;

      case "Factor":
        console.log('**factor', node);
        if(node.children[0] === "(" ){
          var x = node.children[1].accept(this);
          console.log("factor ", x);
          return x;
        } else if(node.children[0] ==="-") {
          var x = node.children[1].accept(this);
          console.log("-1 * factor ", x);
          return -1 * x;
        } else{
          return Number(node.children[0]);
        }
        break;
      case "A":
        if(node.children.length > 0) {
          var c1 = node.children[1].accept(this)
          var c2 = node.children[2].accept(this)
          var val = node.children[1].accept(this) + node.children[2].accept(this);
          if(node.children[0] == "+") {
            console.log('added ' + c1 + ' and ' + c2 + ' result is ', val)
            return val;
          } else {
            console.log('subtracted ' + c1 + ' and ' + c2 + ' result is ', val)
            return -val;
          }

        } else {
          return 0;
        }
        break;
      case "B":
        if(node.children.length > 0) {
          var c1 = node.children[1].accept(this)
          var c2 = node.children[2].accept(this)
          var val = node.children[1].accept(this) * node.children[2].accept(this);
          if(node.children[0] == "*") {
            console.log('multiplied ' + c1 + ' and ' + c2 + ' result is ', val)
            return val;
          } else {
            return 1/val;
          }

        } else {
          return 1;
        }
        break;
      default:
        break;
    }
  }
}

const calc = new Calculator('(21-3)/3-(-5/2)')
const tree = calc.parseExpression()
const printOriginalVisitor = new InfixVisitorCalc()
console.log(tree.accept(printOriginalVisitor));