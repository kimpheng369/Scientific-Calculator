import { FUNCTIONS, CONSTANTS } from './state.js';
export function tokenize(str) {
  str = str.replace(/÷/g, '/')
           .replace(/×/g, '*')
           .replace(/−/g, '-')
           .replace(/π/g, 'pi');
  
  let i = 0;
  const tokens = [];
  
  while (i < str.length) {
    let c = str[i];
    
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (/\d/.test(c) || (c === '.' && /\d/.test(str[i + 1]))) {
      let numStr = "";
      while (i < str.length && (/\d/.test(str[i]) || str[i] === '.')) {
        numStr += str[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
      continue;
    }
    if ('+-*/%^!()'.indexOf(c) !== -1) {
      tokens.push({ type: 'OPERATOR', value: c });
      i++;
      continue;
    }

    if (/[a-zA-Z]/.test(c) || c === 'σ' || c === 'π') {
      let word = "";
      while (i < str.length && (/[a-zA-Z0-9]/.test(str[i]) || str[i] === 'σ' || str[i] === 'π')) {
        word += str[i];
        i++;
      }
      const lowerWord = word.toLowerCase();
      if (lowerWord === 'x') {
        tokens.push({ type: 'VARIABLE', value: 'x' });
      } else {
        tokens.push({ type: 'WORD', value: word }); // Keep original casing for constants like G, NA
      }
      continue;
    }
    
    throw new Error(`Unexpected character: "${c}"`);
  }
  
  return tokens;
}

export function injectImplicitMultiplication(tokens) {
  const result = [];
  
  for (let idx = 0; idx < tokens.length; idx++) {
    const current = tokens[idx];
    result.push(current);
    
    if (idx + 1 < tokens.length) {
      const next = tokens[idx + 1];
      
      const currentIsNum = current.type === 'NUMBER';
      const currentIsVar = current.type === 'VARIABLE';
      const currentIsConst = current.type === 'WORD' && !FUNCTIONS.has(current.value);
      const currentIsClosingParen = current.type === 'OPERATOR' && current.value === ')';
      const currentIsFactorial = current.type === 'OPERATOR' && current.value === '!';
      
      const nextIsNum = next.type === 'NUMBER';
      const nextIsVar = next.type === 'VARIABLE';
      const nextIsConstWord = next.type === 'WORD' && !FUNCTIONS.has(next.value);
      const nextIsFuncWord = next.type === 'WORD' && FUNCTIONS.has(next.value);
      const nextIsOpeningParen = next.type === 'OPERATOR' && next.value === '(';
      
      const leftEligible = currentIsNum || currentIsVar || currentIsConst || currentIsClosingParen || currentIsFactorial;
      const rightEligible = nextIsNum || nextIsVar || nextIsConstWord || nextIsFuncWord || nextIsOpeningParen;
      
      if (leftEligible && rightEligible) {
        result.push({ type: 'OPERATOR', value: '*' });
      }
    }
  }
  
  return result;
}

export function parseAndEvaluate(tokens, radMode, lastAns, vars = {}) {
  let pos = 0;
  
  function peek() {
    return tokens[pos];
  }
  
  function consume(expectedValue) {
    const tok = tokens[pos];
    if (!tok) {
      throw new Error("Unexpected end of expression");
    }
    if (expectedValue !== undefined) {
      if (tok.type !== 'OPERATOR' || tok.value !== expectedValue) {
        throw new Error(`Expected '${expectedValue}' but got '${tok.value}'`);
      }
    }
    pos++;
    return tok;
  }
  
  function parseExpression() {
    let val = parseTerm();
    while (true) {
      const tok = peek();
      if (tok && tok.type === 'OPERATOR' && (tok.value === '+' || tok.value === '-')) {
        consume();
        const right = parseTerm();
        if (tok.value === '+') val += right;
        else val -= right;
      } else {
        break;
      }
    }
    return val;
  }
  
  function parseTerm() {
    let val = parseFactor();
    while (true) {
      const tok = peek();
      if (tok && tok.type === 'OPERATOR' && (tok.value === '*' || tok.value === '/' || tok.value === '%')) {
        consume();
        const right = parseFactor();
        if (tok.value === '*') {
          val *= right;
        } else if (tok.value === '%') {
          val %= right;
        } else {
          if (right === 0) throw new Error("Division by zero");
          val /= right;
        }
      } else {
        break;
      }
    }
    return val;
  }
  
  function parseFactor() {
    let val = parseBase();
    while (true) {
      const tok = peek();
      if (tok && tok.type === 'OPERATOR' && tok.value === '^') {
        consume();
        const right = parseBase();
        val = Math.pow(val, right);
      } else {
        break;
      }
    }
    return val;
  }
  
  function parseBase() {
    const tok = peek();
    let sign = 1;
    if (tok && tok.type === 'OPERATOR' && (tok.value === '+' || tok.value === '-')) {
      consume();
      if (tok.value === '-') sign = -1;
    }
    
    let val = parsePrimary();
    
    const post = peek();
    if (post && post.type === 'OPERATOR' && post.value === '!') {
      consume();
      val = factorial(val);
    }
    
    return sign * val;
  }
  
  function parsePrimary() {
    const tok = peek();
    if (!tok) {
      throw new Error("Unexpected end of expression");
    }
    
    if (tok.type === 'NUMBER') {
      consume();
      return tok.value;
    }
    
    if (tok.type === 'VARIABLE') {
      consume();
      if (vars[tok.value] === undefined) {
        throw new Error(`Variable ${tok.value} is undefined`);
      }
      return vars[tok.value];
    }
    
    if (tok.type === 'WORD') {
      consume();
      const name = tok.value;
      const lowerName = name.toLowerCase();
      
      if (lowerName === 'pi' || name === 'π') return Math.PI;
      if (lowerName === 'e') return Math.E;
      if (lowerName === 'ans') return lastAns;

      if (CONSTANTS[name] !== undefined) return CONSTANTS[name];
      
      if (!FUNCTIONS.has(lowerName)) {
        throw new Error(`Unknown identifier: "${name}"`);
      }
      
      consume('(');
      const arg = parseExpression();
      consume(')');
      
      switch (lowerName) {
        case 'sin': return Math.sin(adjustTrigInput(arg, radMode));
        case 'cos': return Math.cos(adjustTrigInput(arg, radMode));
        case 'tan': return Math.tan(adjustTrigInput(arg, radMode));
        case 'asin': return adjustTrigOutput(Math.asin(arg), radMode);
        case 'acos': return adjustTrigOutput(Math.acos(arg), radMode);
        case 'atan': return adjustTrigOutput(Math.atan(arg), radMode);
        case 'sinh': return Math.sinh(arg);
        case 'cosh': return Math.cosh(arg);
        case 'tanh': return Math.tanh(arg);
        case 'asinh': return Math.asinh(arg);
        case 'acosh': return Math.acosh(arg);
        case 'atanh': return Math.atanh(arg);
        case 'ln': 
          if (arg <= 0) throw new Error("ln of non-positive");
          return Math.log(arg);
        case 'log': 
          if (arg <= 0) throw new Error("log of non-positive");
          return Math.log10(arg);
        case 'log2': 
          if (arg <= 0) throw new Error("log2 of non-positive");
          return Math.log2(arg);
        case 'sqrt': 
          if (arg < 0) throw new Error("Negative square root");
          return Math.sqrt(arg);
        case 'cbrt': return Math.cbrt(arg);
        case 'abs': return Math.abs(arg);
        case 'exp': return Math.exp(arg);
        case 'floor': return Math.floor(arg);
        case 'ceil': return Math.ceil(arg);
        case 'round': return Math.round(arg);
        case 'trunc': return Math.trunc(arg);
        case 'rand': return Math.random() * arg;
        default: throw new Error(`Function not implemented: ${lowerName}`);
      }
    }
    
    if (tok.type === 'OPERATOR' && tok.value === '(') {
      consume();
      const val = parseExpression();
      consume(')');
      return val;
    }
    
    throw new Error(`Unexpected token: "${tok.value}"`);
  }
  
  const finalVal = parseExpression();
  if (pos < tokens.length) {
    throw new Error("Syntax error (extra operators/values)");
  }
  
  return finalVal;
}

function factorial(n) {
  if (n < 0 || !Number.isInteger(n)) {
    throw new Error("Factorial matches integer >= 0");
  }
  if (n > 170) return Infinity;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

function adjustTrigInput(val, radMode) {
  return radMode ? val : val * (Math.PI / 180);
}

function adjustTrigOutput(val, radMode) {
  return radMode ? val : val * (180 / Math.PI);
}

export function smartBackspace(expr) {
  const functionSlices = [
    'asinh(', 'acosh(', 'atanh(',
    'sinh(', 'cosh(', 'tanh(',
    'asin(', 'acos(', 'atan(',
    'log2(', 'log(', 'sqrt(', 'cbrt(',
    'sin(', 'cos(', 'tan(', 'abs(', 'exp(', 'ln(',
    'floor(', 'ceil(', 'round(', 'trunc(', 'rand('
  ];
  for (const fs of functionSlices) {
    if (expr.endsWith(fs)) {
      return expr.substring(0, expr.length - fs.length);
    }
  }
  return expr.substring(0, expr.length - 1);
}
