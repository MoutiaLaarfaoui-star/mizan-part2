const API_URL = 'http://localhost:3000/product';

    const RATES_FROM_MAD = {
      MAD: 1,
      USD: 0.1,
      EUR: 0.092
    };

    const container = document.getElementById('products-container');
    const titleInput = document.getElementById('input1');
    const weightInput = document.getElementById('input2');
    const priceInput = document.getElementById('input3');
    const refInput = document.getElementById('input4');
    const metalInput = document.getElementById('inputMetal');
    const errorEl = document.getElementById('titelError');
    const saveBtn = document.getElementById('btn');
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');
    const sortSelect = document.getElementById('sortSelect');
    const currencySelect = document.getElementById('currency');
    const refreshBtn = document.getElementById('refresh');

    let allProducts = [];

    function formatPrice(priceInMad) {
      const currency = currencySelect.value;
      const rate = RATES_FROM_MAD[currency] ?? 1;
      const numeric = Number(priceInMad) || 0;
      const converted = (numeric * rate).toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      return `${converted} ${currency}`;
    }

    function detectMetal(item) {
      const rawMetal = String(item.metal ?? '').toLowerCase();
      const text = `${item.title ?? ''} ${item.ref ?? ''}`.toLowerCase();
      if (rawMetal.includes('silver') || rawMetal.includes('argent') || text.includes('argent') || text.includes('silver')) {
        return 'silver';
      }
      return 'gold';
    }

    function createProductCard(item) {
      const metal = detectMetal(item);
      const isSilver = metal === 'silver';

      const card = document.createElement('div');
      card.className = 'bg-white border border-line rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition group';

      const topSection = document.createElement('div');
      topSection.className = 'flex flex-col gap-4';

      const visualBox = document.createElement('div');
      visualBox.className = 'h-44 bg-paper rounded-xl flex items-center justify-center border border-line/60 relative overflow-hidden';

      const badge = document.createElement('span');
      badge.className = isSilver
        ? 'absolute top-3 left-3 bg-slate-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase'
        : 'absolute top-3 left-3 bg-gold text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase';
      badge.textContent = isSilver ? 'Argent Pur' : 'Or Pur 24K';

      const ingot = document.createElement('div');
      ingot.className = isSilver
        ? 'w-16 h-24 bg-gradient-to-br from-slate-300 to-slate-500 rounded shadow-md transform group-hover:scale-105 transition duration-300 flex items-center justify-center text-ink font-serif font-bold text-xs'
        : 'w-16 h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded shadow-md transform group-hover:scale-105 transition duration-300 flex items-center justify-center text-white font-serif font-bold text-xs';
      ingot.textContent = `${item.poid ?? ''}g`;

      visualBox.append(badge, ingot);

      const infoBox = document.createElement('div');

      const title = document.createElement('h3');
      title.className = 'font-serif text-lg font-bold text-ink';
      title.textContent = item.title ?? 'Sans titre';

      const details = document.createElement('p');
      details.className = 'text-xs text-gray-500 mt-1';
      details.textContent = `Poids : ${item.poid ?? ''} Grammes • Ref: ${item.ref ?? ''}`;

      infoBox.append(title, details);
      topSection.append(visualBox, infoBox);

      const footer = document.createElement('div');
      footer.className = 'mt-6 pt-4 border-t border-line flex items-center justify-between';

      const priceBox = document.createElement('div');

      const priceLabel = document.createElement('span');
      priceLabel.className = 'text-[10px] uppercase text-gray-400 block font-semibold';
      priceLabel.textContent = 'Prix estimé';

      const priceValue = document.createElement('span');
      priceValue.className = 'font-serif text-lg font-bold text-gold';
      priceValue.textContent = formatPrice(item.price);

      priceBox.append(priceLabel, priceValue);

      const remvBtn = document.createElement('button');
      remvBtn.type = 'button';
      remvBtn.className = 'bg-green-500 hover:bg-green-600 text-white text-xs px-4 py-2.5 rounded-xl transition font-medium';
      remvBtn.textContent = 'modifier';

      const buyBtn = document.createElement('button');
      buyBtn.type = 'button';
      buyBtn.className = 'bg-red-500 hover:bg-red-600 text-white text-xs px-4 py-2.5 rounded-xl transition font-medium';
      buyBtn.textContent = 'supprimer';
      buyBtn.addEventListener('click', () => {
        console.log('Selected item:', item);
      });

      footer.append(priceBox, buyBtn, remvBtn);
      card.append(topSection, footer);

      return card;
    }

    function renderProducts() {
      const query = searchInput.value.trim().toLowerCase();
      const filterValue = filterSelect.value;
      const sortValue = sortSelect.value;

      let filtered = allProducts.filter((item) => {
        const metal = detectMetal(item);
        const matchesFilter = filterValue === 'all' || metal === filterValue;
        const matchesQuery =
          !query ||
          String(item.title ?? '').toLowerCase().includes(query) ||
          String(item.ref ?? '').toLowerCase().includes(query) ||
          String(item.poid ?? '').toLowerCase().includes(query);
        return matchesFilter && matchesQuery;
      });

      if (sortValue === 'price-asc') {
        filtered = [...filtered].sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0));
      } else if (sortValue === 'price-desc') {
        filtered = [...filtered].sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0));
      } else if (sortValue === 'name') {
        filtered = [...filtered].sort((a, b) =>
          String(a.title ?? '').localeCompare(String(b.title ?? ''), 'fr')
        );
      }

      if (filtered.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'col-span-full text-center text-sm text-gray-500 py-8';
        empty.textContent = 'Aucun produit trouvé.';
        container.replaceChildren(empty);
        return;
      }

      container.replaceChildren(...filtered.map(createProductCard));
    }

    async function loadProducts() {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        allProducts = Array.isArray(data) ? data : [];
        renderProducts();
      } catch (err) {
        console.error('Load error:', err);
        const errMsg = document.createElement('p');
        errMsg.className = 'col-span-full text-center text-sm text-red-500 py-8';
        errMsg.textContent = 'Impossible de charger les produits (vérifiez le serveur sur le port 3000).';
        container.replaceChildren(errMsg);
      }
    }

    async function handleCreateProduct() {
      const title = titleInput.value.trim();
      const poid = parseFloat(weightInput.value);
      const price = parseFloat(priceInput.value);
      const ref = refInput.value.trim();
      const metal = metalInput.value;

      if (!title || Number.isNaN(poid) || poid <= 0 || Number.isNaN(price) || price <= 0) {
        errorEl.classList.remove('hidden');
        return;
      }

      errorEl.classList.add('hidden');

      const newProduct = { title, poid, price, ref, metal };

      try {
        saveBtn.disabled = true;
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProduct)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        titleInput.value = '';
        weightInput.value = '';
        priceInput.value = '';
        refInput.value = '';

        await loadProducts();
      } catch (err) {
        console.error('Create error:', err);
        errorEl.textContent = "Erreur lors de l'enregistrement du produit.";
        errorEl.classList.remove('hidden');
      } finally {
        saveBtn.disabled = false;
      }
    }

    saveBtn.addEventListener('click', handleCreateProduct);
    searchInput.addEventListener('input', renderProducts);
    filterSelect.addEventListener('change', renderProducts);
    sortSelect.addEventListener('change', renderProducts);
    currencySelect.addEventListener('change', renderProducts);
    refreshBtn.addEventListener('click', loadProducts);

    loadProducts();