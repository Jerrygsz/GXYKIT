
// ===== DATA =====
const STORAGE_KEY = 'gxykit_products_v1';
const STORAGE_VERSION_KEY = 'gxykit_data_version';
const IMG_PREFIX = 'gxykit_img_';
const DATA_VERSION_JS = (typeof DATA_VERSION !== 'undefined') ? DATA_VERSION : 'unknown';
const DEFAULT_PRODUCTS = PRODUCTS || [];
let products = [];
let editingId = null;
let cart = [];
function mergeVariant(p, vIdx) {
  if (vIdx === null || vIdx === undefined || !p.options || !p.options[vIdx]) return p;
  const v = p.options[vIdx];
  const merged = JSON.parse(JSON.stringify(p));
  Object.keys(v).forEach(k => {
    if (k === 'image' && !v[k]) return;
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

let _batchImages = [];
let _batchVariants = [];

function reattachImages() {
  products.forEach(function(p) {
    const model = p.model;
    if (!model) return;
    ['image', 'image2', 'image3'].forEach(function(key, idx) {
      if (!p[key]) {
        const imgData = localStorage.getItem(IMG_PREFIX + model + '_' + idx);
        if (imgData) p[key] = imgData;
      }
    });
  });
}

function saveImagesSeparately() {
  products.forEach(function(p) {
    const model = p.model;
    if (!model) return;
    ['image', 'image2', 'image3'].forEach(function(key, idx) {
      const imgKey = IMG_PREFIX + model + '_' + idx;
      if (p[key]) {
        try { localStorage.setItem(imgKey, p[key]); } catch(ignore) {}
      } else {
        localStorage.removeItem(imgKey);
      }
    });
  });
}

function removeProductImages(model) {
  if (!model) return;
  [0, 1, 2].forEach(function(idx) {
    localStorage.removeItem(IMG_PREFIX + model + '_' + idx);
  });
}

function clearAllImageStorage() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.indexOf(IMG_PREFIX) === 0) keys.push(key);
  }
  keys.forEach(function(k) { localStorage.removeItem(k); });
}

// Fields config for form/table
const FIELDS = [
  { key: 'model', label: 'Model', type: 'text', required: true },
  { key: 'category', label: 'Category', type: 'select', options: ['Car Charger','Car Bluetooth MP3','Bluetooth Receiver','FM Transmitter','Wireless Charger','CarPlay','Other'] },
  { key: 'type_en', label: 'Product Type (EN)', type: 'text' },
  { key: 'type_cn', label: 'Product Type (CN)', type: 'text' },
  { key: 'bt', label: 'Bluetooth', type: 'text' },
  { key: 'chip', label: 'Chip', type: 'text' },
  { key: 'power', label: 'Power/Charging', type: 'text' },
  { key: 'ports', label: 'Ports', type: 'text' },
  { key: 'features', label: 'Features', type: 'textarea' },
  { key: 'signal', label: 'Signal Distance', type: 'text' },
  { key: 'dim', label: 'Dimensions', type: 'text' },
  { key: 'nw', label: 'N.W. (g)', type: 'text' },
  { key: 'gw', label: 'G.W. (g)', type: 'text' },
  { key: 'fm', label: 'FM Frequency', type: 'text' },
  { key: 'input_v', label: 'Input Voltage', type: 'text' },
  { key: 'material', label: 'Material', type: 'text' },
  { key: 'color', label: 'Color', type: 'text' },
  { key: 'cert', label: 'Certifications', type: 'text' },
  { key: 'safety', label: 'Safety Protections', type: 'text' },
  { key: 'audio', label: 'Audio Codecs', type: 'text' },
  { key: 'rxtx', label: 'RX/TX', type: 'text' },
  { key: 'proto', label: 'Protocols', type: 'text' },
  { key: 'selling', label: 'Selling Points', type: 'textarea' },
  { key: 'desc', label: 'Product Description', type: 'textarea' },
  { key: 'p_sample', label: 'Sample Price (RMB)', type: 'text' },
  { key: 'p_500', label: '500pcs Price (RMB)', type: 'text' },
  { key: 'p_2000', label: '2000pcs Price (RMB)', type: 'text' },
  { key: 'p_5000', label: '5000pcs Price (RMB)', type: 'text' },
  { key: 'year', label: 'Year', type: 'text', placeholder: '2024' },
    { key: 'image', label: 'Images (max 3)', type: 'images', placeholder: 'Upload up to 3 images' },
  { key: 'image2', label: 'Image 2', type: 'hidden' },
  { key: 'image3', label: 'Image 3', type: 'hidden' },
  { key: 'acc', label: 'Accessories', type: 'text' },
  { key: 'box_dim', label: 'Box Dimensions (mm)', type: 'text', placeholder: '120 x 80 x 45' },
  { key: 'box_weight', label: 'Box Weight (g)', type: 'text', placeholder: '85' },
  { key: 'carton_dim', label: 'Carton Dimensions (mm)', type: 'text', placeholder: '500 x 400 x 300' },
  { key: 'carton_weight', label: 'Carton Weight (kg)', type: 'text', placeholder: '12.5' },
];

// ===== AUTH =====
const AUTH_USER = 'Jerry';
const AUTH_PASS = 'GXY88888';
const AUTH_KEY = 'gxykit_auth';
let isLoggedIn = false;

function checkAuth() {
  try {
    const auth = sessionStorage.getItem(AUTH_KEY);
    if (auth) {
      const data = JSON.parse(auth);
      if (data.user === AUTH_USER && data.time > Date.now() - 86400000) {
        isLoggedIn = true;
        document.getElementById('loginOverlay').classList.add('hidden');
        initApp();
        return;
      }
    }
  } catch(e) {}
  isLoggedIn = false;
  document.getElementById('loginOverlay').classList.remove('hidden');
  document.getElementById('loginUser').focus();
}

function init() {
  checkAuth();
}

