/**
 * General UI Controller & Event Bindings
 */

import { state, FUNCTIONS, CONSTANTS } from './state.js';
import { tokenize, injectImplicitMultiplication, parseAndEvaluate, smartBackspace } from './math-parser.js';

export const ui = {
  init(graphing) {
    const themeBtn = document.getElementById('theme-toggle-btn');
    const themes = ['astro-dark', 'theme-light', 'theme-cyberpunk'];
    let currentTheme = localStorage.getItem('calc_theme') || 'astro-dark';

    document.body.className = '';
    if (currentTheme !== 'astro-dark') {
      document.body.classList.add(currentTheme);
    }
    
    const updateThemeIcon = (theme) => {
      if (!themeBtn) return;
      const icon = themeBtn.querySelector('i');
      if (!icon) return;
      
      icon.className = 'fa-solid';
      if (theme === 'astro-dark') {
        icon.classList.add('fa-moon');
      } else if (theme === 'theme-light') {
        icon.classList.add('fa-sun');
      } else {
        icon.classList.add('fa-bolt');
      }
    };
    updateThemeIcon(currentTheme);
    
    if (themeBtn) {
      themeBtn.onclick = () => {
        let idx = themes.indexOf(currentTheme);
        idx = (idx + 1) % themes.length;
        currentTheme = themes[idx];
        
        document.body.className = '';
        if (currentTheme !== 'astro-dark') {
          document.body.classList.add(currentTheme);
        }
        
        localStorage.setItem('calc_theme', currentTheme);
        updateThemeIcon(currentTheme);

        if (graphing) {
          graphing.draw();
        }
      };
    }

    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(btn => {
      btn.onclick = () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        const targetTab = btn.getAttribute('data-tab');
        const targetEl = document.getElementById(targetTab);
        if (targetEl) targetEl.classList.add('active');
        state.activeTab = targetTab;
        
        if (targetTab === 'graph-tab' && graphing) {
          graphing.resize(); 
        }
      };
    });

    const historyBtn = document.getElementById('toggle-history-btn');
    const closeHistoryBtn = document.getElementById('close-history-btn');
    const historySidebar = document.getElementById('history-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    const toggleHistory = () => {
      if (historySidebar) historySidebar.classList.toggle('active');
      if (overlay) overlay.classList.toggle('active');
    };
    
    if (historyBtn) historyBtn.onclick = toggleHistory;
    if (closeHistoryBtn) closeHistoryBtn.onclick = toggleHistory;
    if (overlay) overlay.onclick = toggleHistory;

    this.renderHistoryList();
    this.renderConstantsList();

    const helpBtn = document.getElementById('btn-help');
    const closeModal = document.getElementById('close-modal');
    const helpModal = document.getElementById('help-modal');

    if (helpBtn && helpModal) {
      helpBtn.onclick = () => helpModal.classList.add('active');
    }
    if (closeModal && helpModal) {
      closeModal.onclick = () => helpModal.classList.remove('active');
    }
    window.onclick = (event) => {
      if (event.target === helpModal) {
        helpModal.classList.remove('active');
      }
    };

    const copyBtn = document.getElementById('copy-result');
    if (copyBtn) {
      copyBtn.onclick = () => {
        const result = document.getElementById('calc-result').innerText;
        navigator.clipboard.writeText(result).then(() => {
          const icon = copyBtn.querySelector('i');
          icon.classList.replace('fa-copy', 'fa-check');
          setTimeout(() => icon.classList.replace('fa-check', 'fa-copy'), 2000);
        });
      };
    }

    const clearHistoryBtn = document.getElementById('btn-clear-history');
    if (clearHistoryBtn) {
      clearHistoryBtn.onclick = () => {
        state.history = [];
        localStorage.setItem('calc_history', '[]');
        this.renderHistoryList();
      };
    }

    const btn2nd = document.getElementById('btn-2nd');
    if (btn2nd) {
      btn2nd.onclick = () => {
        state.is2ndActive = !state.is2ndActive;
        btn2nd.classList.toggle('active', state.is2ndActive);
        
        const standardTrigs = document.querySelectorAll('.keypad-scientific button[data-val="sin"], .keypad-scientific button[data-val="cos"], .keypad-scientific button[data-val="tan"], .keypad-scientific button[data-val="sinh"], .keypad-scientific button[data-val="cosh"], .keypad-scientific button[data-val="tanh"]');
        const invTrigs = document.querySelectorAll('.keypad-scientific button[data-val="asin"], .keypad-scientific button[data-val="acos"], .keypad-scientific button[data-val="atan"], .keypad-scientific button[data-val="asinh"], .keypad-scientific button[data-val="acosh"], .keypad-scientific button[data-val="atanh"]');
        
        if (state.is2ndActive) {
          standardTrigs.forEach(btn => btn.style.display = 'none');
          invTrigs.forEach(btn => btn.style.display = 'flex');
        } else {
          standardTrigs.forEach(btn => btn.style.display = 'flex');
          invTrigs.forEach(btn => btn.style.display = 'none');
        }
      };
    }

    const btnDegRad = document.getElementById('btn-deg-rad');
    const radIndicator = document.getElementById('deg-rad-indicator');
    if (btnDegRad) {
      btnDegRad.onclick = () => {
        state.radMode = !state.radMode;
        if (radIndicator) radIndicator.innerText = state.radMode ? 'RAD' : 'DEG';
        btnDegRad.classList.toggle('active', !state.radMode); 
      };
    }

    const memoryIndicator = document.getElementById('memory-indicator');
    
    const mcBtn = document.getElementById('btn-mc');
    if (mcBtn) {
      mcBtn.onclick = () => {
        state.memoryValue = 0;
        if (memoryIndicator) memoryIndicator.style.display = 'none';
        this.highlightMemButtons();
      };
    }

    const mrBtn = document.getElementById('btn-mr');
    if (mrBtn) {
      mrBtn.onclick = () => {
        this.inputSymbol(Number(state.memoryValue.toFixed(8)).toString());
      };
    }

    const mplusBtn = document.getElementById('btn-mplus');
    if (mplusBtn) {
      mplusBtn.onclick = () => {
        const currentVal = parseFloat(state.result);
        if (!isNaN(currentVal)) {
          state.memoryValue += currentVal;
          if (memoryIndicator) memoryIndicator.style.display = 'block';
          this.highlightMemButtons();
        }
      };
    }

    const mminusBtn = document.getElementById('btn-mminus');
    if (mminusBtn) {
      mminusBtn.onclick = () => {
        const currentVal = parseFloat(state.result);
        if (!isNaN(currentVal)) {
          state.memoryValue -= currentVal;
          if (memoryIndicator) memoryIndicator.style.display = 'block';
          this.highlightMemButtons();
        }
      };
    }

    const msBtn = document.getElementById('btn-ms');
    if (msBtn) {
      msBtn.onclick = () => {
        const currentVal = parseFloat(state.result);
        if (!isNaN(currentVal)) {
          state.memoryValue = currentVal;
          if (memoryIndicator) memoryIndicator.style.display = 'block';
          this.highlightMemButtons();
        }
      };
    }

    const buttons = document.querySelectorAll('.keypad-layout button');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-val');
        const action = btn.getAttribute('data-action');
        
        if (val) {
          this.inputSymbol(val);
        } else if (action === 'clear') {
          this.clearScreen();
        } else if (action === 'backspace') {
          this.backspace();
        }
      });
    });
    
    const equalsBtn = document.getElementById('btn-equals');
    if (equalsBtn) equalsBtn.onclick = () => this.evaluate();
    

    document.addEventListener('keydown', (e) => {
      if (state.activeTab !== 'calc-tab') return;
      
      const key = e.key;
      let virtualBtn = null;
      
      if (key >= '0' && key <= '9') {
        this.inputSymbol(key);
        virtualBtn = document.querySelector(`button[data-val="${key}"]`);
      } else if (key === '.') {
        this.inputSymbol('.');
        virtualBtn = document.querySelector(`button[data-val="."]`);
      } else if (key === '+') {
        this.inputSymbol('+');
        virtualBtn = document.querySelector(`button[data-val="+"]`);
      } else if (key === '-') {
        this.inputSymbol('-');
        virtualBtn = document.querySelector(`button[data-val="-"]`);
      } else if (key === '*') {
        this.inputSymbol('*');
        virtualBtn = document.querySelector(`button[data-val="*"]`);
      } else if (key === '/') {
        e.preventDefault();
        this.inputSymbol('/');
        virtualBtn = document.querySelector(`button[data-val="/"]`);
      } else if (key === '%') {
        this.inputSymbol('%');
        virtualBtn = document.querySelector(`button[data-val="%"]`);
      } else if (key === '^') {
        this.inputSymbol('^');
        virtualBtn = document.querySelector(`button[data-val="^"]`);
      } else if (key === '!') {
        this.inputSymbol('!');
        virtualBtn = document.querySelector(`button[data-val="!"]`);
      } else if (key === '(') {
        this.inputSymbol('(');
        virtualBtn = document.querySelector(`button[data-val="("]`);
      } else if (key === ')') {
        this.inputSymbol(')');
        virtualBtn = document.querySelector(`button[data-val=")"]`);
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        this.evaluate();
        virtualBtn = document.getElementById('btn-equals');
      } else if (key === 'Backspace') {
        this.backspace();
        virtualBtn = document.querySelector('button[data-action="backspace"]');
      } else if (key === 'Escape' || key === 'Delete') {
        this.clearScreen();
        virtualBtn = document.querySelector('button[data-action="clear"]');
      } else if (key.toLowerCase() === 'h') {
        const historySidebar = document.getElementById('history-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (historySidebar && overlay) {
          historySidebar.classList.toggle('active');
          overlay.classList.toggle('active');
        }
      } else if (key === '?') {
        if (helpModal) helpModal.classList.add('active');
      }
      
      if (virtualBtn) {
        virtualBtn.classList.add('key-press-active');
        setTimeout(() => {
          virtualBtn.classList.remove('key-press-active');
        }, 100);
      }
    });
  },
  
  renderConstantsList() {
    const list = document.getElementById('constants-list');
    if (!list) return;

    const names = {
      'π': 'Pi',
      'e': 'Euler\'s Number',
      'G': 'Gravitational Const',
      'c': 'Speed of Light',
      'h': 'Planck Constant',
      'k': 'Boltzmann Const',
      'NA': 'Avogadro Number',
      'R': 'Gas Constant',
      'σ': 'Stefan-Boltzmann',
      'me': 'Electron Mass',
      'mp': 'Proton Mass',
    };

    let html = '';
    for (const [sym, val] of Object.entries(CONSTANTS)) {
      html += `
        <div class="constant-item" data-sym="${sym}">
          <span class="const-sym">${sym}</span>
          <span class="const-name">${names[sym] || sym}</span>
        </div>
      `;
    }
    list.innerHTML = html;

    list.querySelectorAll('.constant-item').forEach(item => {
      item.onclick = () => {
        const sym = item.getAttribute('data-sym');
        this.inputSymbol(sym);
      };
    });
  },

  inputSymbol(sym) {
    const exprLine = document.getElementById('calc-expression');
    if (!exprLine) return;

    let insertVal = sym;
    if (FUNCTIONS.has(sym)) {
      insertVal = sym + '(';
    } else if (sym === 'pi') {
      insertVal = 'π';
    } else if (sym === 'ans') {
      insertVal = 'Ans';
    } else if (sym === 'sqrt') {
      insertVal = 'sqrt(';
    } else if (sym === 'cbrt') {
      insertVal = 'cbrt(';
    } else if (sym === 'abs') {
      insertVal = 'abs(';
    } else if (sym === 'exp') {
      insertVal = 'exp(';
    } else if (sym === '*') {
      insertVal = '×';
    } else if (sym === '/') {
      insertVal = '÷';
    } else if (sym === '-') {
      insertVal = '−';
    } else if (sym === '^2') {
      insertVal = '^2';
    }
    
    state.expression += insertVal;
    exprLine.innerText = state.expression;
    exprLine.scrollLeft = exprLine.scrollWidth; 
  },
  
  clearScreen() {
    state.expression = '';
    state.result = '0';
    const exprLine = document.getElementById('calc-expression');
    if (exprLine) exprLine.innerText = '';
    const resultElement = document.getElementById('calc-result');
    if (resultElement) {
      resultElement.innerText = '0';
      resultElement.classList.remove('error');
    }
  },
  
  backspace() {
    const exprLine = document.getElementById('calc-expression');
    if (!exprLine) return;
    state.expression = smartBackspace(state.expression);
    exprLine.innerText = state.expression;
  },
  
  evaluate() {
    const resultElement = document.getElementById('calc-result');
    if (!resultElement) return;
    if (!state.expression.trim()) return;
    
    try {
      const parsedTokens = tokenize(state.expression);
      const readyTokens = injectImplicitMultiplication(parsedTokens);
      
      const computed = parseAndEvaluate(readyTokens, state.radMode, state.lastAns);
      
      if (isNaN(computed) || !isFinite(computed)) {
        throw new Error("Invalid output");
      }
      
      let formattedResult = computed;
      if (!Number.isInteger(computed)) {
        formattedResult = Number(computed.toFixed(10));
      }
      
      resultElement.classList.remove('error');
      resultElement.innerText = formattedResult;
      
      this.pushHistory(state.expression, formattedResult);
      state.lastAns = computed;
      state.result = String(formattedResult);
    } catch (err) {
      resultElement.classList.add('error');
      resultElement.innerText = err.message;
    }
  },
  
  pushHistory(expr, res) {
    if (state.history.length > 0 && state.history[0].expr === expr) {
      return;
    }
    
    state.history.unshift({ expr, res });
    
    if (state.history.length > 30) {
      state.history.pop();
    }
    
    localStorage.setItem('calc_history', JSON.stringify(state.history));
    this.renderHistoryList();
  },
  
  renderHistoryList() {
    const list = document.getElementById('history-list');
    if (!list) return;

    if (state.history.length === 0) {
      list.innerHTML = `<div class="empty-history-msg">No calculation history yet.</div>`;
      return;
    }
    
    let html = '';
    state.history.forEach((item, index) => {
      html += `
        <div class="history-item" data-index="${index}">
          <div class="history-expr">${item.expr}</div>
          <div class="history-res">${item.res}</div>
        </div>
      `;
    });
    
    list.innerHTML = html;
    
    const items = list.querySelectorAll('.history-item');
    items.forEach(el => {
      el.onclick = () => {
        const idx = el.getAttribute('data-index');
        const histItem = state.history[idx];
        state.expression = histItem.expr;
        const exprLine = document.getElementById('calc-expression');
        const resLine = document.getElementById('calc-result');
        if (exprLine) exprLine.innerText = state.expression;
        if (resLine) {
          resLine.innerText = histItem.res;
          resLine.classList.remove('error');
        }
        
        const historySidebar = document.getElementById('history-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (historySidebar) historySidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
      };
    });
  },
  
  highlightMemButtons() {
    const msBtn = document.getElementById('btn-ms');
    const mrBtn = document.getElementById('btn-mr');
    const mcBtn = document.getElementById('btn-mc');
    
    const hasValue = state.memoryValue !== 0;
    
    if (msBtn) msBtn.classList.toggle('active', hasValue);
    if (mrBtn) mrBtn.classList.toggle('active', hasValue);
    if (mcBtn) mcBtn.classList.toggle('active', hasValue);
  }
};
