// Basic JavaScript for Power Hour App
console.log("Power Hour App JS loaded");

let activeCountdownInterval = null;
let selectedDateType = 'today'; // 'today' or 'tomorrow'
let cachedEnergyData = null;
let useDummyData = false;

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function generateDynamicDummyData() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const currentHour = today.getHours();

    // Base data with various scenarios
    let data = [
        // === TODAY'S SCENARIOS ===
        // Scenario 1: "NU" - Power hour right now
        { "readingDate": formatDate(today), "readingHour": currentHour, "price": -0.010, "_comment": "Today: NU - current hour is PH" },
        { "readingDate": formatDate(today), "readingHour": (currentHour + 1) % 24, "price": 0.050, "_comment": "Today: NU - next hour normal price" },

        // Scenario 2: "OVER" - Power hour later today
        // { "readingDate": formatDate(today), "readingHour": (currentHour + 1) % 24, "price": -0.005, "_comment": "Today: OVER - PH in 1 hour" },
        // { "readingDate": formatDate(today), "readingHour": (currentHour + 2) % 24, "price": 0.000, "_comment": "Today: OVER - PH in 2 hours (multiple)" },
        // { "readingDate": formatDate(today), "readingHour": (currentHour + 3) % 24, "price": 0.060, "_comment": "Today: OVER - normal price after PHs" },
        
        // Scenario 3: "NEE" - No power hours today (or all in the past)
        // { "readingDate": formatDate(today), "readingHour": currentHour - 2 < 0 ? 22 : currentHour -2, "price": -0.001, "_comment": "Today: NEE - PH in past" },
        // { "readingDate": formatDate(today), "readingHour": currentHour - 1 < 0 ? 23 : currentHour -1, "price": -0.002, "_comment": "Today: NEE - PH in past" },
        // { "readingDate": formatDate(today), "readingHour": currentHour, "price": 0.020, "_comment": "Today: NEE - current hour normal" },
        // { "readingDate": formatDate(today), "readingHour": (currentHour + 1) % 24, "price": 0.030, "_comment": "Today: NEE - next hour normal" },


        // === TOMORROW'S SCENARIOS ===
        // Scenario 4: Power Hours tomorrow
        { "readingDate": formatDate(tomorrow), "readingHour": 2, "price": -0.005, "_comment": "Tomorrow: Has PH" },
        { "readingDate": formatDate(tomorrow), "readingHour": 3, "price": 0.000, "_comment": "Tomorrow: Has PH (multiple)" },
        { "readingDate": formatDate(tomorrow), "readingHour": 4, "price": 0.000, "_comment": "Tomorrow: Has PH (multiple)" },
        { "readingDate": formatDate(tomorrow), "readingHour": 14, "price": 0.100, "_comment": "Tomorrow: Normal price" },

        // Scenario 5: No Power Hours tomorrow
        // { "readingDate": formatDate(tomorrow), "readingHour": 2, "price": 0.015, "_comment": "Tomorrow: No PH" },
        // { "readingDate": formatDate(tomorrow), "readingHour": 3, "price": 0.020, "_comment": "Tomorrow: No PH" },
    ];

    // To test different scenarios, you can uncomment one of the blocks above for today's data.
    // Defaulting to Scenario 1 (NU) for today.
    // Ensure all hours of the day are covered with some price for robust testing if needed.
    // For simplicity, only adding a few hours here. A full 24h array would be more realistic.
    for (let i = 0; i < 24; i++) {
        // Ensure today's data has entries for all hours to avoid "no data" issues if not covered by scenarios
        if (!data.some(d => d.readingDate === formatDate(today) && d.readingHour === i)) {
            let price = 0.050 + Math.random() * 0.1; // Default positive price
            // Specific logic based on current scenario being tested for today
            if (data.some(d => d._comment.includes("Today: NU") && d.readingHour === currentHour)) { // NU Scenario
                if (i !== currentHour) price = 0.050; // NU active, other hours positive
            }
            // Add more conditions here to shape data for OVER or NEE scenarios for today
            data.push({ "readingDate": formatDate(today), "readingHour": i, "price": parseFloat(price.toFixed(3)), "_comment": "Today: Auto-fill" });
        }
        // Ensure tomorrow's data has entries
        if (!data.some(d => d.readingDate === formatDate(tomorrow) && d.readingHour === i)) {
             let price = 0.050 + Math.random() * 0.1;
             // Specific logic for tomorrow's scenarios
             if (data.some(d => d._comment.includes("Tomorrow: Has PH") && (d.readingHour === 2 || d.readingHour === 3 || d.readingHour === 4) )) {
                if (i !== 2 && i !== 3 && i !== 4) price = 0.070; // PH active, others positive
             }
            data.push({ "readingDate": formatDate(tomorrow), "readingHour": i, "price": parseFloat(price.toFixed(3)), "_comment": "Tomorrow: Auto-fill" });
        }
    }
    // Remove duplicates that might have been added by autofill if scenario already covered the hour
    data = data.filter((item, index, self) => 
        index === self.findIndex((t) => (
            t.readingDate === item.readingDate && t.readingHour === item.readingHour
        ))
    );
    console.log("Generated Dummy Data:", data);
    return data;
}


