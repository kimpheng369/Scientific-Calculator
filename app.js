import { ui } from './js/ui-controller.js';
import { graphing } from './js/graph-engine.js';
import { converter } from './js/unit-converter.js';

window.addEventListener('DOMContentLoaded', () => {
  graphing.init();
  converter.init();
  ui.init(graphing);
  
  console.log('Scientific Calculator v2.0 Modular initialized.');
});
