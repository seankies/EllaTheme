document.addEventListener('DOMContentLoaded', function () {
    // New ET from Weight Change Calculation
    document.querySelector('#new-et-weight-form').addEventListener('submit', function (event) {
        event.preventDefault();
        
        const et = parseFloat(document.querySelector('#et-weight').value);
        const mph = parseFloat(document.querySelector('#mph-weight').value);
        const originalWeight = parseFloat(document.querySelector('#original-weight').value);
        const newWeight = parseFloat(document.querySelector('#new-weight').value);
        const originalHpCorrection = parseFloat(document.querySelector('#original-hp-correction').value);
        const newHpCorrection = parseFloat(document.querySelector('#new-hp-correction').value);

        if ([et, mph, originalWeight, newWeight, originalHpCorrection, newHpCorrection].some(value => isNaN(value) || value <= 0)) {
            document.querySelector('#new-et-result').textContent = 'Invalid input';
            document.querySelector('#new-mph-result').textContent = 'Invalid input';
            document.querySelector('#new-kph-result').textContent = 'Invalid input';
            return;
        }

        const newET = et * ((newWeight / originalWeight) ** (1/3)) * ((newHpCorrection / originalHpCorrection) ** (1/3));
        const newMPH = mph * ((originalWeight / newWeight) ** (1/3)) * ((originalHpCorrection / newHpCorrection) ** (1/3));
        const newKPH = newMPH * 1.609;

        document.querySelector('#new-et-result').textContent = newET.toFixed(2);
        document.querySelector('#new-mph-result').textContent = newMPH.toFixed(2);
        document.querySelector('#new-kph-result').textContent = newKPH.toFixed(2);
    });

    // New ET from HP Change Calculation
    document.querySelector('#new-et-hp-form').addEventListener('submit', function (event) {
        event.preventDefault();
        
        const et = parseFloat(document.querySelector('#et-hp').value);
        const mph = parseFloat(document.querySelector('#mph-hp').value);
        const originalWeightHp = parseFloat(document.querySelector('#original-weight-hp').value);
        const originalHp = parseFloat(document.querySelector('#original-hp').value);
        const newHp = parseFloat(document.querySelector('#new-hp').value);

        if ([et, mph, originalWeightHp, originalHp, newHp].some(value => isNaN(value) || value <= 0)) {
            document.querySelector('#new-hp-et-result').textContent = 'Invalid input';
            document.querySelector('#new-hp-mph-result').textContent = 'Invalid input';
            return;
        }

        const newET = et * ((originalHp / newHp) ** (1/3));
        const newMPH = mph * ((newHp / originalHp) ** (1/3));

        document.querySelector('#new-hp-et-result').textContent = newET.toFixed(2);
        document.querySelector('#new-hp-mph-result').textContent = newMPH.toFixed(2);
    });
});   