function getDateForProcessing(dateType) {
    const date = new Date();
    if (dateType === 'tomorrow') {
        date.setDate(date.getDate() + 1);
    }
    return formatDate(date);
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateTimers(status, powerHoursForSelectedDay, dateType) {
    const timerLabel = document.getElementById('timer-label');
    const statusTimer = document.getElementById('status-timer');
    const currentHour = new Date().getHours();

    if (activeCountdownInterval) {
        clearInterval(activeCountdownInterval);
        activeCountdownInterval = null;
    }
    timerLabel.textContent = '';
    statusTimer.textContent = '';

    if (dateType === 'today') {
        if (status === "NU") {
            const activePH = powerHoursForSelectedDay.find(ph => ph.startHour <= currentHour && currentHour < ph.endHour);
            if (activePH) {
                timerLabel.textContent = "Eindigt over";
                const endTime = new Date();
                endTime.setHours(activePH.endHour, 0, 0, 0);
                activeCountdownInterval = setInterval(() => {
                    const now = new Date();
                    const remainingSeconds = Math.max(0, Math.floor((endTime - now) / 1000));
                    statusTimer.textContent = formatTime(remainingSeconds);
                    if (remainingSeconds === 0) {
                        clearInterval(activeCountdownInterval);
                        setTimeout(fetchEnergyPrices, 5000);
                    }
                }, 1000);
            }
        } else if (status === "OVER") {
            const nextPH = powerHoursForSelectedDay.find(ph => ph.startHour > currentHour);
            if (nextPH) {
                timerLabel.textContent = "Start over";
                const startTime = new Date();
                startTime.setHours(nextPH.startHour, 0, 0, 0);
                activeCountdownInterval = setInterval(() => {
                    const now = new Date();
                    const remainingSeconds = Math.max(0, Math.floor((startTime - now) / 1000));
                    statusTimer.textContent = formatTime(remainingSeconds);
                    if (remainingSeconds === 0) {
                        clearInterval(activeCountdownInterval);
                        setTimeout(fetchEnergyPrices, 5000);
                    }
                }, 1000);
            }
        }
    } else if (dateType === 'tomorrow') {
        if (status === "OVER" && powerHoursForSelectedDay.length > 0) {
            const firstPHTomorrow = powerHoursForSelectedDay[0];
            timerLabel.textContent = "Eerste Power Hour start over";
            const tomorrowDate = new Date();
            tomorrowDate.setDate(tomorrowDate.getDate() + 1);
            const startTime = new Date(tomorrowDate.getFullYear(), tomorrowDate.getMonth(), tomorrowDate.getDate(), firstPHTomorrow.startHour, 0, 0, 0);
            activeCountdownInterval = setInterval(() => {
                const now = new Date();
                const remainingSeconds = Math.max(0, Math.floor((startTime - now) / 1000));
                statusTimer.textContent = formatTime(remainingSeconds);
                if (remainingSeconds === 0) clearInterval(activeCountdownInterval);
            }, 1000);
        }
    }
}

function processEnergyData(data) {
    if (!data) {
        console.log("No data to process.");
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = "Geen data geladen. Probeer later opnieuw.";
        errorMessage.style.display = 'block';
        return;
    }

    const statusCircle = document.getElementById('status-circle');
    const statusText = document.getElementById('status-text');
    const powerHourList = document.getElementById('power-hour-list');
    const errorMessage = document.getElementById('error-message');
    const h1Title = document.querySelector('h1');
    const timerLabel = document.getElementById('timer-label');
    const statusTimer = document.getElementById('status-timer');

    const processingDateString = getDateForProcessing(selectedDateType);
    const currentHour = new Date().getHours();

    console.log(`Processing data for date type: ${selectedDateType}, date: ${processingDateString}`);
    h1Title.textContent = selectedDateType === 'today' ? "Is het al Power Hour?" : "Wordt het Power Hour?";

    const dataForSelectedDay = data.filter(entry => entry.readingDate === processingDateString);

    powerHourList.innerHTML = '';
    statusCircle.className = 'status-circle';
    errorMessage.style.display = 'none';

    if (dataForSelectedDay.length === 0) {
        console.log(`No data available for ${processingDateString}.`);
        statusText.textContent = "Info";
        statusCircle.classList.add('status-nee');
        const listItem = document.createElement('li');
        listItem.textContent = `Geen energieprijsdata beschikbaar voor ${selectedDateType === 'today' ? 'vandaag' : 'morgen'}.`;
        powerHourList.appendChild(listItem);
        updateTimers("NEE", [], selectedDateType);
        return;
    }

    const powerHoursForSelectedDay = dataForSelectedDay
        .filter(entry => parseFloat(entry.price) <= 0)
        .map(entry => ({
            startHour: parseInt(entry.readingHour, 10),
            endHour: parseInt(entry.readingHour, 10) + 1,
            price: parseFloat(entry.price)
        }))
        .sort((a, b) => a.startHour - b.startHour);

    console.log(`Power Hours for ${processingDateString}:`, powerHoursForSelectedDay);

    let currentStatus = "NEE";
    let activePHDetails = null;
    let nextPHDetails = null;

    if (selectedDateType === 'today') {
        for (const ph of powerHoursForSelectedDay) {
            if (ph.startHour <= currentHour && currentHour < ph.endHour) {
                currentStatus = "NU";
                activePHDetails = ph;
                break;
            }
            if (ph.startHour > currentHour) {
                if (currentStatus !== "NU") {
                    currentStatus = "OVER";
                    nextPHDetails = ph;
                }
                break;
            }
        }
        if (currentStatus === "NEE" && powerHoursForSelectedDay.length > 0 && powerHoursForSelectedDay[powerHoursForSelectedDay.length - 1].endHour <= currentHour) {
            currentStatus = "NEE";
        } else if (currentStatus === "NEE" && powerHoursForSelectedDay.some(ph => ph.startHour > currentHour)) {
            currentStatus = "OVER";
            if (!nextPHDetails) nextPHDetails = powerHoursForSelectedDay.find(ph => ph.startHour > currentHour);
        }
    } else {
        currentStatus = powerHoursForSelectedDay.length > 0 ? "OVER" : "NEE";
    }

    console.log("Current Status:", currentStatus);

    statusText.textContent = currentStatus;
    statusCircle.classList.remove('status-nu', 'status-over', 'status-nee');
    if (currentStatus === "NU") statusCircle.classList.add('status-nu');
    else if (currentStatus === "OVER") statusCircle.classList.add('status-over');
    else statusCircle.classList.add('status-nee');

    if (selectedDateType === 'tomorrow' && currentStatus !== 'OVER') {
        timerLabel.style.display = 'none';
        statusTimer.style.display = 'none';
    } else {
        timerLabel.style.display = 'block';
        statusTimer.style.display = 'block';
    }

    if (powerHoursForSelectedDay.length > 0) {
        powerHoursForSelectedDay.forEach(ph => {
            const listItem = document.createElement('li');
            let content = `${String(ph.startHour).padStart(2, '0')}:00 - ${String(ph.endHour).padStart(2, '0')}:00 (Prijs: ${ph.price.toFixed(3)})`;
            if (selectedDateType === 'today') {
                if (currentStatus === "NU" && activePHDetails && ph.startHour === activePHDetails.startHour) {
                    listItem.classList.add('active-power-hour');
                    content += ` <span class="active-label">Actief</span>`;
                } else if (currentStatus === "OVER" && nextPHDetails && ph.startHour === nextPHDetails.startHour) {
                    listItem.classList.add('next-power-hour');
                    content += ` <span class="next-label">Volgende</span>`;
                }
            } else if (currentStatus === "OVER" && ph.startHour === powerHoursForSelectedDay[0].startHour) {
                listItem.classList.add('next-power-hour');
                content += ` <span class="next-label">Eerste</span>`;
            }
            listItem.innerHTML = content;
            powerHourList.appendChild(listItem);
        });
    } else {
        const listItem = document.createElement('li');
        listItem.textContent = `Geen Power Hours ${selectedDateType === 'today' ? 'vandaag' : 'morgen'} (prijs <= 0).`;
        powerHourList.appendChild(listItem);
    }
    updateTimers(currentStatus, powerHoursForSelectedDay, selectedDateType);
}

function fetchEnergyPrices() {
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessageDisplay = document.getElementById('error-message');

    if (loadingIndicator) loadingIndicator.classList.add('show');
    if (errorMessageDisplay) errorMessageDisplay.style.display = 'none';

    const uiElementsToClear = [
        document.getElementById('status-text'),
        document.getElementById('power-hour-list'),
        document.getElementById('timer-label'),
        document.getElementById('status-timer')
    ];
    const statusCircle = document.getElementById('status-circle');
    if(statusCircle) statusCircle.className = 'status-circle';

    uiElementsToClear.forEach(el => { if (el) el.innerHTML = ''; });
    
    if (activeCountdownInterval) {
        clearInterval(activeCountdownInterval);
        activeCountdownInterval = null;
    }

    if (useDummyData) {
        console.log("Using Dummy Data");
        const dummyData = generateDynamicDummyData();
        cachedEnergyData = dummyData; // Cache dummy data
        setTimeout(() => {
            if (loadingIndicator) loadingIndicator.classList.remove('show');
            processEnergyData(dummyData);
        }, 500); // Simulate loading delay
        return;
    }

    console.log("Fetching Live Data");
    fetch('https://data.newground.nl/nl_energy_prices.json')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            cachedEnergyData = data;
            if (loadingIndicator) loadingIndicator.classList.remove('show');
            processEnergyData(cachedEnergyData);
        })
        .catch(error => {
            if (loadingIndicator) loadingIndicator.classList.remove('show');
            if (errorMessageDisplay) {
                errorMessageDisplay.style.display = 'block';
                errorMessageDisplay.textContent = 'Failed to load energy data. Please try again later.';
            }
            console.error('Error fetching energy prices:', error);
            cachedEnergyData = null;
            if(statusCircle) statusCircle.classList.add('status-nee');
            const statusText = document.getElementById('status-text');
            if(statusText) statusText.textContent = "Error";
            updateTimers("NEE", [], selectedDateType);
        });
}

