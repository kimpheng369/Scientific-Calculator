import { tokenize, injectImplicitMultiplication, parseAndEvaluate } from './math-parser.js';

export const graphing = {
  canvas: null,
  ctx: null,
  zoom: 45,    
  offsetX: 0,   
  offsetY: 0,     
  isDragging: false,
  startX: 0,
  startY: 0,
  
  init() {
    this.canvas = document.getElementById('graph-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.startX = e.clientX - this.offsetX;
      this.startY = e.clientY - this.offsetY;
      this.canvas.style.cursor = 'grabbing';
    });
    
    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
      }
    });
    
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      
      if (this.isDragging) {
        this.offsetX = e.clientX - this.startX;
        this.offsetY = e.clientY - this.startY;
        this.draw();
      }

      const originX = this.canvas.width / 2 + this.offsetX;
      const originY = this.canvas.height / 2 + this.offsetY;
      const mx = (px - originX) / this.zoom;
      const my = (originY - py) / this.zoom;
      
      const coordsEl = document.getElementById('graph-coords');
      if (coordsEl) {
        coordsEl.innerText = `X: ${mx.toFixed(2)} | Y: ${my.toFixed(2)}`;
      }
    });
    
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const originX = this.canvas.width / 2 + this.offsetX;
      const originY = this.canvas.height / 2 + this.offsetY;
      const mx = (mouseX - originX) / this.zoom;
      const my = (originY - mouseY) / this.zoom;
      
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
      this.zoom = Math.max(5, Math.min(1000, this.zoom * zoomFactor));
      
      this.offsetX = mouseX - this.canvas.width / 2 - mx * this.zoom;
      this.offsetY = originY - my * this.zoom - this.canvas.height / 2;
      
      this.draw();
    }, { passive: false });

    document.getElementById('btn-zoom-in').onclick = () => {
      this.zoom = Math.min(1000, this.zoom * 1.25);
      this.draw();
    };
    document.getElementById('btn-zoom-out').onclick = () => {
      this.zoom = Math.max(5, this.zoom / 1.25);
      this.draw();
    };
    document.getElementById('btn-zoom-reset').onclick = () => {
      this.zoom = 45;
      this.offsetX = 0;
      this.offsetY = 0;
      this.draw();
    };
    document.getElementById('btn-pan-left').onclick = () => { this.offsetX += 50; this.draw(); };
    document.getElementById('btn-pan-right').onclick = () => { this.offsetX -= 50; this.draw(); };
    document.getElementById('btn-pan-up').onclick = () => { this.offsetY += 50; this.draw(); };
    document.getElementById('btn-pan-down').onclick = () => { this.offsetY -= 50; this.draw(); };
    
    document.getElementById('btn-plot').onclick = () => this.draw();
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },
  
  resize() {
    if (!this.canvas) return;
    const container = this.canvas.parentElement;
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    this.draw();
  },
  
  draw() {
    if (!this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;
    
    const style = getComputedStyle(document.body);
    const canvasBg = style.getPropertyValue('--bg-inset').trim() || '#090b10';
    ctx.fillStyle = canvasBg;
    ctx.fillRect(0, 0, w, h);
    
    const originX = w / 2 + this.offsetX;
    const originY = h / 2 + this.offsetY;
    
    this.drawGrid(w, h, originX, originY);
    
    const eqInputs = [
      { id: 'eq-input-0', color: '#00f2fe' },
      { id: 'eq-input-1', color: '#ff007f' },
      { id: 'eq-input-2', color: '#00e676' }
    ];
    
    eqInputs.forEach(eq => {
      const inputEl = document.getElementById(eq.id);
      if (!inputEl) return;
      const expr = inputEl.value.trim();
      if (!expr) return;
      
      try {
        const rawTokens = tokenize(expr);
        const tokens = injectImplicitMultiplication(rawTokens);
        
        ctx.beginPath();
        ctx.strokeStyle = eq.color;
        ctx.lineWidth = 2.5;
        
        let pathStarted = false;
        
        for (let px = 0; px < w; px++) {
          const mx = (px - originX) / this.zoom;
          
          try {
            const my = parseAndEvaluate(tokens, true, 0, { x: mx });
            
            if (typeof my === 'number' && !isNaN(my) && isFinite(my)) {
              const py = originY - my * this.zoom;
              
              if (py < -h || py > h * 2) {
                pathStarted = false;
                continue;
              }
              
              if (!pathStarted) {
                ctx.moveTo(px, py);
                pathStarted = true;
              } else {
                ctx.lineTo(px, py);
              }
            } else {
              pathStarted = false;
            }
          } catch (err) {
            pathStarted = false;
          }
        }
        ctx.stroke();
      } catch (err) {
        console.warn(`Graph syntax error in "${expr}":`, err.message);
      }
    });
  },
  
  drawGrid(w, h, originX, originY) {
    const ctx = this.ctx;
    
    let stepMath = 1;
    if (this.zoom < 10) stepMath = 10;
    else if (this.zoom < 25) stepMath = 5;
    else if (this.zoom < 60) stepMath = 1;
    else if (this.zoom < 150) stepMath = 0.5;
    else if (this.zoom < 400) stepMath = 0.2;
    else stepMath = 0.1;
    
    const stepPx = stepMath * this.zoom;
    
    const style = getComputedStyle(document.body);
    const border = style.getPropertyValue('--border').trim() || 'rgba(255, 255, 255, 0.05)';
    const borderStrong = style.getPropertyValue('--border-strong').trim() || 'rgba(255, 255, 255, 0.2)';
    const textDim = style.getPropertyValue('--text-dim').trim() || '#64748b';

    ctx.lineWidth = 1;
    ctx.strokeStyle = border;
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.fillStyle = textDim;
    
    for (let x = originX - stepPx; x > 0; x -= stepPx) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
      
      const val = ((x - originX) / this.zoom);
      ctx.fillText(Number(val.toFixed(2)), x + 4, originY > 0 && originY < h ? originY - 6 : h - 10);
    }
    for (let x = originX; x < w; x += stepPx) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
      
      const val = ((x - originX) / this.zoom);
      if (val !== 0) {
        ctx.fillText(Number(val.toFixed(2)), x + 4, originY > 0 && originY < h ? originY - 6 : h - 10);
      }
    }
    
    for (let y = originY - stepPx; y > 0; y -= stepPx) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      
      const val = ((originY - y) / this.zoom);
      ctx.fillText(Number(val.toFixed(2)), originX > 0 && originX < w ? originX + 6 : 10, y - 4);
    }
    for (let y = originY; y < h; y += stepPx) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      
      const val = ((originY - y) / this.zoom);
      if (val !== 0) {
        ctx.fillText(Number(val.toFixed(2)), originX > 0 && originX < w ? originX + 6 : 10, y - 4);
      }
    }
    
    ctx.strokeStyle = borderStrong;
    ctx.lineWidth = 2;
    
    if (originY >= 0 && originY <= h) {
      ctx.beginPath();
      ctx.moveTo(0, originY);
      ctx.lineTo(w, originY);
      ctx.stroke();
    }
    
    if (originX >= 0 && originX <= w) {
      ctx.beginPath();
      ctx.moveTo(originX, 0);
      ctx.lineTo(originX, h);
      ctx.stroke();
    }
    
    if (originX >= 0 && originX <= w && originY >= 0 && originY <= h) {
      ctx.fillText('0', originX - 12, originY + 14);
    }
  }
};
