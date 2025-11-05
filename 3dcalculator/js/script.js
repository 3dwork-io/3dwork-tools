// Make key functions available globally
window.initApp = function() {
    // Initialize DOM references
    let form, materialsContainer, addMaterialBtn, resetBtn, calculateBtn, languageToggle, unitToggle, printerSelect, printerPowerInput, printTimeInput, quantityInput, failureRateInput, electricityCostInput, laborRateInput, laborHoursInput, packagingCostInput, shippingCostInput, exportPdfBtn;

    // Initialize DOM references
    form = document.getElementById('calculator-form');
    materialsContainer = document.getElementById('materials-container');
    addMaterialBtn = document.getElementById('add-material');
    resetBtn = document.getElementById('reset-btn');
    calculateBtn = document.getElementById('calculate-btn');
    languageToggle = document.getElementById('language-toggle');
    unitToggle = document.getElementById('unit-toggle');
    printerSelect = document.getElementById('printer-select');
    printerPowerInput = document.getElementById('printer-power');
    printTimeInput = document.getElementById('print-time');
    quantityInput = document.getElementById('quantity');
    failureRateInput = document.getElementById('failure-rate');
    electricityCostInput = document.getElementById('electricity-cost');
    laborRateInput = document.getElementById('labor-rate');
    laborHoursInput = document.getElementById('labor-hours');
    packagingCostInput = document.getElementById('packaging-cost');
    shippingCostInput = document.getElementById('shipping-cost');
    exportPdfBtn = document.getElementById('export-pdf');

    // Initialize event listeners
    setupEventListeners();
    
    // Set default values
    if (printerSelect && !printerSelect.value) {
        printerSelect.value = 'fdm_generic';
    }
    
    // Initial update and calculation
    updatePrinterDetails();
    calculateCosts();
};

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// DOM Elements
const form = document.getElementById('calculator-form');
const materialsContainer = document.getElementById('materials-container');
const addMaterialBtn = document.getElementById('add-material');
const calculateBtn = document.getElementById('calculate-btn');
const resetBtn = document.getElementById('reset-btn');
const exportPdfBtn = document.getElementById('export-pdf');
const languageToggle = document.getElementById('language-toggle');
const unitToggle = document.getElementById('unit-toggle');
const printerSelect = document.getElementById('printer-select');
const printerPowerInput = document.getElementById('printer-power');
const printTimeInput = document.getElementById('print-time');
const quantityInput = document.getElementById('quantity');
const failureRateInput = document.getElementById('failure-rate');
const electricityCostInput = document.getElementById('electricity-cost');
const laborCostInput = document.getElementById('labor-cost');
const laborRateInput = document.getElementById('labor-rate');
const laborHoursInput = document.getElementById('labor-hours');
const packagingCostInput = document.getElementById('packaging-cost');
const shippingCostInput = document.getElementById('shipping-cost');
const materialCostEl = document.getElementById('material-cost');
const electricityCostEl = document.getElementById('electricity-cost');
const electricityCostResultEl = document.getElementById('electricity-cost-result');
const laborCostEl = document.getElementById('labor-cost');
const laborCostResultEl = document.getElementById('labor-cost-result');
const packagingCostResultEl = document.getElementById('packaging-cost-result');
const shippingCostResultEl = document.getElementById('shipping-cost-result');
const totalCostEl = document.getElementById('total-cost');

// Setup all event listeners
function setupEventListeners() {
    // Add material button
    if (addMaterialBtn) {
        addMaterialBtn.addEventListener('click', addMaterialRow);
    }
    
    // Reset button
    if (resetBtn) {
        resetBtn.addEventListener('click', resetForm);
    }
    
    // Printer select
    if (printerSelect) {
        printerSelect.addEventListener('change', updatePrinterDetails);
    }
    
    // Form inputs that trigger cost calculation
    const costInputs = [
        printTimeInput, quantityInput, failureRateInput,
        electricityCostInput, laborRateInput, laborHoursInput,
        packagingCostInput, document.getElementById('shipping-cost')
    ];
    
    costInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', calculateCosts);
        }
    });
    
    // Calculation type selects
    const calculationTypeSelects = [
        document.getElementById('labor-calculation-type'),
        document.getElementById('packaging-calculation-type'),
        document.getElementById('shipping-calculation-type')
    ];
    
    calculationTypeSelects.forEach(select => {
        if (select) {
            select.addEventListener('change', calculateCosts);
        }
    });
    
    // Pricing options
    document.querySelectorAll('input[name="pricingOption"]').forEach(radio => {
        radio.addEventListener('change', updateTotalCost);
    });
    
    // Custom margin input
    const customMarginInput = document.getElementById('custom-margin');
    if (customMarginInput) {
        customMarginInput.addEventListener('input', updateTotalCost);
    }
    
    // Language toggle
    if (languageToggle) {
        languageToggle.addEventListener('change', toggleLanguage);
    }
    
    // Unit toggle
    if (unitToggle) {
        unitToggle.addEventListener('change', toggleUnits);
    }
    
    // Export PDF
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', exportToPdf);
    }
}

// Calculation type selects
const packagingCalculationType = document.getElementById('packaging-calculation-type');
const shippingCalculationType = document.getElementById('shipping-calculation-type');
const laborCalculationType = document.getElementById('labor-calculation-type');

// State
let currencySymbol = '€';
let isMetric = true;
let currentLang = 'en';
let costAllocationChart = null;