document.addEventListener('DOMContentLoaded', () => {
    const tabToday = document.getElementById('tab-today');
    const tabTomorrow = document.getElementById('tab-tomorrow');
    const dummyDataToggle = document.getElementById('dummy-data-toggle');

    tabToday.addEventListener('click', () => {
        if (selectedDateType === 'today') return;
        selectedDateType = 'today';
        tabToday.classList.add('active');
        tabTomorrow.classList.remove('active');
        // If using dummy data, it's already cached. Otherwise, process real cache or fetch.
        if (useDummyData) processEnergyData(cachedEnergyData); // Re-process cached dummy data for today
        else if (cachedEnergyData && !useDummyData) processEnergyData(cachedEnergyData); // Re-process cached live data
        else fetchEnergyPrices();
    });

    tabTomorrow.addEventListener('click', () => {
        if (selectedDateType === 'tomorrow') return;
        selectedDateType = 'tomorrow';
        tabTomorrow.classList.add('active');
        tabToday.classList.remove('active');
        if (useDummyData) processEnergyData(cachedEnergyData); // Re-process cached dummy data for tomorrow
        else if (cachedEnergyData && !useDummyData) processEnergyData(cachedEnergyData); // Re-process cached live data
        else fetchEnergyPrices();
    });

    dummyDataToggle.addEventListener('change', () => {
        useDummyData = dummyDataToggle.checked;
        console.log("Dummy data mode:", useDummyData);
        cachedEnergyData = null; // Clear cache when switching modes
        fetchEnergyPrices(); // Reload data with new mode
    });

    fetchEnergyPrices(); // Initial fetch
    setInterval(fetchEnergyPrices, 300000); // Refresh data every 5 minutes
});
