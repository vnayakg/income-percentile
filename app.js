const data = [
    { group: "100%", threshold: 0, averageIncome: 0, percentile: 0 },
    {
        group: "Bottom 50%",
        threshold: 105413,
        averageIncome: 71163,
        percentile: 50,
    },
    {
        group: "Middle 40%",
        threshold: 290848,
        averageIncome: 165273,
        percentile: 90,
    },
    {
        group: "Top 10%",
        threshold: 2073846,
        averageIncome: 1352985,
        percentile: 99,
    },
    {
        group: "Top 1%",
        threshold: 8220379,
        averageIncome: 5300549,
        percentile: 99.9,
    },
    {
        group: "Top 0.1%",
        threshold: 34606044,
        averageIncome: 101814669,
        percentile: 99.99,
    },
    {
        group: "Top 0.01%",
        threshold: 200198548,
        averageIncome: 485196875,
        percentile: 99.999,
    },
];
document
    .getElementById("calculatorForm")
    .addEventListener("submit", function (e) {
        e.preventDefault();
        calculatePercentile();
    });

document.addEventListener("DOMContentLoaded", function () {
    validateInput();
});
document.getElementById("salaryInput").addEventListener("input", validateInput);

function logInterpolate(x1, x2, y1, y2, x) {
    const logY1 = Math.log(y1);
    const logY2 = Math.log(y2);
    const interpolatedLogY = logY1 + ((x - x1) * (logY2 - logY1)) / (x2 - x1);
    return Math.exp(interpolatedLogY);
}

function validateInput() {
    const salaryInput = document.getElementById("salaryInput");
    const calculateButton = document.getElementById("calculateButton");
    calculateButton.disabled =
        salaryInput.value.trim() === "" || isNaN(salaryInput.value);
}

function calculatePercentile() {
    const salary = parseFloat(document.getElementById("salaryInput").value);

    let percentile, lowerPoint, upperPoint;

    if (salary < data[1].threshold) {
        percentile = (salary / data[1].threshold) * 50;
        lowerPoint = data[0];
        upperPoint = data[1];
    } else {
        for (let i = 1; i < data.length - 1; i++) {
            if (salary >= data[i].threshold && salary < data[i + 1].threshold) {
                lowerPoint = data[i];
                upperPoint = data[i + 1];
                break;
            }
        }

        if (!lowerPoint) {
            if (salary >= data[data.length - 1].threshold) {
                lowerPoint = data[data.length - 1];
                upperPoint = { threshold: salary * 1.5, percentile: 100 };
            } else {
                lowerPoint = data[0];
                upperPoint = data[1];
            }
        }

        percentile =
            lowerPoint.percentile +
            ((Math.log(salary) - Math.log(lowerPoint.threshold)) *
                (upperPoint.percentile - lowerPoint.percentile)) /
                (Math.log(upperPoint.threshold) -
                    Math.log(lowerPoint.threshold));
    }

    const topPercentage = 100 - percentile;
    const peopleAhead = Math.floor((topPercentage / 100) * 922344832);

    document.getElementById("info").innerHTML = `
        <p>You are among the top <strong>${topPercentage
            .toFixed(3)
            .toLocaleString()}%</strong> of income earners in India</p>
        <p>Around <strong>${peopleAhead.toLocaleString("en-IN", {
            maximumFractionDigits: 2,
        })}</strong> individuals earn more than you </p>
    `;

    drawChart(percentile);
}

function drawChart(percentile) {
    const ctx = document.getElementById("percentileChart").getContext("2d");

    const chartData = {
        labels: [100, 50, 10, 1, 0.1, 0.01, 0.001],
        datasets: [
            {
                data: [1, ...data.slice(1).map((d) => d.threshold)],
                borderColor: "blue",
                backgroundColor: "rgba(0, 123, 255, 0.5)",
                fill: false,
                tension: 0.2,
            },
        ],
    };
    const pointMarker = {
        id: "pointMarker",
        beforeDatasetsDraw(chart) {
            const {
                ctx,
                scales: { x, y },
            } = chart;
            const xPos = x.getPixelForValue(labels[highlightIndex]);
            const yPos = y.getPixelForValue(data[highlightIndex]);

            ctx.beginPath();
            ctx.arc(xPos, yPos, 5, 0, 2 * Math.PI);
            ctx.fillStyle = highlightColor;
            ctx.fill();
            ctx.stroke();
        },
    };

    const options = {
        responsive: true,
        scales: {
            y: {
                type: "logarithmic",
                title: {
                    display: true,
                    text: "Income",
                },
                ticks: {
                    autoSkips: true,
                    maxTicksLimit: 8,
                    callback: function (value) {
                        if (
                            value === 0 ||
                            value === 1 ||
                            value === 100000 ||
                            value === 1000000 ||
                            value === 10000000 ||
                            value === 100000000 ||
                            value === 1000000000
                        ) {
                            return "₹" + value.toLocaleString();
                        }
                        return null;
                    },
                },
            },
            x: {
                type: "logarithmic",
                reverse: false,
                title: {
                    display: true,
                    text: "Percentile",
                },
                ticks: {
                    autoSkips: true,
                    maxTicksLimit: 8,
                    callback: function (value) {
                        return value.toFixed(2);
                    },
                },
            },
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                enabled: false,
            },
            annotation: {
                annotations: {
                    line1: {
                        reverse: true,
                        type: "line",
                        xMin: parseFloat((100 - percentile).toFixed(2)),
                        xMax: parseFloat((100 - percentile).toFixed(2)),
                        borderColor: "red",
                        borderWidth: 2,
                        borderDash: [6, 6],
                        label: {
                            content: `You are here ${(100 - percentile).toFixed(
                                2
                            )}`,
                            enabled: true,
                            position: "center",
                        },
                    },
                },
            },
        },
    };

    if (window.myChart) {
        window.myChart.destroy();
    }

    window.myChart = new Chart(ctx, {
        type: "line",
        data: chartData,
        options: options,
        plugins: [
            {
                id: "custom_canvas_background_color",
                beforeDraw: (chart) => {
                    const ctx = chart.canvas.getContext("2d");
                    ctx.save();
                    ctx.globalCompositeOperation = "destination-over";
                    ctx.fillStyle = "white";
                    ctx.fillRect(0, 0, chart.width, chart.height);
                    ctx.restore();
                },
            },
        ],
    });
}