function doLogin() {
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  const errorEl = document.getElementById('loginError');
  if (user === AUTH_USER && pass === AUTH_PASS) {
    isLoggedIn = true;
    sessionStorage.setItem(AUTH_KEY, JSON.stringify({ user: user, time: Date.now() }));
    document.getElementById('loginOverlay').classList.add('hidden');
    document.getElementById('loginPass').value = '';
    errorEl.textContent = '';
    initApp();
    showToast('Welcome back, Jerry!', 'success');
  } else {
    errorEl.textContent = 'Invalid username or password';
    document.getElementById('loginPass').value = '';
    document.getElementById('loginPass').focus();
  }
}

function doLogout() {
  isLoggedIn = false;
  sessionStorage.removeItem(AUTH_KEY);
  document.getElementById('loginOverlay').classList.remove('hidden');
  document.getElementById('loginUser').value = 'Jerry';
  document.getElementById('loginPass').value = '';
  document.getElementById('loginError').textContent = '';
  // Clear pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-manage').classList.add('active');
  document.querySelectorAll('.header-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
}

function requireAuth(action) {
  if (!isLoggedIn) {
    showToast('Please sign in first', 'warn');
    document.getElementById('loginOverlay').classList.remove('hidden');
    document.getElementById('loginUser').focus();
    return false;
  }
  return true;
}

function initApp() {
  loadData();
  mergeHubCategory();
  updateStatus();
  renderFilterChips();
  populateBatchCategories();
  renderTable();
  renderQuoteFilterChips();
  renderQuoteProducts();
  renderCart();
}

function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
    if (stored) {
      products = JSON.parse(stored);
      reattachImages();
      // Version mismatch: data.js was updated, localStorage is stale
      if (DATA_VERSION_JS !== 'unknown' && storedVersion !== DATA_VERSION_JS) {
        const doReload = confirm(
          'Data has been updated (v' + DATA_VERSION_JS + ').\n' +
          'Your local data is from an older version (v' + (storedVersion || 'unknown') + ').\n\n' +
          'Click OK to load the latest data from data.js.\n' +
          'Click Cancel to keep your local changes (may have outdated categories).'
        );
        if (doReload) {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.setItem(STORAGE_VERSION_KEY, DATA_VERSION_JS);
          products = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
          showToast('Loaded latest data from data.js (v' + DATA_VERSION_JS + ')', 'success');
          return;
        }
      }
      return;
    }
    const userDefault = localStorage.getItem(STORAGE_KEY + '_default');
    if (userDefault) {
      products = JSON.parse(userDefault);
      reattachImages();
      showToast('Loaded from user-set default', 'success');
      return;
    }
  } catch(e) {}
  products = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
  // Save version on first load
  if (DATA_VERSION_JS !== 'unknown') {
    localStorage.setItem(STORAGE_VERSION_KEY, DATA_VERSION_JS);
  }
}

function saveData() {
  // Try to save everything including images in one key
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    if (DATA_VERSION_JS !== 'unknown') {
      localStorage.setItem(STORAGE_VERSION_KEY, DATA_VERSION_JS);
    }
    updateStatus();
    return true;
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      // Separate images from main data to avoid quota limit
      showToast('Storage full - switching to image-separation mode', 'warn');
      try {
        const slimProducts = products.map(function(p) {
          const clone = Object.assign({}, p);
          delete clone.image; delete clone.image2; delete clone.image3;
          return clone;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(slimProducts));
        if (DATA_VERSION_JS !== 'unknown') {
          localStorage.setItem(STORAGE_VERSION_KEY, DATA_VERSION_JS);
        }
        saveImagesSeparately();
        updateStatus();
        showToast('Saved with images separated to individual keys', 'success');
        return true;
      } catch (e2) {
        showToast('Storage full! Even image-separation failed. Export data.js instead.', 'danger');
        return false;
      }
    } else {
      showToast('Save failed: ' + e.message, 'danger');
      return false;
    }
  }
}

function mergeHubCategory() {
  let changed = 0;
  products.forEach(p => {
    const cat = p.category || '';
    // Normalize old/variant category names
    if (cat === 'Car Charger Hub' || cat === 'Car Charger Hubs' || cat === 'Car Chargers') {
      p.category = 'Car Charger';
      changed++;
    }
  });
  if (changed > 0) {
    saveData();
    showToast('Normalized ' + changed + ' product category name(s) to "Car Charger"', 'success');
    return true;
  }
  return false;
}

function updateStatus() {
  document.getElementById('statusText').textContent = 'Products: ' + products.length + ' | Saved: ' + new Date().toLocaleTimeString();
}

// ===== TAB =====
function switchTab(tab) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.header-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-' + tab).classList.add('active');
  event.target.classList.add('active');
}

// ===== TABLE / MANAGE =====
let currentPage = 1;
let pageSize = 20;
let currentFilter = 'all';
let searchQuery = '';

function renderFilterChips() {
  // Get unique categories from products
  const rawCats = [...new Set(products.map(p => p.category))];
  // Sort to match FIELDS order for consistency
  const fieldCats = (FIELDS.find(f => f.key === 'category') || {}).options || [];
  const knownCats = fieldCats.filter(c => rawCats.includes(c));
  const unknownCats = rawCats.filter(c => !fieldCats.includes(c));
  const cats = knownCats.concat(unknownCats.sort());
  const container = document.getElementById('filterChips');
  container.innerHTML = '<div class="chip' + (currentFilter === 'all' ? ' active' : '') + '" onclick="setFilter(\'all\')">All (' + products.length + ')</div>';
  cats.forEach(cat => {
    if (!cat) return;
    const count = products.filter(p => p.category === cat).length;
    container.innerHTML += '<div class="chip' + (currentFilter === cat ? ' active' : '') + '" onclick="setFilter(\'' + cat + '\')">' + cat + ' (' + count + ')</div>';
  });
}