// Printer database with power consumption in watts
const printers = {
    // FDM Printers
    'fdm_generic': { name: 'FDM Generic Custom', power: 250, type: 'fdm' },
    'bambu_x1': { name: 'Bambu Lab X1 Carbon', power: 350, type: 'fdm' },
    'bambu_p1p': { name: 'Bambu Lab P1P', power: 300, type: 'fdm' },
    'prusa_mk4': { name: 'Prusa i3 MK4', power: 200, type: 'fdm' },
    'prusa_mk3s': { name: 'Prusa i3 MK3S+', power: 180, type: 'fdm' },
    'ender3_v3': { name: 'Creality Ender-3 V3 SE', power: 220, type: 'fdm' },
    'ender3': { name: 'Creality Ender-3 V2', power: 200, type: 'fdm' },
    'ender3_s1': { name: 'Creality Ender-3 S1', power: 210, type: 'fdm' },
    'sovol_sv06': { name: 'Sovol SV06', power: 280, type: 'fdm' },
    'elegoo_neptune4': { name: 'Elegoo Neptune 4 Pro', power: 250, type: 'fdm' },
    'anycubic_kobra2': { name: 'Anycubic Kobra 2', power: 230, type: 'fdm' },
    
    // Resin Printers
    'sla_generic': { name: 'SLA Generic Custom', power: 80, type: 'resin' },
    'elegoo_mars4': { name: 'Elegoo Mars 4 Ultra', power: 80, type: 'resin' },
    'elegoo_mars3': { name: 'Elegoo Mars 3', power: 60, type: 'resin' },
    'elegoo_saturn3': { name: 'Elegoo Saturn 3 Ultra', power: 90, type: 'resin' },
    'anycubic_photon_m3': { name: 'Anycubic Photon M3 Max', power: 85, type: 'resin' },
    'anycubic_photon_m3_plus': { name: 'Anycubic Photon M3 Plus', power: 75, type: 'resin' },
    'photon_mono_x': { name: 'Anycubic Photon Mono X', power: 75, type: 'resin' },
    'formlabs_form3': { name: 'Formlabs Form 3+', power: 100, type: 'resin' },
    'phrozen_sonic_mighty8k': { name: 'Phrozen Sonic Mighty 8K', power: 95, type: 'resin' },
    'creality_halot_one': { name: 'Creality Halot-One Pro', power: 70, type: 'resin' },
    'creality_ld006': { name: 'Creality LD-006', power: 80, type: 'resin' }
};

// Default color palette for materials
const materialColors = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
    '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
    '#795548', '#9E9E9E', '#607D8B', '#000000', '#FFFFFF'
];

// Default colors for material types
const defaultMaterialColors = {
    'pla': '#4CAF50',
    'petg': '#2196F3',
    'abs': '#F44336',
    'tpu': '#9C27B0',
    'pc': '#607D8B',
    'resin': '#FFC107',
    'default': '#9E9E9E'
};

// Material database with cost per kg or liter and default colors
const materials = {
    // Generic FDM Materials
    pla: { name: 'PLA (Generic)', cost: 20, type: 'fdm', color: defaultMaterialColors.pla },
    petg: { name: 'PETG (Generic)', cost: 25, type: 'fdm', color: defaultMaterialColors.petg },
    abs: { name: 'ABS (Generic)', cost: 30, type: 'fdm', color: defaultMaterialColors.abs },
    tpu: { name: 'TPU (Generic)', cost: 40, type: 'fdm', color: defaultMaterialColors.tpu },
    
    // Rosa3D FDM Filaments
    rosa_pla: { name: 'Rosa3D PLA', cost: 25, type: 'fdm', color: '#4CAF50' },
    rosa_pla_plus: { name: 'Rosa3D PLA+', cost: 28, type: 'fdm', color: '#8BC34A' },
    rosa_petg: { name: 'Rosa3D PETG', cost: 30, type: 'fdm', color: '#2196F3' },
    rosa_abs: { name: 'Rosa3D ABS', cost: 35, type: 'fdm', color: '#F44336' },
    rosa_tpu: { name: 'Rosa3D TPU', cost: 45, type: 'fdm', color: '#9C27B0' },
    
    // Spectrum Filaments
    spectrum_pla: { name: 'Spectrum PLA', cost: 28, type: 'fdm', color: '#4CAF50' },
    spectrum_petg: { name: 'Spectrum PETG', cost: 32, type: 'fdm', color: '#2196F3' },
    spectrum_abs: { name: 'Spectrum ABS', cost: 38, type: 'fdm', color: '#F44336' },
    spectrum_tpu: { name: 'Spectrum TPU', cost: 48, type: 'fdm', color: '#9C27B0' },
    spectrum_pc: { name: 'Spectrum PC', cost: 55, type: 'fdm', color: '#607D8B' },
    
    // Generic Resins
    standard_resin: { name: 'Standard Resin (Generic)', cost: 40, type: 'resin', color: '#FFC107' },
    abs_like_resin: { name: 'ABS-like Resin (Generic)', cost: 50, type: 'resin', color: '#FF9800' },
    flexible_resin: { name: 'Flexible Resin (Generic)', cost: 60, type: 'resin', color: '#FF5722' },
    tough_resin: { name: 'Tough Resin (Generic)', cost: 70, type: 'resin', color: '#795548' },
    water_washable: { name: 'Water Washable Resin (Generic)', cost: 55, type: 'resin', color: '#00BCD4' },
    
    // Anycubic Resins
    anycubic_standard: { name: 'Anycubic Standard Resin', cost: 35, type: 'resin', color: '#FFC107' },
    anycubic_eco: { name: 'Anycubic Eco Resin', cost: 38, type: 'resin', color: '#8BC34A' },
    anycubic_abs_like: { name: 'Anycubic ABS-Like', cost: 45, type: 'resin', color: '#FF9800' },
    anycubic_tough: { name: 'Anycubic Tough Resin', cost: 60, type: 'resin', color: '#795548' },
    anycubic_water_wash: { name: 'Anycubic Water Washable', cost: 42, type: 'resin', color: '#00BCD4' },
    
    // Elegoo Resins
    elegoo_standard: { name: 'Elegoo Standard Resin', cost: 32, type: 'resin', color: '#FFC107' },
    elegoo_abs_like: { name: 'Elegoo ABS-Like', cost: 42, type: 'resin', color: '#FF9800' },
    elegoo_water_wash: { name: 'Elegoo Water Washable', cost: 40, type: 'resin', color: '#00BCD4' },
    elegoo_plant_based: { name: 'Elegoo Plant-Based', cost: 45, type: 'resin', color: '#8BC34A' },
    elegoo_durable: { name: 'Elegoo Durable Resin', cost: 58, type: 'resin' },
    
    // Specialty Resins
    siraya_tech_tenacious: { name: 'Siraya Tech Tenacious', cost: 75, type: 'resin' },
    siraya_tech_blue: { name: 'Siraya Tech Blu', cost: 65, type: 'resin' },
    phrozen_abs_like: { name: 'Phrozen ABS-Like', cost: 55, type: 'resin' },
    phrozen_water_wash: { name: 'Phrozen Water Washable', cost: 48, type: 'resin' }
};

