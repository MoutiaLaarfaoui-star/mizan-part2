import { pourcentage } from './estimator.js';
import { getSpotApi, getChartApi } from './api.js';
import { url, request } from './part2.js';

const gold = document.getElementById('gold-price');
const silver = document.getElementById('silver-price');
const updated = document.getElementById('updated');
const goldchg = document.getElementById('gold-chg');
const silverchg = document.getElementById('silver-chg');
const currency = document.getElementById('currency');
const chart = document.getElementById('chart');
const date = document.getElementById('date');
const estimate = document.getElementById('estimate');
const weight = document.getElementById('weight');
const metal = document.getElementById('metal');

const getApiMAD = await getSpotApi("MAD");
const getApiUSD = await getSpotApi("USD");
const getApiEUR = await getSpotApi("EUR");

const silverPriceUSD = getApiUSD.silver_usd_oz / 31.1035;

const dernierPriceG = await getChartApi("xau", 30);
const dernierPriceS = await getChartApi("silver", 30);

const len = dernierPriceG.points.length - 1;

const dernier = pourcentage(getApiUSD.xau.price.toFixed(4), (dernierPriceG.points[len].c.toFixed(4) / 31.1035));
const dernierS = pourcentage(silverPriceUSD.toFixed(4), (dernierPriceS.points[len].c.toFixed(4) / 31.1035));

const baseGldUSD = getApiUSD.xau.price.toFixed(4) - (dernierPriceG.points[len].c.toFixed(4) / 31.1035);
const baseSlvUSD = silverPriceUSD.toFixed(4) - (dernierPriceS.points[len].c.toFixed(4) / 31.1035);

let currentCurrency = localStorage.getItem("KEY") || "USD";
if (currency) {
    currency.value = currentCurrency;
}

let gld = baseGldUSD;
let slv = baseSlvUSD;

function getActivePrices() {
    if (currentCurrency === "MAD") {
        return {
            goldPrice: getApiMAD.xau.price,
            silverPrice: silverPriceUSD * getApiMAD.fx_rate,
            gldChg: baseGldUSD * getApiMAD.fx_rate,
            slvChg: baseSlvUSD * getApiMAD.fx_rate
        };
    } else if (currentCurrency === "EUR") {
        return {
            goldPrice: getApiEUR.xau.price,
            silverPrice: silverPriceUSD * getApiEUR.fx_rate,
            gldChg: baseGldUSD * getApiEUR.fx_rate,
            slvChg: baseSlvUSD * getApiEUR.fx_rate
        };
    }
    return {
        goldPrice: getApiUSD.xau.price,
        silverPrice: silverPriceUSD,
        gldChg: baseGldUSD,
        slvChg: baseSlvUSD
    };
}

function updateGoldSilverUI() {
    if (!gold || !silver || !goldchg || !silverchg) return;

    if (updated && getApiMAD?.updated_at) {
        updated.textContent = getApiMAD.updated_at.slice(11, 19);
    }

    const prices = getActivePrices();
    gold.textContent = `${prices.goldPrice} ${currentCurrency}`;
    silver.textContent = `${prices.silverPrice.toFixed(4)} ${currentCurrency}`;

    gld = prices.gldChg;
    slv = prices.slvChg;

    if (dernier.toFixed(4) > 0) {
        goldchg.className = 'text-green-700';
        goldchg.textContent = `(+${gld.toFixed(4)}) ▲ +${dernier.toFixed(4)}%`;
    } else {
        goldchg.className = 'text-red-700';
        goldchg.textContent = `(${gld.toFixed(4)}) ▼ ${dernier.toFixed(4)}%`;
    }

    if (dernierS.toFixed(4) > 0) {
        silverchg.className = 'text-green-700';
        silverchg.textContent = `(+${slv.toFixed(4)}) ▲ +${dernierS.toFixed(4)}%`;
    } else {
        silverchg.className = 'text-red-700';
        silverchg.textContent = `(${slv.toFixed(4)}) ▼ ${dernierS.toFixed(4)}%`;
    }
}