function setFilter(cat) {
  currentFilter = cat;
  currentPage = 1;
  renderFilterChips();
  renderTable();
}

function filterTable() {
  searchQuery = document.getElementById('searchInput').value.toLowerCase();
  currentPage = 1;
  renderTable();
}

function getFiltered() {
  let list = products;
  if (currentFilter !== 'all') {
    list = list.filter(p => p.category === currentFilter);
  }
  if (searchQuery) {
    list = list.filter(p => {
      const text = (p.model + ' ' + (p.type_en || '') + ' ' + (p.type_cn || '') + ' ' + (p.category || '')).toLowerCase();
      return text.includes(searchQuery);
    });
  }
  return list;
}

function renderTable() {
  const list = getFiltered();
  const start = (currentPage - 1) * pageSize;
  const pageItems = list.slice(start, start + pageSize);
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';
  pageItems.forEach((p, idx) => {
    const realIdx = products.indexOf(p);
    const tr = document.createElement('tr');
    const thumbHtml = p.image ?
      '<img src="' + p.image + '" class="table-thumb" onclick="openVariantLightbox(\'' + p.image + '\')" alt="">' :
      '<div class="table-thumb-placeholder">--</div>';
    tr.innerHTML = '<td><input type="checkbox" class="row-check" data-idx="' + realIdx + '" onchange="updateBatchInfo()"></td>' +
      '<td>' + thumbHtml + '</td>' +
      '<td class="td-model">' + (p.model || '') + '</td>' +
      '<td class="td-category">' + (p.category || '') + '</td>' +
      '<td>' + (p.type_en || p.type_cn || '') + '</td>' +
      '<td>' + (p.bt || '') + '</td>' +
      '<td>' + (p.power || '') + '</td>' +
      '<td>' + (p.ports || '') + '</td>' +
      '<td class="td-dim">' + (p.dim || '') + '</td>' +
      '<td class="td-price">' + (p.p_sample || '-') + '</td>' +
      '<td class="td-price">' + (p.p_500 || '-') + '</td>' +
      '<td class="td-price">' + (p.p_2000 || '-') + '</td>' +
      '<td class="td-price">' + (p.p_5000 || '-') + '</td>' +
      '<td><div class="actions">' +
      '<button class="action-btn edit" onclick="editProduct(' + realIdx + ')">Edit</button>' +
      '<button class="action-btn delete" onclick="deleteProduct(' + realIdx + ')">Del</button>' +
      '</div></td>';
    tbody.appendChild(tr);
  });
  renderPagination(list.length);
}

function renderPagination(total) {
  const totalPages = Math.ceil(total / pageSize) || 1;
  const container = document.getElementById('pagination');
  let html = '';
  html += '<button class="page-btn" ' + (currentPage === 1 ? 'disabled' : '') + ' onclick="goPage(' + (currentPage - 1) + ')">&lt;</button>';
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      html += '<button class="page-btn' + (i === currentPage ? ' active' : '') + '" onclick="goPage(' + i + ')">' + i + '</button>';
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += '<span style="padding:0 4px;color:var(--text-ter)">...</span>';
    }
  }
  html += '<button class="page-btn" ' + (currentPage === totalPages ? 'disabled' : '') + ' onclick="goPage(' + (currentPage + 1) + ')">&gt;</button>';
  container.innerHTML = html;
}

function goPage(n) {
  currentPage = n;
  renderTable();
}

// ===== ADD / EDIT =====
function showAddModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent = 'Add Product';
  buildForm({});
  document.getElementById('modalBg').classList.add('show');
  document.getElementById('modalBox').classList.add('show');
}

function editProduct(idx) {
  editingId = idx;
  document.getElementById('modalTitle').textContent = 'Edit Product: ' + products[idx].model;
  buildForm(products[idx]);
  document.getElementById('modalBg').classList.add('show');
  document.getElementById('modalBox').classList.add('show');
}

function buildForm(data) {
  const grid = document.getElementById('formGrid');
  grid.innerHTML = '';
  FIELDS.forEach(f => {
    const div = document.createElement('div');
    div.className = 'form-field' + (f.type === 'textarea' || f.type === 'images' ? ' full' : '');
    let input = '';
    if (f.type === 'select') {
      // Build options: include FIELDS options + current value if not in options
      let opts = f.options.slice();
      const currentVal = data[f.key] || '';
      if (currentVal && !opts.includes(currentVal)) {
        opts.push(currentVal);
      }
      input = '<select id="f_' + f.key + '">' + opts.map(o => '<option value="' + o + '"' + (currentVal === o ? ' selected' : '') + '>' + o + '</option>').join('') + '</select>';
    } else if (f.type === 'textarea') {
      input = '<textarea id="f_' + f.key + '" rows="3">' + (data[f.key] || '') + '</textarea>';
    } else if (f.type === 'images') {
      // Batch upload area for up to 3 images
      input = '<div class="image-dropzone" id="imgDropzone_' + f.key + '" onclick="document.getElementById(\'batchUpload_' + f.key + '\').click()" ondragover="handleDragOver(event,this)" ondragleave="handleDragLeave(event,this)" ondrop="handleDrop(event,this)">' +
        '<div class="drop-hint"><span class="drop-icon">📷</span><br>Drop images here or click to browse<br><small>Up to 3 images</small></div>' +
        '<input type="file" id="batchUpload_' + f.key + '" accept="image/*" multiple style="display:none" onchange="handleBatchUpload(this)">' +
        '</div>' +
        '<div class="image-preview-grid" id="imgPreviewGrid_' + f.key + '"></div>' +
        '<input type="hidden" id="f_' + f.key + '" value="' + (data[f.key] || '') + '">' +
        '<input type="hidden" id="f_image2" value="' + (data.image2 || '') + '">' +
        '<input type="hidden" id="f_image3" value="' + (data.image3 || '') + '">';
      // Initialize batch array from existing images
      _batchImages = [];
      if (data.image) _batchImages.push(data.image);
      if (data.image2) _batchImages.push(data.image2);
      if (data.image3) _batchImages.push(data.image3);
    } else if (f.type === 'hidden') {
      input = '<input type="hidden" id="f_' + f.key + '" value="' + (data[f.key] || '') + '">';
    } else {
      input = '<input type="text" id="f_' + f.key + '" value="' + (data[f.key] || '') + '" placeholder="' + (f.placeholder || '') + '">';
    }
    div.innerHTML = '<label>' + f.label + (f.required ? ' *' : '') + '</label>' + input;
    grid.appendChild(div);
  });
  // After all fields rendered, update image previews if batch images exist
  if (_batchImages && _batchImages.length > 0) updateImagePreviews();

  // Build variants editor section
  buildVariantsEditor(data.options || []);
}

