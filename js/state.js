export const state = {
  activeTab: 'calc-tab',
  expression: '',
  result: '0',
  lastAns: 0,
  radMode: true, 
  memoryValue: 0,
  is2ndActive: false,
  history: JSON.parse(localStorage.getItem('calc_history') || '[]'),
};

export const FUNCTIONS = new Set([
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
  'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh',
  'ln', 'log', 'log2', 'sqrt', 'cbrt', 'abs', 'exp',
  'floor', 'ceil', 'round', 'trunc', 'rand', 'mod'
]);

export const CONSTANTS = {
  'π': Math.PI,
  'e': Math.E,
  'G': 6.67430e-11,
  'c': 299792458,
  'h': 6.62607015e-34,
  'k': 1.380649e-23,
  'NA': 6.02214076e23,
  'R': 8.314462618,
  'σ': 5.670374419e-8,
  'me': 9.1093837e-31,
  'mp': 1.6726219e-27,
};