// Reset form to default values
function resetForm() {
    // Reset form inputs
    form.reset();
    
    // Clear materials container and add one default material row
    materialsContainer.innerHTML = '';
    addMaterialRow();
    
    // Reset other form fields to default values
    printerSelect.value = 'bambu_x1';
    const powerInput = document.getElementById('printer-power');
    if (powerInput) powerInput.value = printers['bambu_x1'].power;
    
    // Trigger calculation
    calculateCosts();
}

// Initialize the application
function init() {
    console.log('Initializing application...');
    
    // Set up event listeners
    const addMaterialBtn = document.getElementById('add-material');
    if (addMaterialBtn) {
        addMaterialBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Add the same type as the last material, or default to PLA
            const lastMaterial = document.querySelector('.material-row:last-child .material-type');
            const materialType = lastMaterial ? lastMaterial.value : 'PLA';
            addMaterialRow(materialType);
        });
    }
    
    // Printer select is already initialized at the top
    if (printerSelect && !printerSelect.value) {
        printerSelect.value = 'fdm_generic';
        updatePrinterDetails();
    }
    
    // Set up input listeners for cost calculation
    const form = document.getElementById('calculator-form');
    if (form) {
        form.addEventListener('input', (e) => {
            if (e.target.id !== 'add-material') {
                calculateCosts();
            }
        });
    }
    
    // Initialize the cost allocation chart
    updateCostAllocationChart(0, 0, 0);
    
    // Function to handle pricing changes
    const handlePricingChange = () => {
        console.log('Pricing option changed, updating costs and chart');
        // Get current costs from the DOM or calculate them
        const materialCost = parseFloat(document.getElementById('material-cost')?.textContent?.replace(/[^0-9.,]+/g, '').replace(',', '.') || 0);
        const electricityCost = parseFloat(document.getElementById('electricity-cost-result')?.textContent?.replace(/[^0-9.,]+/g, '').replace(',', '.') || 0);
        const laborCost = parseFloat(document.getElementById('labor-cost-result')?.textContent?.replace(/[^0-9.,]+/g, '').replace(',', '.') || 0);
        
        // Update the total cost display
        updateTotalCost();
        
        // Update the chart with current costs
        updateCostAllocationChart(materialCost, electricityCost, laborCost);
    };
    
    // Add event listeners for pricing option changes
    document.querySelectorAll('input[name="pricingOption"]').forEach(radio => {
        radio.addEventListener('change', handlePricingChange);
    });
    
    // Add event listener for custom margin input
    const customMarginInput = document.getElementById('custom-margin');
    if (customMarginInput) {
        customMarginInput.addEventListener('input', () => {
            const customRadio = document.getElementById('pricing-custom');
            if (customRadio && customRadio.checked) {
                console.log('Custom margin changed, updating costs and chart');
                handlePricingChange();
            }
        });
    }
    
    // Set default printer if not already set
    if (printerSelect && !printerSelect.value) {
        printerSelect.value = 'fdm_generic';
        updatePrinterDetails();
    }
    
    // Initialize calculations after a small delay to ensure DOM is ready
    setTimeout(() => {
        calculateCosts();
    }, 100);
}

