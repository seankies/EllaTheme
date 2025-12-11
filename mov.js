document.addEventListener('DOMContentLoaded', function () {
    // 0-60 Foot Time Calculation
    document.querySelector('#zero-to-sixty-form').addEventListener('submit', function (event) {
        event.preventDefault();
        const eighthMileTime = parseFloat(document.querySelector('#eighth-mile-time').value);
        const eighthMileSpeed = parseFloat(document.querySelector('#eighth-mile-speed').value);

        if (isNaN(eighthMileTime) || isNaN(eighthMileSpeed) || eighthMileTime <= 0 || eighthMileSpeed <= 0) {
            document.querySelector('#zero-to-sixty-result').textContent = 'Invalid input';
            return;
        }

        const zeroToSixtyTime = 3584.65 * (eighthMileTime ** 1.0009) * (eighthMileSpeed ** -1.9995);
        document.querySelector('#zero-to-sixty-result').textContent = zeroToSixtyTime.toFixed(2);
    });

    // 0-60 Foot Time Calculation
    document.querySelector('#sixty-foot-quarter-form').addEventListener('submit', function (event) {
        event.preventDefault();
        const quarterMileSixty = parseFloat(document.querySelector('#quarter-mile-sixty').value);

        if (isNaN(quarterMileSixty) || quarterMileSixty <= 0) {
            document.querySelector('#zero-to-sixty-result').textContent = 'Invalid input';
            return;
        }

        const quarterMileSixtyResult = quarterMileSixty/7.19424;
        document.querySelector('#sixty-foot-quarter-result').textContent = quarterMileSixtyResult.toFixed(4);
    });

    // Distance Of Margin Of Victory Calculation
    document.querySelector('#distance-margin-victory-form').addEventListener('submit', function (event) {
        event.preventDefault();
        const mov = parseFloat(document.querySelector('#mov').value);
        const lastMph = parseFloat(document.querySelector('#last-mph').value);

        if (isNaN(mov) || isNaN(lastMph) || mov <= 0 || lastMph <= 0) {
            document.querySelector('#distance-result-ft').textContent = 'Invalid input';
            document.querySelector('#distance-result-in').textContent = 'Invalid input';
            return;
        }

        const distanceFt = mov * lastMph * 1.4667;
        const distanceIn = distanceFt * 12;

        document.querySelector('#distance-result-ft').textContent = distanceFt.toFixed(2);
        document.querySelector('#distance-result-in').textContent = distanceIn.toFixed(2);
    });
});