/* ===== VARIANTS EDITOR ===== */
function buildVariantsEditor(existing) {
  const container = document.getElementById('variantsContainer');
  if (!container) return;
  _batchVariants = existing.slice();
  renderVariantsList();
}

function renderVariantsList() {
  const container = document.getElementById('variantsContainer');
  if (!container) return;
  let html = '';
  _batchVariants.forEach(function(opt, idx) {
    html += buildVariantCard(idx, opt);
  });
  container.innerHTML = html;
}

function buildVariantCard(idx, opt) {
  const fields = [
    { key: 'model', label: 'Model' },
    { key: 'p_5000', label: 'MOQ 5K Price (RMB)' },
    { key: 'bt', label: 'Bluetooth' },
    { key: 'chip', label: 'Chip' },
    { key: 'power', label: 'Power' },
    { key: 'ports', label: 'Ports' },
    { key: 'features', label: 'Features' },
    { key: 'signal', label: 'Signal' },
    { key: 'fm', label: 'FM' },
    { key: 'screen', label: 'Screen' },
    { key: 'dim', label: 'Dimensions' },
    { key: 'proto', label: 'Protocols' },
    { key: 'color', label: 'Color' },
    { key: 'material', label: 'Material' },
    { key: 'cert', label: 'Certifications' },
    { key: 'safety', label: 'Safety' },
    { key: 'battery', label: 'Battery' },
    { key: 'cable', label: 'Cable' },
    { key: 'input_v', label: 'Input Voltage' }
  ];
  
  // Build image section
  const variantImage = opt.image || '';
  const hasImage = variantImage.trim() !== '';
  let imageSection = '';
  if (hasImage) {
    imageSection = '<img src="' + escapeHtml(variantImage) + '" class="variant-thumb" onclick="openVariantLightbox(\'' + escapeHtml(variantImage) + '\')" title="Click to enlarge">';
  } else {
    imageSection = '<div class="variant-thumb-placeholder">No Image</div>';
  }
  
  let inputsHTML = '';
  fields.forEach(function(f) {
    const val = opt[f.key] || '';
    const isTextarea = (f.key === 'features' || f.key === 'p_5000');
    const safeId = 'v_' + f.key + '_' + idx;
    const safeKey = f.key;
    const safeLabel = f.label;
    const safeVal = escapeHtml(val);
    let inputHTML = '';
    if (isTextarea) {
      inputHTML = '<textarea rows="2" id="' + safeId + '" data-vkey="' + safeKey + '" placeholder="' + safeLabel + '" class="variant-input">' + safeVal + '</textarea>';
    } else {
      inputHTML = '<input type="text" id="' + safeId + '" data-vkey="' + safeKey + '" value="' + safeVal + '" placeholder="' + safeLabel + '" class="variant-input" />';
    }
    inputsHTML += '<div class="form-field"><label>' + safeLabel + '</label>' + inputHTML + '</div>';
  });
  
  // Image input row (separate from grid)
  const imageInputHTML = 
    '<div class="variant-image-section">' +
      imageSection +
      '<div class="variant-image-inputs">' +
        '<input type="text" id="v_image_' + idx + '" data-vkey="image" value="' + escapeHtml(variantImage) + '" placeholder="Image path or URL" class="variant-input" />' +
        '<label class="variant-file-btn" onclick="document.getElementById(\'variantUpload_' + idx + '\').click()">&#128247; Upload</label>' +
        '<input type="file" id="variantUpload_' + idx + '" accept="image/*" style="display:none" onchange="handleVariantImageUpload(this, ' + idx + ')">' +
      '</div>' +
    '</div>';
  
  return '<div class="variant-card" data-vidx="' + idx + '">' +
    '<div class="variant-header" onclick="toggleVariantBody(this)">' +
      '<span class="variant-title">Variant #' + (idx + 1) + ' &mdash; ' + (opt.model || 'Untitled') + '</span>' +
      '<span class="variant-toggle">&#9662;</span>' +
      '<button class="variant-del" onclick="event.stopPropagation();removeVariant(' + idx + ')">Delete</button>' +
    '</div>' +
    '<div class="variant-body open">' +
      imageInputHTML +
      '<div class="variant-grid">' + inputsHTML + '</div>' +
    '</div>' +
  '</div>';
}

function toggleVariantBody(header) {
  const body = header.nextElementSibling;
  if (body) body.classList.toggle('open');
}

function addVariant() {
  _batchVariants.push({ model: '' });
  renderVariantsList();
}

function removeVariant(idx) {
  if (!confirm('Delete variant #' + (idx + 1) + '?')) return;
  _batchVariants.splice(idx, 1);
  renderVariantsList();
}

function handleVariantImageUpload(input, idx) {
  const file = input.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('Please select an image file', 'warn');
    return;
  }
  // Compress and convert to base64
  compressImage(file, 800, 0.85).then(function(base64) {
    // Store in _batchVariants
    if (_batchVariants[idx]) {
      _batchVariants[idx].image = base64;
    }
    // Update the image input field
    const imgInput = document.getElementById('v_image_' + idx);
    if (imgInput) imgInput.value = base64;
    // Re-render to show the thumbnail
    renderVariantsList();
    showToast('Variant image uploaded', 'success');
  }).catch(function(err) {
    showToast('Image upload failed: ' + err.message, 'danger');
  });
}

