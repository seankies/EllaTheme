document.addEventListener('DOMContentLoaded', function () {
    // HP from Torque and RPM
    document.querySelector('#hp-from-torque-form').addEventListener('submit', function (event) {
        event.preventDefault();
        const torque = parseFloat(document.querySelector('#torque').value);
        const rpm = parseFloat(document.querySelector('#rpm').value);
        
        if (isNaN(torque) || isNaN(rpm) || rpm <= 0) {
            document.querySelector('#hp-result').textContent = 'Invalid input';
            return;
        }
        
        const hp = (torque * rpm) / 5252;
        document.querySelector('#hp-result').textContent = `${hp.toFixed(2)} HP at ${rpm} RPM`;
    });

    // Torque from HP and RPM
    document.querySelector('#torque-from-hp-form').addEventListener('submit', function (event) {
        event.preventDefault();
        const hp = parseFloat(document.querySelector('#hp').value);
        const rpm = parseFloat(document.querySelector('#rpm-torque').value);

        if (isNaN(hp) || isNaN(rpm) || rpm <= 0) {
            document.querySelector('#torque-result').textContent = 'Invalid input';
            return;
        }

        const torque = (hp * 5252) / rpm;
        document.querySelector('#torque-result').textContent = `${torque.toFixed(2)} lb-ft at ${rpm} RPM`;
    });

    // Torque (Nm) from kW and RPM
    document.querySelector('#torque-from-kw-form').addEventListener('submit', function (event) {
        event.preventDefault();
        const kw = parseFloat(document.querySelector('#kw').value);
        const rpm = parseFloat(document.querySelector('#rpm-kw').value);

        if (isNaN(kw) || isNaN(rpm) || rpm <= 0) {
            document.querySelector('#torque-nm-result').textContent = 'Invalid input';
            return;
        }

        const torqueNm = (kw * 9550) / rpm;
        document.querySelector('#torque-nm-result').textContent = `${torqueNm.toFixed(2)} Nm at ${rpm} RPM`;
    });

    // Kilowatt from Nm and RPM
    document.querySelector('#kw-from-torque-form').addEventListener('submit', function (event) {
        event.preventDefault();
        const torqueNm = parseFloat(document.querySelector('#torque-nm').value);
        const rpm = parseFloat(document.querySelector('#rpm-nm').value);

        if (isNaN(torqueNm) || isNaN(rpm) || rpm <= 0) {
            document.querySelector('#kw-result').textContent = 'Invalid input';
            return;
        }

        const kw = (torqueNm * rpm) / 9550;
        document.querySelector('#kw-result').textContent = `${kw.toFixed(2)} kW at ${rpm} RPM`;
    });
});