function dessinerMibyan(pointsG, pointsS, d) {
    if (!chart) return;
    chart.innerHTML = '';

    const sliceG = (Array.isArray(pointsG) ? pointsG : pointsG?.points)?.slice(d) || [];
    const sliceS = (Array.isArray(pointsS) ? pointsS : pointsS?.points)?.slice(d) || [];

    if (sliceG.length === 0 || sliceS.length === 0) {
        chart.innerHTML = '<div class="text-xs text-gray-400 m-auto">Aucune donnée disponible</div>';
        return;
    }

    const length = Math.min(sliceG.length, sliceS.length);
    const valuesG = sliceG.map(p => p?.c || 0);
    const valuesS = sliceS.map(p => p?.c || 0);

    const minG = Math.min(...valuesG), maxG = Math.max(...valuesG);
    const minS = Math.min(...valuesS), maxS = Math.max(...valuesS);
    const rangeG = maxG - minG || 1;
    const rangeS = maxS - minS || 1;

    for (let i = 0; i < length; i++) {
        const pointG = sliceG[i];
        const pointS = sliceS[i];

        const valeurG = pointG?.c || 0;
        const valeurS = pointS?.c || 0;

        const dateObj = new Date((pointG?.t || pointS?.t || 0) * 1000);
        const dateStr = !isNaN(dateObj) ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

        const column = document.createElement('div');
        column.className = 'flex items-end gap-1 h-full w-6 flex-shrink-0 group relative';

        const divG = document.createElement('div');
        divG.className = 'w-1.5 bg-yellow-500 rounded-t transition-all hover:opacity-80';
        divG.style.height = `${Math.max(((valeurG - minG) / rangeG) * 85 + 15, 10)}%`;
        divG.title = `${dateStr} - Gold: ${valeurG}$`;

        const divS = document.createElement('div');
        divS.className = 'w-1.5 bg-gray-400 rounded-t transition-all hover:opacity-80';
        divS.style.height = `${Math.max(((valeurS - minS) / rangeS) * 85 + 10, 10)}%`;
        divS.title = `${dateStr} - Silver: ${valeurS}$`;

        column.appendChild(divG);
        column.appendChild(divS);
        chart.appendChild(column);
    }
}

function calculateEstimate() {
    if (!weight || !metal || !estimate) return;

    const w = parseFloat(weight.value) || 0;
    const m = metal.value;
    const prices = getActivePrices();

    const price = m === "gold" ? prices.goldPrice : prices.silverPrice;
    estimate.textContent = `${(w * price).toFixed(4)} ${currentCurrency}`;
}

if (currency) {
    currency.addEventListener('change', () => {
        currentCurrency = currency.value;
        localStorage.setItem("KEY", currentCurrency);
        updateGoldSilverUI();
        calculateEstimate();
    });
}

if (date) {
    date.addEventListener('change', () => {
        const nbJours = date.value === '1mois' ? -30 : -7;
        dessinerMibyan(dernierPriceG, dernierPriceS, nbJours);
    });
}

if (metal && weight) {
    metal.addEventListener('change', calculateEstimate);
    weight.addEventListener('input', calculateEstimate);
}

updateGoldSilverUI();
dessinerMibyan(dernierPriceG, dernierPriceS, -7);
calculateEstimate();

const titel = document.getElementById('input1');
const poids = document.getElementById('input2');
const price = document.getElementById('input3');
const ref = document.getElementById('input4');
const btn = document.getElementById('btn');
const eror = document.getElementById('titelError')

if (btn && titel && poids && price && ref) {
    btn.addEventListener('click', async () => {
        const titleValue = titel.value.trim();
        const poid = poids.value.trim();
        const pric = price.value.trim();
        const refr = ref.value.trim();

        if (titleValue === '' || poid === '' || pric === '' || refr === '') {
            
            eror.classList.remove('hidden')

            console.warn('Le titre est obligatoire');
            return;
        }

        const newItem = {
            title: titleValue,
            poid: poid,
            price: pric,
            ref: refr
        };

        try {
            const data = await request(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newItem)
            });

            console.log('Data added to db.json:', data);

            titel.value = '';
            poids.value = '';
            price.value = '';
            ref.value = '';
        } catch (error) {
            console.error(`Erreur [${error.type || 'unknown'}]:`, error.message);
        }
    });
} 

    



