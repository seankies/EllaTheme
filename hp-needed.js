document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('hp-form');
    const airDragResult = document.querySelector('#air-drag-hp span');
    const rollingResistanceResult = document.querySelector('#rolling-resistance-hp span');
    const totalHPResult = document.getElementById('hp-result-value');
    const currentMPH = document.getElementById('current-mph');

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        // Input values
        const Cd = parseFloat(document.getElementById('drag-coefficient').value);
        const A = parseFloat(document.getElementById('frontal-area').value);
        const W = parseFloat(document.getElementById('vehicle-weight').value);
        const V = parseFloat(document.getElementById('vehicle-speed').value);

        // Validation
        if (isNaN(Cd) || isNaN(A) || isNaN(W) || isNaN(V) || Cd <= 0 || A <= 0 || W <= 0 || V <= 0) {
            totalHPResult.textContent = 'Invalid input';
            return;
        }

        // Constants
        const airDensityConstant = 0.00256;
        const conversionFactor = 375;
        const rollingResistanceCoefficient = 0.013;

        // Air Drag HP Calculation
        const airDragHP = (airDensityConstant * Cd * A * Math.pow(V, 3)) / conversionFactor;

        // Rolling Resistance HP Calculation
        const rollingResistanceHP = (rollingResistanceCoefficient * W * V) / conversionFactor;

        // Total HP Required
        const totalHP = airDragHP + rollingResistanceHP;

        // Update result display

        airDragResult.textContent = airDragHP.toFixed(2);
        rollingResistanceResult.textContent = rollingResistanceHP.toFixed(2);
        totalHPResult.textContent = totalHP.toFixed(2);
        currentMPH.textContent = V;
    });
});