export const converter = {
  activeCategory: 'length',
  
  metrics: {
    length: {
      units: {
        m: { label: 'Meter (m)', factor: 1 },
        km: { label: 'Kilometer (km)', factor: 1000 },
        cm: { label: 'Centimeter (cm)', factor: 0.01 },
        mm: { label: 'Millimeter (mm)', factor: 0.001 },
        mi: { label: 'Mile (mi)', factor: 1609.344 },
        yd: { label: 'Yard (yd)', factor: 0.9144 },
        ft: { label: 'Foot (ft)', factor: 0.3048 },
        in: { label: 'Inch (in)', factor: 0.0254 }
      },
      defaultFrom: 'm',
      defaultTo: 'ft'
    },
    weight: {
      units: {
        kg: { label: 'Kilogram (kg)', factor: 1 },
        g: { label: 'Gram (g)', factor: 0.001 },
        mg: { label: 'Milligram (mg)', factor: 0.000001 },
        lb: { label: 'Pound (lb)', factor: 0.45359237 },
        oz: { label: 'Ounce (oz)', factor: 0.028349523 },
        st: { label: 'Stone (st)', factor: 6.35029318 }
      },
      defaultFrom: 'kg',
      defaultTo: 'lb'
    },
    temperature: {
      units: {
        C: { label: 'Celsius (°C)' },
        F: { label: 'Fahrenheit (°F)' },
        K: { label: 'Kelvin (K)' }
      },
      defaultFrom: 'C',
      defaultTo: 'F'
    },
    area: {
      units: {
        m2: { label: 'Square Meter (m²)', factor: 1 },
        km2: { label: 'Square Kilometer (km²)', factor: 1000000 },
        cm2: { label: 'Square Centimeter (cm²)', factor: 0.0001 },
        mi2: { label: 'Square Mile (mi²)', factor: 2589988.11 },
        ac: { label: 'Acre (ac)', factor: 4046.85642 },
        ha: { label: 'Hectare (ha)', factor: 10000 }
      },
      defaultFrom: 'm2',
      defaultTo: 'ac'
    },
    volume: {
      units: {
        l: { label: 'Liter (L)', factor: 1 },
        ml: { label: 'Milliliter (mL)', factor: 0.001 },
        m3: { label: 'Cubic Meter (m³)', factor: 1000 },
        gal: { label: 'Gallon (US)', factor: 3.78541 },
        qt: { label: 'Quart (US)', factor: 0.946353 },
        pt: { label: 'Pint (US)', factor: 0.473176 },
        cup: { label: 'Cup (US)', factor: 0.236588 },
        floz: { label: 'Fluid Ounce (US)', factor: 0.0295735 }
      },
      defaultFrom: 'l',
      defaultTo: 'gal'
    },
    speed: {
      units: {
        ms: { label: 'm/s', factor: 1 },
        kmh: { label: 'km/h', factor: 1/3.6 },
        mph: { label: 'mph', factor: 0.44704 },
        kn: { label: 'knot', factor: 0.514444 }
      },
      defaultFrom: 'kmh',
      defaultTo: 'mph'
    },
    time: {
      units: {
        s: { label: 'Second (s)', factor: 1 },
        ms: { label: 'Millisecond (ms)', factor: 0.001 },
        min: { label: 'Minute (min)', factor: 60 },
        h: { label: 'Hour (h)', factor: 3600 },
        d: { label: 'Day (d)', factor: 86400 },
        wk: { label: 'Week (wk)', factor: 604800 }
      },
      defaultFrom: 'min',
      defaultTo: 'h'
    },
    data: {
      units: {
        b: { label: 'Byte (B)', factor: 1 },
        kb: { label: 'Kilobyte (KB)', factor: 1024 },
        mb: { label: 'Megabyte (MB)', factor: 1024**2 },
        gb: { label: 'Gigabyte (GB)', factor: 1024**3 },
        tb: { label: 'Terabyte (TB)', factor: 1024**4 }
      },
      defaultFrom: 'mb',
      defaultTo: 'gb'
    }
  },
  
  init() {
    const catButtons = document.querySelectorAll('.cat-btn');
    catButtons.forEach(btn => {
      btn.onclick = () => {
        catButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeCategory = btn.getAttribute('data-category');
        this.populateUnits();
      };
    });
    
    const fromVal = document.getElementById('convert-from-val');
    const toVal = document.getElementById('convert-to-val');
    const fromUnit = document.getElementById('convert-from-unit');
    const toUnit = document.getElementById('convert-to-unit');
    const swapBtn = document.getElementById('btn-swap-units');
    
    if (fromVal) fromVal.oninput = () => this.sync('from');
    if (toVal) toVal.oninput = () => this.sync('to');
    if (fromUnit) fromUnit.onchange = () => this.sync('from');
    if (toUnit) toUnit.onchange = () => this.sync('from');
    
    if (swapBtn) {
      swapBtn.onclick = () => {
        const tempUnit = fromUnit.value;
        fromUnit.value = toUnit.value;
        toUnit.value = tempUnit;
        
        const tempVal = fromVal.value;
        fromVal.value = toVal.value;
        toVal.value = tempVal;
        
        this.sync('from');
      };
    }
    
    this.populateUnits();
  },
  
  populateUnits() {
    const data = this.metrics[this.activeCategory];
    const fromUnit = document.getElementById('convert-from-unit');
    const toUnit = document.getElementById('convert-to-unit');
    
    if (!fromUnit || !toUnit) return;

    let html = '';
    for (const key in data.units) {
      html += `<option value="${key}">${data.units[key].label}</option>`;
    }
    
    fromUnit.innerHTML = html;
    toUnit.innerHTML = html;
    
    fromUnit.value = data.defaultFrom;
    toUnit.value = data.defaultTo;
    
    this.sync('from');
  },
  
  sync(direction) {
    const fromVal = document.getElementById('convert-from-val');
    const toVal = document.getElementById('convert-to-val');
    const fromUnitElement = document.getElementById('convert-from-unit');
    const toUnitElement = document.getElementById('convert-to-unit');
    
    if (!fromVal || !toVal || !fromUnitElement || !toUnitElement) return;

    const fromUnit = fromUnitElement.value;
    const toUnit = toUnitElement.value;
    
    let sourceVal = parseFloat(direction === 'from' ? fromVal.value : toVal.value);
    
    if (isNaN(sourceVal)) {
      if (direction === 'from') toVal.value = '';
      else fromVal.value = '';
      return;
    }
    
    let result;
    
    if (this.activeCategory === 'temperature') {
      result = this.convertTemperature(sourceVal, direction === 'from' ? fromUnit : toUnit, direction === 'from' ? toUnit : fromUnit);
    } else {
      const unitsMap = this.metrics[this.activeCategory].units;
      const fromFactor = unitsMap[direction === 'from' ? fromUnit : toUnit].factor;
      const toFactor = unitsMap[direction === 'from' ? toUnit : fromUnit].factor;
      
      const baseVal = sourceVal * fromFactor;
      result = baseVal / toFactor;
    }
    
    const formattedResult = Number(result.toFixed(6));
    
    if (direction === 'from') {
      toVal.value = formattedResult;
    } else {
      fromVal.value = formattedResult;
    }
  },
  
  convertTemperature(val, from, to) {
    if (from === to) return val;
    let celsius;
    
    if (from === 'C') celsius = val;
    else if (from === 'F') celsius = (val - 32) * 5/9;
    else if (from === 'K') celsius = val - 273.15;
    
    if (to === 'C') return celsius;
    else if (to === 'F') return celsius * 9/5 + 32;
    else if (to === 'K') return celsius + 273.15;
    
    return val;
  }
};