// Add a new material row with default values
function addMaterialRow(materialType = 'PLA') {
    const materialsContainer = document.getElementById('materials-container');
    if (!materialsContainer) {
        console.error('Materials container not found');
        return;
    }
    
    const materialCount = document.querySelectorAll('.material-row').length;
    
    // If this is the first material and we already have materials, don't add another
    if (materialCount === 0 && document.querySelectorAll('.material-row').length > 0) {
        return;
    }
    
    // Default material values
    const defaults = {
        'PLA': { cost: 20.00, color: '#808080', density: 1.24 },
        'ABS': { cost: 25.00, color: '#404040', density: 1.04 },
        'PETG': { cost: 30.00, color: '#00aaff', density: 1.27 },
        'TPU': { cost: 40.00, color: '#ff7700', density: 1.21 },
        'Resin': { cost: 50.00, color: '#a0a0a0', density: 1.12 }
    };
    
    const defaultMat = defaults[materialType] || defaults['PLA'];
    
    const materialRow = document.createElement('div');
    materialRow.className = 'material-row mb-3 p-2 border rounded';
    materialRow.innerHTML = `
        <div class="row g-2 align-items-end">
            <div class="col-md-3">
                <label class="form-label small mb-1">Material</label>
                <select class="form-select form-select-sm material-type">
                    <option value="PLA" ${materialType === 'PLA' ? 'selected' : ''}>PLA</option>
                    <option value="ABS" ${materialType === 'ABS' ? 'selected' : ''}>ABS</option>
                    <option value="PETG" ${materialType === 'PETG' ? 'selected' : ''}>PETG</option>
                    <option value="TPU" ${materialType === 'TPU' ? 'selected' : ''}>TPU</option>
                    <option value="Resin" ${materialType === 'Resin' ? 'selected' : ''}>Resin</option>
                </select>
            </div>
            <div class="col-md-2">
                <label class="form-label small mb-1">Color</label>
                <div class="input-group input-group-sm">
                    <input type="color" class="form-control form-control-color color-picker p-0" value="${defaultMat.color}" style="height: 31px">
                    <span class="input-group-text color-preview" style="background-color: ${defaultMat.color}"></span>
                </div>
            </div>
            <div class="col-md-2">
                <label class="form-label small mb-1">Weight (g)</label>
                <input type="number" class="form-control form-control-sm material-weight" value="0" step="0.1" min="0">
            </div>
            <div class="col-md-2">
                <label class="form-label small mb-1">Cost (€/kg)</label>
                <input type="number" class="form-control form-control-sm material-cost" value="${defaultMat.cost}" step="0.01" min="0">
            </div>
            <div class="col-md-2">
                <label class="form-label small mb-1">Density (g/cm³)</label>
                <input type="number" class="form-control form-control-sm material-density" value="${defaultMat.density}" step="0.01" min="0.1">
            </div>
            <div class="col-md-1">
                <button type="button" class="btn btn-sm btn-outline-danger w-100 remove-material" ${materialCount === 1 ? 'disabled' : ''}>
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    materialsContainer.appendChild(materialRow);
    
    // Add event listeners
    const colorPicker = materialRow.querySelector('.color-picker');
    const colorPreview = materialRow.querySelector('.color-preview');
    
    colorPicker.addEventListener('input', (e) => {
        colorPreview.style.backgroundColor = e.target.value;
        calculateCosts();
    });
    
    materialRow.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('input', calculateCosts);
    });
    
    materialRow.querySelector('.remove-material').addEventListener('click', () => {
        if (document.querySelectorAll('.material-row').length > 1) {
            materialRow.remove();
            calculateCosts();
        }
    });
    
    calculateCosts();
    return materialRow;
}

// Update material options based on printer type
function updateMaterialOptions(printerType) {
    console.log(`Updating material options for printer type: ${printerType}`);
    
    // Define material options based on printer type
    const materialOptions = {
        'fdm': [
            { id: 'pla', name: 'PLA', cost: 20.00, density: 1.24, color: '#808080' },
            { id: 'abs', name: 'ABS', cost: 25.00, density: 1.04, color: '#404040' },
            { id: 'petg', name: 'PETG', cost: 30.00, density: 1.27, color: '#00aaff' },
            { id: 'tpu', name: 'TPU', cost: 40.00, density: 1.21, color: '#ff7700' }
        ],
        'resin': [
            { id: 'resin_standard', name: 'Standard Resin', cost: 50.00, density: 1.12, color: '#a0a0a0' },
            { id: 'resin_water_washable', name: 'Water Washable Resin', cost: 60.00, density: 1.15, color: '#b0c4de' },
            { id: 'resin_tough', name: 'Tough Resin', cost: 70.00, density: 1.18, color: '#d3d3d3' }
        ]
    };
    
    // Get the appropriate materials for the printer type
    const materials = materialOptions[printerType] || [];
    
    // Get all material type selects
    const materialTypeSelects = document.querySelectorAll('.material-type');
    
    materialTypeSelects.forEach(select => {
        // Store the current value
        const currentValue = select.value;
        
        // Clear existing options
        select.innerHTML = '';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select Material';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        select.appendChild(defaultOption);
        
        // Add material options
        materials.forEach(material => {
            const option = document.createElement('option');
            option.value = material.id;
            option.textContent = material.name;
            option.dataset.cost = material.cost;
            option.dataset.density = material.density;
            option.dataset.color = material.color;
            select.appendChild(option);
        });
        
        // Restore the previous value if it's still valid
        if (currentValue && select.querySelector(`option[value="${currentValue}"]`)) {
            select.value = currentValue;
        } else if (select.options.length > 1) {
            // Select the first available material if previous value is not valid
            select.selectedIndex = 1;
        }
        
        // Trigger change event to update dependent fields
        select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    console.log(`Updated material options for ${printerType} printer`);
}

// Update printer details based on selection
function updatePrinterDetails() {
    console.log('Updating printer details...');
    if (!printerSelect) {
        console.error('Printer select element not found');
        return;
    }
    
    const printerId = printerSelect.value;
    console.log('Selected printer ID:', printerId);
    
    // Clear existing materials
    const materialsContainer = document.getElementById('materials-container');
    if (materialsContainer) {
        materialsContainer.innerHTML = '';
    }
    
    if (printerId && printerId !== 'custom') {
        const printer = printers[printerId];
        if (printer) {
            console.log('Found printer:', printer);
            
            // Update printer power
            const powerInput = document.getElementById('printer-power');
            if (powerInput) {
                powerInput.value = printer.power;
                console.log('Updated printer power to:', printer.power);
                // Force update the power value in the UI and trigger calculation
                const inputEvent = new Event('input', { bubbles: true });
                const changeEvent = new Event('change', { bubbles: true });
                powerInput.dispatchEvent(inputEvent);
                powerInput.dispatchEvent(changeEvent);
                // Recalculate costs after a small delay to ensure UI updates
                setTimeout(calculateCosts, 100);
            } else {
                console.error('Power input element not found');
            }
        }
        
        // Clear existing materials
        if (materialsContainer) {
            console.log('Clearing existing materials');
            materialsContainer.innerHTML = '';
        }
        
        // Add default material based on printer type
        const defaultMaterial = printer.type === 'fdm' ? 'PLA' : 'Resin';
        console.log('Adding default material:', defaultMaterial);
        addMaterialRow(defaultMaterial);
        
        // Update material options based on printer type
        updateMaterialOptions(printer.type);
        
        // Recalculate costs after a short delay to ensure DOM updates
        setTimeout(calculateCosts, 100);
    } else {
        console.log('Custom printer selected, adding default PLA material');
        // For custom printer, add default PLA material
        addMaterialRow('pla');
        calculateCosts();
    }
}

// Toggle between English and Spanish
function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'es' : 'en';
    
    // Update UI text based on language
    const translations = {
        en: {
            // Main header
            'app-title': '3D Printing Cost Calculator',
            'language': 'EN/ES',
            'units': 'g/ml',
            
            // Section headers
            'printer-settings': 'Printer Settings',
            'print-information': 'Print Information',
            'materials': 'Materials',
            'cost-settings': 'Others',
            'suggested-pricing': 'Suggested Pricing',
            'cost-summary': 'Cost Summary',
            'cost-allocation': 'Cost Allocation',
            'custom': 'Custom',
            
            // Form labels
            'printer-label': 'Printer Model',
            'power-label': 'Power Consumption',
            'print-time-label': 'Print Time',
            'quantity-label': 'Quantity',
            'failure-rate': 'Failure Rate',
            'electricity-cost': 'Electricity Cost',
            'labor-cost': 'Labor Cost',
            'labor-rate': 'Labor Rate',
            'labor-hours': 'Labor Hours',
            'calculation-type': 'Calculation',
            'material-label': 'Material',
            'weight-label': 'Weight',
            'cost-per-kg': 'Cost per kg',
            'remove': 'Remove',
            'total': 'Total',
            'packaging-cost': 'Packaging Cost',
            'shipping-cost': 'Shipping Cost',
            'calculation-type': 'Calculation',
            'total-amount': 'Total Amount (×1)',
            'per-piece': 'Per Piece (×Qty)',
            
            // Buttons
            'add-material': 'Add Material',
            'calculate': 'Calculate',
            'reset': 'Reset',
            'export-pdf': 'Export PDF',
            
            // Results
            'material-cost': 'Material Cost',
            'electricity-cost-result': 'Electricity Cost',
            'labor-cost-result': 'Labor Cost',
            'subtotal': 'Subtotal',
            'base-cost': 'Base Cost',
            'total-cost': 'Total Cost',
            
            // Suggested pricing
            'competitive': 'Competitive',
            'standard': 'Standard',
            'premium': 'Premium',
            'luxury': 'Luxury',
            'custom-margin': 'Custom Margin',
            'profit-margin': 'Profit Margin',
            'price': 'Price',
            'per-piece': 'Per Piece',
            'total-hours': 'Total Hours (×1)'
        },
        es: {
            // Main header
            'app-title': 'Calculadora de Costos de Impresión 3D',
            'language': 'ES/EN',
            'units': 'g/ml',
            
            // Section headers
            'printer-settings': 'Configuración de la Impresora',
            'print-information': 'Información de la Impresión',
            'materials': 'Materiales',
            'cost-settings': 'Otros',
            'suggested-pricing': 'Precios Sugeridos',
            'cost-summary': 'Resumen de Costos',
            'cost-allocation': 'Distribución de Costos',
            'custom': 'Personalizado',
            
            // Form labels
            'printer-label': 'Modelo de Impresora',
            'power-label': 'Consumo de Energía',
            'print-time-label': 'Tiempo de Impresión',
            'quantity-label': 'Cantidad',
            'failure-rate': 'Tasa de Falla',
            'electricity-cost': 'Costo de Electricidad',
            'labor-cost': 'Costo de Mano de Obra',
            'labor-rate': 'Tarifa por Hora',
            'labor-hours': 'Horas de Trabajo',
            'calculation-type': 'Cálculo',
            'material-label': 'Material',
            'weight-label': 'Peso',
            'cost-per-kg': 'Costo por kg',
            'remove': 'Eliminar',
            'total': 'Total',
            
            // Buttons
            'add-material': 'Añadir Material',
            'calculate': 'Calcular',
            'reset': 'Reiniciar',
            'export-pdf': 'Exportar PDF',
            
            // Results
            'material-cost': 'Costo de Material',
            'electricity-cost-result': 'Costo de Electricidad',
            'labor-cost-result': 'Mano de Obra',
            'subtotal': 'Subtotal',
            'base-cost': 'Costo Base',
            'total-cost': 'Costo Total',
            
            // Suggested pricing
            'competitive': 'Competitivo',
            'standard': 'Estándar',
            'premium': 'Premium',
            'luxury': 'Lujo',
            'custom-margin': 'Margen Personalizado',
            'profit-margin': 'Margen de Ganancia',
            'price': 'Precio',
            'per-piece': 'Por Pieza',
            'total-hours': 'Horas Totales (×1)'
        }
    };

    // Update all text elements
    Object.entries(translations[currentLang]).forEach(([key, value]) => {
        const elements = document.querySelectorAll(`[data-i18n="${key}"]`);
        elements.forEach(el => {
            el.textContent = value;
        });
    });

    // Update currency symbol based on language
    currencySymbol = currentLang === 'en' ? '€' : '€';
    
    // Recalculate to update currency symbols
    calculateCosts();
}

// Toggle between metric and imperial units
function toggleUnitSystem() {
    isMetric = !isMetric;
    const unitDisplay = document.querySelector('#unit-toggle [data-i18n="units"]');
    if (unitDisplay) {
        unitDisplay.textContent = isMetric ? 'g/ml' : 'oz/in³';
    }
    
    // Update power input display
    const printerPowerInput = document.getElementById('printer-power');
    if (printerPowerInput) {
        const powerValue = parseFloat(printerPowerInput.value) || 0;
        printerPowerInput.value = isMetric ? powerValue : Math.round(powerValue * 0.00134102 * 100) / 100;
    }
    
    const powerLabel = document.querySelector('label[for="printer-power"]');
    if (powerLabel) {
        powerLabel.textContent = isMetric ? 'Power Consumption (W)' : 'Power Consumption (hp)';
    }
    
    calculateCosts();
}

// Alias for toggleUnitSystem for backward compatibility
function toggleUnits() {
    toggleUnitSystem();
}

// Calculate all costs
function calculateCosts(e) {
    if (e) e.preventDefault();
    
    try {
        console.log('Calculating costs...');
        
        // Get values from form inputs
        const printTimeHours = parseFloat(document.getElementById('print-time').value) || 0;
        const quantity = parseInt(document.getElementById('quantity').value) || 1;
        const failureRate = parseFloat(document.getElementById('failure-rate').value) || 0;
        const electricityRate = parseFloat(document.getElementById('electricity-cost').value) || 0.2; // Default €0.20/kWh
        const laborRate = parseFloat(document.getElementById('labor-rate').value) || 15; // Default €15/hour
        const laborHours = parseFloat(document.getElementById('labor-hours').value) || 0;
        const packagingCost = parseFloat(document.getElementById('packaging-cost').value) || 0;
        const packagingCalculationType = document.getElementById('packaging-calculation-type').value;
        const shippingCost = parseFloat(document.getElementById('shipping-cost').value) || 0;
        const shippingCalculationType = document.getElementById('shipping-calculation-type').value;
        
        console.log('Input values:', { printTimeHours, quantity, failureRate, electricityRate, laborRate, laborHours, packagingCost, packagingCalculationType });
        
        // Calculate material costs from all material rows
        let totalMaterialCost = 0;
        document.querySelectorAll('.material-row').forEach((row, index) => {
            const weight = parseFloat(row.querySelector('.material-weight').value) || 0;
            const costPerKg = parseFloat(row.querySelector('.material-cost').value) || 0;
            const materialCost = weight * (costPerKg / 1000); // Convert g to kg
            totalMaterialCost += materialCost;
            console.log(`Material ${index + 1}:`, { weight, costPerKg, materialCost });
        });
        
        // Calculate electricity cost
        const printerPower = parseFloat(document.getElementById('printer-power').value) || 0; // in watts
        const electricityCost = (printerPower * printTimeHours / 1000) * electricityRate; // Convert to kWh then multiply by rate
        console.log('Electricity cost calculated:', { printerPower, printTimeHours, electricityRate, electricityCost });
        
        // Calculate labor cost based on calculation type
        const laborCalculationType = document.getElementById('labor-calculation-type').value;
        let laborCost = laborRate * laborHours;
        
        if (laborCalculationType === 'per-piece') {
            laborCost *= quantity;
        }
        
        // Calculate packaging and shipping costs based on calculation type
        let totalPackagingCost = packagingCost;
        let totalShippingCost = shippingCost;
        
        if (packagingCalculationType === 'per-piece') {
            totalPackagingCost *= quantity;
        }
        
        if (shippingCalculationType === 'per-piece') {
            totalShippingCost *= quantity;
        }
        
        // Calculate failure multiplier (e.g., 5% failure rate = 1.05 multiplier)
        const failureMultiplier = 1 + (failureRate / 100);
        
        // Calculate total base cost (materials + electricity + labor + packaging + shipping) * failure multiplier
        const baseCost = (totalMaterialCost + electricityCost + laborCost + totalPackagingCost + totalShippingCost) * failureMultiplier;
        
        // Calculate final costs with failure rate and quantity applied
        const finalMaterialCost = totalMaterialCost * quantity * failureMultiplier;
        const finalElectricityCost = electricityCost * failureMultiplier;
        const finalLaborCost = laborCalculationType === 'per-piece' 
            ? laborCost * failureMultiplier 
            : laborCost;
        const finalPackagingCost = packagingCalculationType === 'per-piece' 
            ? totalPackagingCost * quantity * failureMultiplier 
            : totalPackagingCost * failureMultiplier;
            
        const finalShippingCost = shippingCalculationType === 'per-piece'
            ? totalShippingCost * quantity * failureMultiplier
            : totalShippingCost * failureMultiplier;
        
        console.log('Final costs after all calculations:', {
            material: finalMaterialCost,
            electricity: finalElectricityCost,
            labor: finalLaborCost,
            quantity,
            failureMultiplier
        });
        
        console.log('Calculated costs:', {
            material: finalMaterialCost,
            electricity: finalElectricityCost,
            labor: finalLaborCost,
            failureMultiplier
        });
        
        // Update the UI with the calculated costs
        updateResults(finalMaterialCost, finalElectricityCost, finalLaborCost, finalPackagingCost, finalShippingCost);
        
        // Update the cost allocation chart
        updateCostAllocationChart(finalMaterialCost, finalElectricityCost, finalLaborCost, finalPackagingCost, finalShippingCost);
        
    } catch (error) {
        console.error('Error calculating costs:', error);
    }
}

// Update the cost allocation chart
function updateCostAllocationChart(materialCost = 0, electricityCost = 0, laborCost = 0, packagingCost = 0, shippingCost = 0) {
    console.log('Updating cost allocation chart with:', { materialCost, electricityCost, laborCost, packagingCost, shippingCost });
    const canvas = document.getElementById('costAllocationChart');
    if (!canvas) {
        console.error('Cost allocation chart canvas not found');
        return;
    }
    
    let ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Could not get 2D context for chart');
        return;
    }
    
    // If we have a chart already, destroy it first
    if (window.costAllocationChart && typeof window.costAllocationChart.destroy === 'function') {
        window.costAllocationChart.destroy();
        window.costAllocationChart = null;
    }
    
    // Ensure we have valid numbers
    materialCost = parseFloat(materialCost) || 0;
    electricityCost = parseFloat(electricityCost) || 0;
    laborCost = parseFloat(laborCost) || 0;
    packagingCost = parseFloat(packagingCost) || 0;
    shippingCost = parseFloat(shippingCost) || 0;
    
    // Calculate base cost (sum of material, electricity, labor, packaging, and shipping costs)
    const baseCost = materialCost + electricityCost + laborCost + packagingCost + shippingCost;
    
    // Get the selected pricing option
    const selectedOption = document.querySelector('input[name="pricingOption"]:checked');
    let marginPercent = 0;
    
    if (selectedOption) {
        switch(selectedOption.value) {
            case 'competitive': marginPercent = 25; break;
            case 'standard': marginPercent = 40; break;
            case 'premium': marginPercent = 60; break;
            case 'luxury': marginPercent = 80; break;
            case 'custom':
                const customMargin = document.getElementById('custom-margin');
                marginPercent = customMargin ? parseInt(customMargin.value) || 25 : 25;
                break;
        }
    }
    
    // Calculate margin amount and total with margin
    const marginAmount = baseCost * (marginPercent / 100);
    const totalWithMargin = baseCost + marginAmount;
    
    console.log('Updating chart with costs:', {
        materialCost,
        electricityCost,
        laborCost,
        packagingCost,
        shippingCost,
        marginAmount,
        totalWithMargin
    });
    
    // Prepare chart data
    const chartData = {
        labels: [
            `Material (€${materialCost.toFixed(2)})`,
            `Electricity (€${electricityCost.toFixed(2)})`,
            `Labor (€${laborCost.toFixed(2)})`,
            `Packaging (€${packagingCost.toFixed(2)})`,
            `Shipping (€${shippingCost.toFixed(2)})`,
            `Margin ${marginPercent}% (€${marginAmount.toFixed(2)})`
        ],
        datasets: [{
            data: [
                materialCost,
                electricityCost,
                laborCost,
                packagingCost,
                shippingCost,
                marginAmount
            ],
            backgroundColor: [
                '#4e73df', // Material - Blue
                '#1cc88a', // Electricity - Green
                '#f6c23e', // Labor - Yellow
                '#e74a3b',  // Packaging - Red
                '#9b59b6',  // Shipping - Purple
                '#ff69b4'  // Margin - Pink
            ],
            borderColor: [
                '#4e73df',
                '#1cc88a',
                '#f6c23e',
                '#e74a3b',
                '#9b59b6',
                '#ff69b4'
            ],
            borderWidth: 2
        }]
    };

    // Chart configuration
    const config = {
        type: 'doughnut',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%', // Adjust donut thickness to cover 70% of the box
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: €${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                },
                // Remove the title plugin to eliminate the top label
                title: false
            },
            elements: {
                arc: {
                    borderWidth: 0
                }
            },
            // Add padding to make the chart larger within its container
            layout: {
                padding: 10
            }
        },
        plugins: [{
            id: 'centerText',
            beforeDraw: function(chart) {
                const width = chart.width,
                    height = chart.height,
                    ctx = chart.ctx;

                ctx.restore();

                // Draw total amount perfectly centered in the donut
                const fontSize = Math.min(width, height) / 10; // Slightly smaller font size
                ctx.font = `bold ${fontSize}px Inter, system-ui, -apple-system, sans-serif`;
                ctx.textBaseline = 'middle'; // Center text vertically
                ctx.textAlign = 'center';

                // Main total amount
                const text = formatCurrency(totalWithMargin);
                const textX = width / 2;
                const textY = height / 2; // Center vertically

                // Add subtle text shadow for better readability
                ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
                ctx.shadowBlur = 3;
                ctx.shadowOffsetX = 1;
                ctx.shadowOffsetY = 1;
                
                // Draw the main amount
                ctx.fillStyle = '#1f2937';
                ctx.fillText(text, textX, textY);
                
                // Reset shadow
                ctx.shadowColor = 'transparent';
                
                // Remove the "TOTAL" label as requested
                // ctx.font = `500 ${fontSize * 0.3}px Inter, system-ui, -apple-system, sans-serif`;
                // ctx.fillStyle = '#6b7280';
                // ctx.fillText('TOTAL', textX, textY + (fontSize * 0.8));

                ctx.save();
            }
        }]
    };

    // Always create a new chart instance instead of updating
    try {
        // Destroy existing chart if it exists
        if (window.costAllocationChart && typeof window.costAllocationChart.destroy === 'function') {
            window.costAllocationChart.destroy();
        }

        // Create new chart instance
        window.costAllocationChart = new Chart(ctx, config);
    } catch (error) {
        console.error('Error initializing chart:', error);
        // If there's an error, clear the canvas and show an error message
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '14px Arial';
            ctx.fillStyle = 'red';
            ctx.textAlign = 'center';
            ctx.fillText('Error loading chart', canvas.width / 2, canvas.height / 2);
        }
    }

    // Update the total cost display
    const totalCostEl = document.getElementById('total-cost');
    if (totalCostEl) {
        totalCostEl.textContent = formatCurrency(totalWithMargin);
    }
}

// Update suggested prices based on base cost
function updateSuggestedPrices(baseCost) {
    if (isNaN(baseCost) || baseCost <= 0) return;
    
    const pricingOptions = [
        { id: 'competitive', margin: 0.25 },
        { id: 'standard', margin: 0.40 },
        { id: 'premium', margin: 0.60 },
        { id: 'luxury', margin: 0.80 },
        { id: 'custom', margin: 0.25 } // Default custom margin, can be changed by user
    ];
    
    pricingOptions.forEach(option => {
        const priceElement = document.getElementById(`${option.id}-price`);
        if (priceElement) {
            const price = baseCost * (1 + option.margin);
            priceElement.textContent = `€${price.toFixed(2)}`;
        }
    });
    
    // Also update the custom price if it's selected
    updateTotalCost();
}

// Update total cost based on selected pricing option
function updateTotalCost() {
    const baseCostEl = document.getElementById('base-cost');
    if (!baseCostEl) return;
    
    const baseCost = parseFloat(baseCostEl.textContent.replace('€', '')) || 0;
    const selectedOption = document.querySelector('input[name="pricingOption"]:checked');
    
    if (!selectedOption) return;
    
    let total = 0;
    const optionId = selectedOption.id.replace('pricing-', '');
    
    if (optionId === 'custom') {
        const customMargin = parseFloat(document.getElementById('custom-margin')?.value) || 0;
        total = baseCost * (1 + (customMargin / 100));
    } else {
        const priceElement = document.getElementById(`${optionId}-price`);
        if (priceElement) {
            total = parseFloat(priceElement.textContent.replace('€', '')) || 0;
        }
    }
    
    const totalCostElement = document.getElementById('total-cost');
    if (totalCostElement) {
        totalCostElement.textContent = `€${total.toFixed(2)}`;
    }
}

// Update the results in the UI
function updateResults(materialCost = 0, electricityCost = 0, laborCost = 0, packagingCost = 0, shippingCost = 0) {
    console.log('Updating results with:', { materialCost, electricityCost, laborCost, packagingCost, shippingCost });

    // Ensure we have valid numbers
    materialCost = parseFloat(materialCost) || 0;
    electricityCost = parseFloat(electricityCost) || 0;
    laborCost = parseFloat(laborCost) || 0;
    packagingCost = parseFloat(packagingCost) || 0;
    shippingCost = parseFloat(shippingCost) || 0;

    // Calculate base cost (sum of material, electricity, labor, packaging, and shipping costs)
    // These values already include quantity and failure rate multipliers
    const baseCost = materialCost + electricityCost + laborCost + packagingCost + shippingCost;
    window.currentBaseCost = baseCost; // Store for pricing calculations

    console.log('Base cost calculated:', {
        materialCost,
        electricityCost,
        laborCost,
        packagingCost,
        shippingCost,
        totalBaseCost: baseCost
    });

    // Format number helper function
    const formatNumber = (num) => {
        return num.toLocaleString(currentLang, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // Update the base cost display
    const baseCostEl = document.getElementById('base-cost');
    if (baseCostEl) {
        baseCostEl.textContent = `€${formatNumber(baseCost)}`;
    }

    // Update the individual cost displays
    const materialCostEl = document.getElementById('material-cost');
    const electricityCostEl = document.getElementById('electricity-cost-result');
    const laborCostEl = document.getElementById('labor-cost-result');
    const packagingCostEl = document.getElementById('packaging-cost-result');
    const shippingCostEl = document.getElementById('shipping-cost-result');

    if (materialCostEl) materialCostEl.textContent = `€${formatNumber(materialCost)}`;
    if (electricityCostEl) electricityCostEl.textContent = `€${formatNumber(electricityCost)}`;
    if (laborCostEl) laborCostEl.textContent = `€${formatNumber(laborCost)}`;
    if (packagingCostEl) packagingCostEl.textContent = `€${formatNumber(packagingCost)}`;
    if (shippingCostEl) shippingCostEl.textContent = `€${formatNumber(shippingCost)}`;

    // Update the cost allocation chart with the latest values
    updateCostAllocationChart(materialCost, electricityCost, laborCost, packagingCost, shippingCost);

    // Update the suggested prices based on the new base cost
    updateSuggestedPrices(baseCost);

    // Force update the total cost with the latest base cost
    updateTotalCost();

    // Add animation to the results
    const resultsCard = document.querySelector('.results-card');
    if (resultsCard) {
        resultsCard.style.animation = 'none';
        void resultsCard.offsetWidth; // Trigger reflow
        resultsCard.style.animation = 'pulse 0.5s';
    }
}

// Export results as PDF
function exportToPdf() {
    const element = document.querySelector('.results-card');
    const opt = {
        margin: 10,
        filename: '3d-printing-cost-calculator.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            logging: true,
            allowTaint: true
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait' 
        }
    };

    try {
        // Show loading state
        const originalText = exportPdfBtn.innerHTML;
        exportPdfBtn.disabled = true;
        exportPdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Generating PDF...';

        // Generate PDF
        html2pdf()
            .set(opt)
            .from(element)
            .save()
            .then(() => {
                // Restore button state
                exportPdfBtn.disabled = false;
                exportPdfBtn.innerHTML = originalText;
                
                // Show success message
                const alert = document.createElement('div');
                alert.className = 'alert alert-success mt-3';
                alert.role = 'alert';
                alert.innerHTML = 'PDF generated successfully!';
                element.parentNode.insertBefore(alert, element.nextSibling);
                
                // Remove alert after 3 seconds
                setTimeout(() => alert.remove(), 3000);
            })
            .catch(err => {
                console.error('Error generating PDF:', err);
                handlePdfError(originalText, element, 'Error generating PDF. Please try again.');
            });
    } catch (err) {
        console.error('Unexpected error in exportToPdf:', err);
        handlePdfError('Export PDF', element, 'An unexpected error occurred. Please check the console for details.');
    }
}

function handlePdfError(originalText, element, message) {
    // Restore button state
    if (exportPdfBtn) {
        exportPdfBtn.disabled = false;
        exportPdfBtn.innerHTML = originalText;
    }
    
    // Show error message
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger mt-3';
    alert.role = 'alert';
    alert.innerHTML = message;
    element.parentNode.insertBefore(alert, element.nextSibling);
    
    // Remove alert after 5 seconds
    setTimeout(() => alert.remove(), 5000);
}
