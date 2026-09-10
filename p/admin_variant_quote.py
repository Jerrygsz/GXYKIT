import re

# Read the file
with open('D:/GitHub/GXYKIT/p/admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add CSS for variant selection in quote page
# Insert after .select-card .sc-price { ... }
css_insert = '''.select-card .sc-price { font-weight: 600; color: var(--accent); font-size: 0.9rem; }

/* Variant selection in quote page */
.variant-subgrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 8px;
  padding: 8px 12px 12px;
  margin: -4px -12px 0;
  background: var(--bg);
  border-radius: 0 0 var(--radius) var(--radius);
}
.variant-subcard {
  background: var(--bg-card);
  border-radius: 8px;
  padding: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}
.variant-subcard:hover { border-color: var(--accent); }
.variant-subcard.selected { border-color: var(--accent); background: rgba(0,113,227,0.03); }
.variant-subcard .vcheck {
  position: absolute; top: 4px; right: 4px; width: 16px; height: 16px;
  border: 2px solid var(--text-ter); border-radius: 3px; display: flex;
  align-items: center; justify-content: center; font-size: 0.6rem; color: #fff;
}
.variant-subcard.selected .vcheck { background: var(--accent); border-color: var(--accent); }
.variant-subcard img { width: 100%; height: 80px; object-fit: contain; margin-bottom: 4px; }
.variant-subcard .v-model { font-weight: 600; font-size: 0.8rem; }
.variant-subcard .v-diff { font-size: 0.7rem; color: var(--text-sec); line-height: 1.3; }

/* Variant params in cart */
.cart-item-params {
  font-size: 0.7rem;
  color: var(--text-sec);
  line-height: 1.4;
  margin-top: 2px;
}
'''

content = content.replace(
    '.select-card .sc-price { font-weight: 600; color: var(--accent); font-size: 0.9rem; }',
    css_insert.strip()
)

# 2. Add mergeVariant helper function after cart array initialization
# Find: let cart = [];
merge_func = '''function mergeVariant(p, vIdx) {
  if (vIdx === null || vIdx === undefined || !p.options || !p.options[vIdx]) return p;
  const v = p.options[vIdx];
  const merged = JSON.parse(JSON.stringify(p));
  Object.keys(v).forEach(k => {
    if (k === 'image' && !v[k]) return; // keep parent image if variant has none
    merged[k] = v[k];
  });
  return merged;
}

function getCartItem(c) {
  const p = products[c.idx];
  return mergeVariant(p, c.variantIdx);
}

function cartKey(c) {
  return c.idx + '-' + (c.variantIdx !== null && c.variantIdx !== undefined ? c.variantIdx : 'P');
}
'''

content = content.replace(
    'let cart = [];',
    'let cart = [];\n\n' + merge_func.strip()
)

# 3. Replace renderQuoteProducts function
old_render = '''function renderQuoteProducts() {
  const list = getQuoteFiltered();
  const grid = document.getElementById('selectGrid');
  grid.innerHTML = '';
  list.forEach((p, idx) => {
    const realIdx = products.indexOf(p);
    const inCart = cart.find(c => c.idx === realIdx);
    const card = document.createElement('div');
    card.className = 'select-card' + (inCart ? ' selected' : '');
    card.onclick = () => toggleCart(realIdx);
    const price = p.p_sample || p.p_500 || '-';
    card.innerHTML =
      '<div class="check">' + (inCart ? '&#10003;' : '') + '</div>' +
      '<img src="' + (p.image || '') + '" alt="' + p.model + '" onerror="this.style.display=\\'none\\'">' +
      '<div class="sc-model">' + p.model + '</div>' +
      '<div class="sc-type">' + (p.type_en || p.category) + '</div>' +
      '<div class="sc-price">' + (price !== '-' ? 'Sample: ' + price + ' RMB' : 'Price on request') + '</div>';
    grid.appendChild(card);
  });
}'''

new_render = '''function renderQuoteProducts() {
  const list = getQuoteFiltered();
  const grid = document.getElementById('selectGrid');
  grid.innerHTML = '';
  list.forEach((p, idx) => {
    const realIdx = products.indexOf(p);
    const hasVariants = p.options && p.options.length > 0;
    // Parent card
    const parentInCart = cart.find(c => c.idx === realIdx && c.variantIdx === null);
    const card = document.createElement('div');
    card.className = 'select-card' + (parentInCart ? ' selected' : '');
    const price = p.p_sample || p.p_500 || '-';
    card.innerHTML =
      '<div class="check">' + (parentInCart ? '&#10003;' : '') + '</div>' +
      '<img src="' + (p.image || '') + '" alt="' + p.model + '" onerror="this.style.display=\\'none\\'">' +
      '<div class="sc-model">' + p.model + '</div>' +
      '<div class="sc-type">' + (p.type_en || p.category) + '</div>' +
      '<div class="sc-price">' + (price !== '-' ? 'Sample: ' + price + ' RMB' : 'Price on request') + '</div>';
    if (!hasVariants) {
      card.onclick = () => toggleCart(realIdx, null);
    } else {
      // Click parent to expand/collapse variants, not add to cart
      card.dataset.expanded = card.dataset.expanded || 'false';
      card.onclick = function() {
        const expanded = card.dataset.expanded === 'true';
        card.dataset.expanded = expanded ? 'false' : 'true';
        const sub = card.querySelector('.variant-subgrid');
        if (sub) sub.style.display = expanded ? 'none' : 'grid';
        else renderVariantSubgrid(card, realIdx);
      };
    }
    grid.appendChild(card);
    // If already expanded, render subgrid
    if (hasVariants && card.dataset.expanded === 'true') {
      renderVariantSubgrid(card, realIdx);
    }
  });
}

function renderVariantSubgrid(parentCard, parentIdx) {
  const p = products[parentIdx];
  if (!p.options || p.options.length === 0) return;
  let sub = parentCard.querySelector('.variant-subgrid');
  if (sub) { sub.style.display = 'grid'; return; }
  sub = document.createElement('div');
  sub.className = 'variant-subgrid';
  p.options.forEach((v, vIdx) => {
    const inCart = cart.find(c => c.idx === parentIdx && c.variantIdx === vIdx);
    const vCard = document.createElement('div');
    vCard.className = 'variant-subcard' + (inCart ? ' selected' : '');
    vCard.onclick = (e) => { e.stopPropagation(); toggleCart(parentIdx, vIdx); };
    const diff = [];
    if (v.ports && v.ports !== p.ports) diff.push('Ports: ' + v.ports);
    if (v.bt && v.bt !== p.bt) diff.push('BT: ' + v.bt);
    if (v.power && v.power !== p.power) diff.push('Power: ' + v.power);
    if (v.fm && v.fm !== p.fm) diff.push('FM: ' + v.fm);
    if (v.features && v.features !== p.features) diff.push(v.features.split(',')[0]);
    const vPrice = v.p_sample || v.p_500 || p.p_sample || p.p_500 || '-';
    vCard.innerHTML =
      '<div class="vcheck">' + (inCart ? '&#10003;' : '') + '</div>' +
      '<img src="' + (v.image || p.image || '') + '" alt="' + v.model + '" onerror="this.style.display=\\'none\\'">' +
      '<div class="v-model">' + v.model + '</div>' +
      '<div class="v-diff">' + (diff.length ? diff.join(' | ') : 'Standard') + '<br>' +
      (vPrice !== '-' ? vPrice + ' RMB' : 'Price on request') + '</div>';
    sub.appendChild(vCard);
  });
  parentCard.appendChild(sub);
}'''

content = content.replace(old_render, new_render)

# 4. Replace toggleCart function
old_toggle = '''function toggleCart(idx) {
  const existing = cart.find(c => c.idx === idx);
  if (existing) {
    cart = cart.filter(c => c.idx !== idx);
  } else {
    cart.push({ idx: idx, qty: 100, priceTier: 'p_500' });
  }
  renderQuoteProducts();
  renderCart();
}'''

new_toggle = '''function toggleCart(idx, variantIdx) {
  const key = idx + '-' + (variantIdx !== null && variantIdx !== undefined ? variantIdx : 'P');
  const existing = cart.find(c => cartKey(c) === key);
  if (existing) {
    cart = cart.filter(c => cartKey(c) !== key);
  } else {
    cart.push({ idx: idx, variantIdx: variantIdx !== undefined ? variantIdx : null, qty: 100, priceTier: 'p_500' });
  }
  renderQuoteProducts();
  renderCart();
}'''

content = content.replace(old_toggle, new_toggle)

# 5. Replace renderCart function
old_cart = '''function renderCart() {
  const container = document.getElementById('cartItems');
  document.getElementById('cartCount').textContent = cart.length;
  if (cart.length === 0) {
    container.innerHTML = '<div class="cart-empty">No products selected.<br>Click products to add.</div>';
    return;
  }
  let html = '';
  cart.forEach((c, i) => {
    const p = products[c.idx];
    html += '<div class="cart-item">' +
      '<img class="cart-item-img" src="' + (p.image || '') + '" onerror="this.style.display=\\'none\\'">' +
      '<div class="cart-item-info">' +
      '<div class="cart-item-model">' + p.model + '</div>' +
      '<div class="cart-item-type">' + (p.type_en || p.category) + '</div>' +
      '</div>' +
      '<div class="cart-item-qty">' +
      '<button onclick="changeQty(' + i + ', -1)">-</button>' +
      '<input type="number" value="' + c.qty + '" min="1" onchange="setQty(' + i + ', this.value)">' +
      '<button onclick="changeQty(' + i + ', 1)">+</button>' +
      '</div>' +
      '<button class="cart-item-rm" onclick="removeCart(' + i + ')">Remove</button>' +
      '</div>';
  });
  container.innerHTML = html;
}'''

new_cart = '''function renderCart() {
  const container = document.getElementById('cartItems');
  document.getElementById('cartCount').textContent = cart.length;
  if (cart.length === 0) {
    container.innerHTML = '<div class="cart-empty">No products selected.<br>Click products to add.</div>';
    return;
  }
  let html = '';
  cart.forEach((c, i) => {
    const item = getCartItem(c);
    const isVariant = c.variantIdx !== null && c.variantIdx !== undefined;
    const params = [];
    if (item.bt) params.push('BT: ' + item.bt);
    if (item.power) params.push('Power: ' + item.power);
    if (item.ports) params.push('Ports: ' + item.ports);
    if (item.dim) params.push('Dim: ' + item.dim);
    const price = parseFloat(item[c.priceTier] || item.p_sample || item.p_500 || 0) || 0;
    html += '<div class="cart-item">' +
      '<img class="cart-item-img" src="' + (item.image || '') + '" onerror="this.style.display=\\'none\\'">' +
      '<div class="cart-item-info">' +
      '<div class="cart-item-model">' + item.model + (isVariant ? ' <span style="color:var(--accent);font-size:0.75rem">(Variant)</span>' : '') + '</div>' +
      '<div class="cart-item-type">' + (item.type_en || item.category) + '</div>' +
      '<div class="cart-item-params">' + params.join(' | ') + '</div>' +
      '</div>' +
      '<div class="cart-item-qty">' +
      '<button onclick="changeQty(' + i + ', -1)">-</button>' +
      '<input type="number" value="' + c.qty + '" min="1" onchange="setQty(' + i + ', this.value)">' +
      '<button onclick="changeQty(' + i + ', 1)">+</button>' +
      '</div>' +
      '<button class="cart-item-rm" onclick="removeCart(' + i + ')">Remove</button>' +
      '</div>';
  });
  container.innerHTML = html;
}'''

content = content.replace(old_cart, new_cart)

# 6. Replace generateQuote function rows generation
old_quote_rows = '''  cart.forEach(c => {
    const p = products[c.idx];
    const price = parseFloat(p[c.priceTier] || p.p_sample || p.p_500 || 0) || 0;
    const lineTotal = price * c.qty;
    total += lineTotal;
    rows += '<tr>' +
      '<td class="q-model">' + p.model + '</td>' +
      '<td>' + (p.type_en || p.category) + '</td>' +
      '<td>' + (p.desc || '-') + '</td>' +
      '<td class="q-qty">' + c.qty + '</td>' +
      '<td class="q-price">' + (price ? price.toFixed(2) : '-') + '</td>' +
      '<td class="q-total">' + (lineTotal ? lineTotal.toFixed(2) : '-') + '</td>' +
      '<td style="font-size:0.75rem;color:var(--text-sec)">' + (p.box_dim || '-') + '<br>' + (p.box_weight || '-') + 'g</td>' +
      '<td style="font-size:0.75rem;color:var(--text-sec)">' + (p.carton_dim || '-') + '<br>' + (p.carton_weight || '-') + 'kg</td>' +
      '</tr>';
  });'''

new_quote_rows = '''  cart.forEach(c => {
    const item = getCartItem(c);
    const price = parseFloat(item[c.priceTier] || item.p_sample || item.p_500 || 0) || 0;
    const lineTotal = price * c.qty;
    total += lineTotal;
    const params = [];
    if (item.bt) params.push('BT: ' + item.bt);
    if (item.power) params.push('Power: ' + item.power);
    if (item.ports) params.push('Ports: ' + item.ports);
    if (item.dim) params.push('Dim: ' + item.dim);
    rows += '<tr>' +
      '<td class="q-model">' + item.model + '</td>' +
      '<td>' + (item.type_en || item.category) + '</td>' +
      '<td>' + (item.desc || '-') + '<br><span style="font-size:0.75rem;color:var(--text-sec)">' + params.join(' | ') + '</span></td>' +
      '<td class="q-qty">' + c.qty + '</td>' +
      '<td class="q-price">' + (price ? price.toFixed(2) : '-') + '</td>' +
      '<td class="q-total">' + (lineTotal ? lineTotal.toFixed(2) : '-') + '</td>' +
      '<td style="font-size:0.75rem;color:var(--text-sec)">' + (item.box_dim || '-') + '<br>' + (item.box_weight || '-') + 'g</td>' +
      '<td style="font-size:0.75rem;color:var(--text-sec)">' + (item.carton_dim || '-') + '<br>' + (item.carton_weight || '-') + 'kg</td>' +
      '</tr>';
  });'''

content = content.replace(old_quote_rows, new_quote_rows)

# 7. Replace exportQuoteExcel rows generation
old_excel = '''  cart.forEach(c => {
    const p = products[c.idx];
    const price = parseFloat(p[c.priceTier] || p.p_sample || p.p_500 || 0) || 0;
    const lineTotal = price * c.qty;
    total += lineTotal;
    wsData.push([
      p.model,
      p.type_en || p.category,
      p.desc || '-',
      c.qty,
      price || '-',
      lineTotal || '-',
      p.box_dim || '-',
      p.box_weight || '-',
      p.carton_dim || '-',
      p.carton_weight || '-'
    ]);
  });'''

new_excel = '''  cart.forEach(c => {
    const item = getCartItem(c);
    const price = parseFloat(item[c.priceTier] || item.p_sample || item.p_500 || 0) || 0;
    const lineTotal = price * c.qty;
    total += lineTotal;
    const paramText = [item.bt && 'BT:' + item.bt, item.power && 'Power:' + item.power, item.ports && 'Ports:' + item.ports, item.dim && 'Dim:' + item.dim].filter(Boolean).join(' | ');
    wsData.push([
      item.model,
      item.type_en || item.category,
      (item.desc || '-') + (paramText ? ' (' + paramText + ')' : ''),
      c.qty,
      price || '-',
      lineTotal || '-',
      item.box_dim || '-',
      item.box_weight || '-',
      item.carton_dim || '-',
      item.carton_weight || '-'
    ]);
  });'''

content = content.replace(old_excel, new_excel)

# Write the modified file
with open('D:/GitHub/GXYKIT/p/admin.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done! File updated successfully.')