function openVariantLightbox(imgSrc) {
  if (!imgSrc) return;
  // Remove existing lightbox if any
  const existing = document.getElementById('variantLightbox');
  if (existing) existing.remove();
  
  const lightbox = document.createElement('div');
  lightbox.id = 'variantLightbox';
  lightbox.className = 'lightbox-bg';
  lightbox.innerHTML = '<img src="' + imgSrc + '" class="lightbox-img" onclick="event.stopPropagation()">' +
    '<button class="lightbox-close" onclick="closeVariantLightbox()">&times;</button>';
  lightbox.onclick = closeVariantLightbox;
  document.body.appendChild(lightbox);
  
  // Trigger animation
  requestAnimationFrame(function() {
    lightbox.classList.add('show');
  });
}

function closeVariantLightbox() {
  const lightbox = document.getElementById('variantLightbox');
  if (lightbox) {
    lightbox.classList.remove('show');
    setTimeout(function() {
      lightbox.remove();
    }, 300);
  }
}

function handleDragOver(e, el) {
  e.preventDefault();
  if (el) el.classList.add('drag-over');
}

function handleDragLeave(e, el) {
  e.preventDefault();
  if (el) el.classList.remove('drag-over');
}

function handleDrop(e, el) {
  e.preventDefault();
  if (el) el.classList.remove('drag-over');
  const fileInput = el.querySelector('input[type="file"]');
  if (fileInput && e.dataTransfer.files.length > 0) {
    fileInput.files = e.dataTransfer.files;
    handleBatchUpload(fileInput);
  }
}

function handleBatchUpload(input) {
  const files = Array.from(input.files);
  if (!files.length) return;
  processBatchFiles(files);
}

function compressImage(file, maxWidth, quality) {
  return new Promise(function(resolve, reject) {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = function(e) {
      img.onload = function() {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = Math.round(h * maxWidth / w);
          w = maxWidth;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = function() { reject(new Error('Image load failed')); };
      img.src = e.target.result;
    };
    reader.onerror = function() { reject(new Error('File read failed')); };
    reader.readAsDataURL(file);
  });
}

function processBatchFiles(files) {
  const maxImages = 3;
  const remainingSlots = Math.max(0, maxImages - _batchImages.length);
  if (remainingSlots === 0) {
    showToast('Maximum 3 images reached. Remove one first.', 'warn');
    return;
  }
  const toAdd = files.slice(0, remainingSlots);
  let processed = 0;
  let compressCount = 0;
  toAdd.forEach(function(file) {
    compressImage(file, 1200, 0.7).then(function(dataUrl) {
      _batchImages.push(dataUrl);
      processed++;
      compressCount++;
      if (processed === toAdd.length) {
        updateImagePreviews();
        syncBatchToHidden();
        if (compressCount > 0) showToast(compressCount + ' image(s) compressed and added', 'success');
      }
    }).catch(function(err) {
      processed++;
      showToast('Image compression failed: ' + err.message, 'danger');
      if (processed === toAdd.length) updateImagePreviews();
    });
  });
  if (files.length > remainingSlots) {
    showToast('Only ' + remainingSlots + ' of ' + files.length + ' images were added (max 3)', 'warn');
  }
}

function syncBatchToHidden() {
  const img1 = document.getElementById('f_image');
  const img2 = document.getElementById('f_image2');
  const img3 = document.getElementById('f_image3');
  if (img1) img1.value = _batchImages[0] || '';
  if (img2) img2.value = _batchImages[1] || '';
  if (img3) img3.value = _batchImages[2] || '';
}

function updateImagePreviews() {
  const grid = document.getElementById('imgPreviewGrid_image');
  if (!grid) return;
  let html = '';
  _batchImages.forEach((img, idx) => {
    html += '<div class="img-preview-card">' +
      '<img src="' + img + '" class="img-preview-thumb">' +
      '<button class="img-preview-del" onclick="removeBatchImage(' + idx + ')" title="Remove">×</button>' +
      '</div>';
  });
  grid.innerHTML = html;
}

function removeBatchImage(idx) {
  _batchImages.splice(idx, 1);
  updateImagePreviews();
}

function saveProduct() {
  if (!requireAuth('save product')) return;
  // Sync batch images to hidden inputs before saving
  const hiddenImg1 = document.getElementById('f_image');
  const hiddenImg2 = document.getElementById('f_image2');
  const hiddenImg3 = document.getElementById('f_image3');
  if (hiddenImg1) hiddenImg1.value = _batchImages[0] || '';
  if (hiddenImg2) hiddenImg2.value = _batchImages[1] || '';
  if (hiddenImg3) hiddenImg3.value = _batchImages[2] || '';

  const data = {};
  FIELDS.forEach(f => {
    const el = document.getElementById('f_' + f.key);
    data[f.key] = el ? el.value.trim() : '';
  });
  // Collect variants
  const opts = collectVariantData();
  if (opts && opts.length > 0) {
    data.options = opts;
  } else {
    delete data.options;
  }
  if (!data.model) {
    showToast('Model is required', 'warn');
    return;
  }
  if (editingId !== null) {
    products[editingId] = { ...products[editingId], ...data };
    showToast('Product updated', 'success');
  } else {
    data.id = Date.now();
    products.push(data);
    showToast('Product added', 'success');
  }
  // Clear batch arrays after save to prevent leakage to next edit
  _batchImages = [];
  _batchVariants = [];
  if (!saveData()) return;
  closeModal();
  renderTable();
  renderQuoteProducts();
  renderFilterChips();
  populateBatchCategories();
}

function collectVariantData() {
  const container = document.getElementById('variantsContainer');
  if (!container) return [];
  const cards = container.querySelectorAll('.variant-card');
  const opts = [];
  cards.forEach(function(card) {
    const inputs = card.querySelectorAll('input, select, textarea');
    const opt = {};
    inputs.forEach(function(inp) {
      if (inp.id && inp.id.indexOf('v_') === 0) {
        const key = inp.id.replace('v_', '').replace(/_\d+$/, '');
        let val = '';
        if (inp.tagName === 'TEXTAREA') {
          val = inp.value.trim();
        } else {
          val = inp.value.trim();
        }
        if (val) opt[key] = val;
      }
    });
    if (Object.keys(opt).length > 0) opts.push(opt);
  });
  return opts;
}

function deleteProduct(idx) {
  if (!confirm('Delete product "' + products[idx].model + '"?')) return;
  removeProductImages(products[idx].model);
  products.splice(idx, 1);
  saveData();
  renderTable();
  renderQuoteProducts();
  renderCart();
  renderFilterChips();
  populateBatchCategories();
  showToast('Product deleted', 'danger');
}

function closeModal() {
  document.getElementById('modalBg').classList.remove('show');
  document.getElementById('modalBox').classList.remove('show');
  editingId = null;
  _batchImages = [];
  _batchVariants = [];
  // Reset any variant image upload inputs that may still be in DOM
  document.querySelectorAll('input[id^="variantUpload_"]').forEach(function(el) { el.value = ''; });
}

// ===== REFRESH CATALOG =====
function refreshCatalog() {
  // Save current data to localStorage so index.html can pick it up on next load
  saveData();
  // Attempt to reload the catalog page in a new tab or the same tab
  const catalogUrl = './index.html';
  // Open in new tab so admin page stays open
  window.open(catalogUrl, '_blank');
  showToast('Catalog opened in new tab with latest data.', 'success');
}

// ===== EXPORT / IMPORT =====
function exportDataJS() {
  // Merge separated images back into products before export
  reattachImages();
  const json = JSON.stringify(products, null, 2);
  const version = (typeof DATA_VERSION !== 'undefined') ? DATA_VERSION : 'unknown';
  const blob = new Blob(['const DATA_VERSION = \'' + version + '\';\nconst PRODUCTS = ' + json + ';'], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'data.js';
  a.click();
  URL.revokeObjectURL(url);
  showToast('data.js exported! Replace the file to update catalog.', 'success');
}

function importDataJS() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.js';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const text = ev.target.result;
        // Extract DATA_VERSION if present
        let importedVersion = null;
        const verMatch = text.match(/DATA_VERSION\s*=\s*['"]([^'"]+)['"]/);
        if (verMatch) importedVersion = verMatch[1];
        // Remove DATA_VERSION line and PRODUCTS const to extract JSON
        const json = text
          .replace(/const\s+DATA_VERSION\s*=\s*['"][^'"]*['"]\s*;?\s*/, '')
          .replace(/const\s+PRODUCTS\s*=\s*/, '')
          .replace(/;$/, '')
          .trim();
        products = JSON.parse(json);
        // Update version in localStorage
        if (importedVersion) {
          localStorage.setItem(STORAGE_VERSION_KEY, importedVersion);
        }
        saveData();
        renderTable();
        renderQuoteProducts();
        renderFilterChips();
        populateBatchCategories();
        showToast('Data imported successfully' + (importedVersion ? ' (v' + importedVersion + ')' : ''), 'success');
      } catch(err) {
        showToast('Import failed: ' + err.message, 'danger');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function resetToDefault() {
  if (!confirm('Reset all data to default? This will overwrite local changes.')) return;
  localStorage.removeItem(STORAGE_KEY);
  // Try user-set default first, then original default
  try {
    const userDefault = localStorage.getItem(STORAGE_KEY + '_default');
    if (userDefault) {
      products = JSON.parse(userDefault);
    } else {
      products = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
      // Reset version to match data.js
      if (DATA_VERSION_JS !== 'unknown') {
        localStorage.setItem(STORAGE_VERSION_KEY, DATA_VERSION_JS);
      }
    }
  } catch(e) {
    products = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
  }
  saveData();
  renderTable();
  renderQuoteProducts();
  renderCart();
  renderFilterChips();
  populateBatchCategories();
  showToast('Data reset to default', 'success');
}

function setAsDefault() {
  if (!requireAuth('set default')) return;
  localStorage.setItem(STORAGE_KEY + '_default', JSON.stringify(products));
  showToast('Current data saved as new default! Reset will use this.', 'success');
}

// ===== BATCH OPERATIONS =====
function toggleSelectAll(checkbox) {
  document.querySelectorAll('.row-check').forEach(cb => { cb.checked = checkbox.checked; });
  updateBatchInfo();
}

function updateBatchInfo() {
  const checked = document.querySelectorAll('.row-check:checked');
  document.getElementById('batchInfo').textContent = checked.length + ' selected';
  const allChecks = document.querySelectorAll('.row-check');
  const selectAll = document.getElementById('selectAll');
  if (selectAll) selectAll.checked = allChecks.length > 0 && checked.length === allChecks.length;
}

function clearSelection() {
  document.querySelectorAll('.row-check').forEach(cb => cb.checked = false);
  const selectAll = document.getElementById('selectAll');
  if (selectAll) selectAll.checked = false;
  updateBatchInfo();
}

function populateBatchCategories() {
  const select = document.getElementById('batchCategory');
  if (!select) return;
  // Sort categories: FIELDS order first, then any unknown
  const rawCats = [...new Set(products.map(p => p.category))];
  const fieldCats = (FIELDS.find(f => f.key === 'category') || {}).options || [];
  const knownCats = fieldCats.filter(c => rawCats.includes(c));
  const unknownCats = rawCats.filter(c => !fieldCats.includes(c)).sort();
  const cats = knownCats.concat(unknownCats);
  select.innerHTML = '<option value="">Change category to...</option>';
  cats.forEach(cat => {
    if (!cat) return;
    select.innerHTML += '<option value="' + cat + '">' + cat + '</option>';
  });
}

function batchChangeCategory() {
  if (!requireAuth('batch edit')) return;
  const newCat = document.getElementById('batchCategory').value;
  if (!newCat) { showToast('Please select a category', 'warn'); return; }
  const checked = document.querySelectorAll('.row-check:checked');
  if (checked.length === 0) { showToast('No products selected', 'warn'); return; }
  if (!confirm('Change category to "' + newCat + '" for ' + checked.length + ' product(s)?')) return;
  let count = 0;
  checked.forEach(cb => {
    const idx = parseInt(cb.dataset.idx);
    if (products[idx]) { products[idx].category = newCat; count++; }
  });
  saveData();
  renderTable();
  renderQuoteProducts();
  renderFilterChips();
  populateBatchCategories();
  showToast(count + ' products moved to ' + newCat, 'success');
}

// ===== QUOTE PAGE =====
let quoteFilter = 'all';
let quoteSearch = '';

function renderQuoteFilterChips() {
  // Sort to match FIELDS order for consistency
  const rawCats = [...new Set(products.map(p => p.category))];
  const fieldCats = (FIELDS.find(f => f.key === 'category') || {}).options || [];
  const knownCats = fieldCats.filter(c => rawCats.includes(c));
  const unknownCats = rawCats.filter(c => !fieldCats.includes(c)).sort();
  const cats = knownCats.concat(unknownCats);
  const container = document.getElementById('quoteFilterChips');
  container.innerHTML = '<div class="chip' + (quoteFilter === 'all' ? ' active' : '') + '" onclick="setQuoteFilter(\'all\')">All</div>';
  cats.forEach(cat => {
    if (!cat) return;
    container.innerHTML += '<div class="chip' + (quoteFilter === cat ? ' active' : '') + '" onclick="setQuoteFilter(\'' + cat + '\')">' + cat + '</div>';
  });
}

function setQuoteFilter(cat) {
  quoteFilter = cat;
  renderQuoteFilterChips();
  renderQuoteProducts();
}

function filterQuoteProducts() {
  quoteSearch = document.getElementById('quoteSearch').value.toLowerCase();
  renderQuoteProducts();
}

function getQuoteFiltered() {
  let list = products;
  if (quoteFilter !== 'all') {
    list = list.filter(p => p.category === quoteFilter);
  }
  if (quoteSearch) {
    list = list.filter(p => {
      const text = (p.model + ' ' + (p.type_en || '') + ' ' + (p.type_cn || '')).toLowerCase();
      return text.includes(quoteSearch);
    });
  }
  return list;
}

function renderQuoteProducts() {
  const list = getQuoteFiltered();
  const grid = document.getElementById('selectGrid');
  grid.innerHTML = '';
  list.forEach((p, idx) => {
    const realIdx = products.indexOf(p);
    const hasVariants = p.options && p.options.length > 0;
    const parentInCart = cart.find(c => c.idx === realIdx && c.variantIdx === null);
    const card = document.createElement('div');
    card.className = 'select-card' + (parentInCart ? ' selected' : '');
    const price = p.p_sample || p.p_500 || '-';
    card.innerHTML =
      '<div class="check">' + (parentInCart ? '&#10003;' : '') + '</div>' +
      '<img src="' + (p.image || '') + '" alt="' + p.model + '" onerror="this.style.display=\'none\'">' +
      '<div class="sc-model">' + p.model + '</div>' +
      '<div class="sc-type">' + (p.type_en || p.category) + '</div>' +
      '<div class="sc-price">' + (price !== '-' ? 'Sample: ' + price + ' RMB' : 'Price on request') + '</div>';
    if (!hasVariants) {
      card.onclick = () => toggleCart(realIdx, null);
    } else {
      card.dataset.expanded = 'false';
      card.onclick = function() {
        const expanded = card.dataset.expanded === 'true';
        card.dataset.expanded = expanded ? 'false' : 'true';
        const sub = card.querySelector('.variant-subgrid');
        if (sub) sub.style.display = expanded ? 'none' : 'grid';
        else renderVariantSubgrid(card, realIdx);
      };
    }
    grid.appendChild(card);
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
      '<img src="' + (v.image || p.image || '') + '" alt="' + v.model + '" onerror="this.style.display=\'none\'">' +
      '<div class="v-model">' + v.model + '</div>' +
      '<div class="v-diff">' + (diff.length ? diff.join(' | ') : 'Standard') + '<br>' +
      (vPrice !== '-' ? vPrice + ' RMB' : 'Price on request') + '</div>';
    sub.appendChild(vCard);
  });
  parentCard.appendChild(sub);
}
function toggleCart(idx, variantIdx) {
  const key = idx + '-' + (variantIdx !== null && variantIdx !== undefined ? variantIdx : 'P');
  const existing = cart.find(c => cartKey(c) === key);
  if (existing) {
    cart = cart.filter(c => cartKey(c) !== key);
  } else {
    cart.push({ idx: idx, variantIdx: variantIdx !== undefined ? variantIdx : null, qty: 100, priceTier: 'p_500' });
  }
  renderQuoteProducts();
  renderCart();
}
function renderCart() {
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
      '<img class="cart-item-img" src="' + (item.image || '') + '" onerror="this.style.display=\'none\'">' +
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
}
function changeCartTier(i, tier) {
  cart[i].priceTier = tier;
  renderCart();
}

function changeQty(i, delta) {
  cart[i].qty = Math.max(1, cart[i].qty + delta);
  renderCart();
}

function setQty(i, val) {
  cart[i].qty = Math.max(1, parseInt(val) || 1);
  renderCart();
}

function removeCart(i) {
  cart.splice(i, 1);
  renderQuoteProducts();
  renderCart();
}

function clearCart() {
  cart = [];
  renderQuoteProducts();
  renderCart();
}

// ===== GENERATE QUOTE =====
function generateQuote() {
  if (cart.length === 0) {
    showToast('Please select at least one product', 'warn');
    return;
  }
  const custName = document.getElementById('custName').value || 'Customer';
  const custCompany = document.getElementById('custCompany').value || '';
  const custEmail = document.getElementById('custEmail').value || '';
  const custNote = document.getElementById('custNote').value || 'Prices are valid for 30 days. MOQ applies. Payment: T/T in advance. Delivery: FOB Shenzhen.';

  let total = 0;
  let rows = '';
  cart.forEach(c => {
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
  });
  const dateStr = new Date().toLocaleDateString();
  const quoteNo = 'QT-' + Date.now().toString().slice(-8);

  const html = '<div class="quote-result">' +
    '<div class="quote-company">' +
    '<h2>QUOTATION</h2>' +
    '<p>Shenzhen Guangxinyi Electronics Co., Ltd.</p>' +
    '</div>' +
    '<div class="quote-meta">' +
    '<div class="quote-meta-item"><label>Quote No.</label><span>' + quoteNo + '</span></div>' +
    '<div class="quote-meta-item"><label>Date</label><span>' + dateStr + '</span></div>' +
    '<div class="quote-meta-item"><label>To</label><span>' + custName + (custCompany ? ' / ' + custCompany : '') + '</span></div>' +
    '<div class="quote-meta-item"><label>Email</label><span>' + (custEmail || '-') + '</span></div>' +
    '</div>' +
    '<table class="quote-table">' +
    '<thead><tr><th>Model</th><th>Description</th><th>Product Description</th><th>Qty</th><th>Unit Price (RMB)</th><th>Total (RMB)</th><th>Box Size / Weight</th><th>Carton Size / Weight</th></tr></thead>' +
    '<tbody>' + rows + '</tbody>' +
    '</table>' +
    '<div class="quote-total">' +
    '<div class="quote-total-label">Total Amount</div>' +
    '<div class="quote-total-value">' + (total ? total.toFixed(2) : '-') + ' RMB</div>' +
    '</div>' +
    '<div class="quote-note">' + custNote.replace(/\n/g, '<br>') + '</div>' +
    '</div>';

  document.getElementById('quotePreviewBody').innerHTML = html;
  document.getElementById('quoteModalBg').classList.add('show');
  document.getElementById('quoteModalBox').classList.add('show');
}

function closeQuoteModal() {
  document.getElementById('quoteModalBg').classList.remove('show');
  document.getElementById('quoteModalBox').classList.remove('show');
}

function printQuote() {
  const printWindow = window.open('', '_blank');
  printWindow.document.write('<html><head><title>Quotation</title><style>' +
    'body{font-family:Arial,sans-serif;padding:40px;max-width:800px;margin:0 auto}' +
    'h2{text-align:center}table{width:100%;border-collapse:collapse;margin:20px 0}' +
    'th,td{padding:10px;text-align:left;border-bottom:1px solid #ddd}' +
    'th{background:#f5f5f7;font-weight:600}.total{text-align:right;font-size:1.5rem;font-weight:700;margin:20px 0}' +
    '.meta{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px}' +
    '.meta-item{background:#f5f5f7;padding:10px;border-radius:6px}' +
    '.meta-item label{font-size:0.75rem;color:#666;display:block}' +
    '.meta-item span{font-weight:600}' +
    '</style></head><body>' + document.getElementById('quotePreviewBody').innerHTML + '</body></html>');
  printWindow.document.close();
  printWindow.print();
}

// ===== EXCEL EXPORT =====
function exportQuoteExcel() {
  if (cart.length === 0) {
    showToast('Please select at least one product', 'warn');
    return;
  }
  const custName = document.getElementById('custName').value || 'Customer';
  const custCompany = document.getElementById('custCompany').value || '';
  const custEmail = document.getElementById('custEmail').value || '';
  const custNote = document.getElementById('custNote').value || '';
  const dateStr = new Date().toLocaleDateString();

  // Build workbook
  const wb = XLSX.utils.book_new();
  wb.Props = { Title: 'Quotation', Subject: 'Product Quotation', Author: 'GXYKIT' };

  // Header rows
  const wsData = [
    ['QUOTATION'],
    ['Shenzhen Guangxinyi Electronics Co., Ltd.'],
    [''],
    ['Date:', dateStr],
    ['To:', custName + (custCompany ? ' - ' + custCompany : '')],
    ['Email:', custEmail || '-'],
    [''],
    ['Model', 'Description', 'Product Description', 'Qty', 'Unit Price (RMB)', 'Total (RMB)', 'Box Size (mm)', 'Box Weight (g)', 'Carton Size (mm)', 'Carton Weight (kg)'],
  ];

  let total = 0;
  cart.forEach(c => {
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
  });
  wsData.push(['', '', '', '', '', '', '', '', '', '']);
  wsData.push(['', '', '', '', '', 'Total:', total ? total.toFixed(2) : '-', '', '', '']);
  wsData.push(['']);
  wsData.push(['Notes:']);
  wsData.push([custNote]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [{wch: 15}, {wch: 25}, {wch: 35}, {wch: 8}, {wch: 18}, {wch: 18}, {wch: 18}, {wch: 14}, {wch: 18}, {wch: 16}];
  XLSX.utils.book_append_sheet(wb, ws, 'Quotation');
  XLSX.writeFile(wb, 'Quotation_' + custName.replace(/\s+/g, '_') + '_' + dateStr.replace(/\//g, '-') + '.xlsx');
  showToast('Excel exported!', 'success');
}

// ===== TOAST =====
function showToast(msg, type) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast toast-' + type + ' show';
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ===== KEYBOARD =====
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closeQuoteModal(); }
});

// ===== INIT =====
init();
