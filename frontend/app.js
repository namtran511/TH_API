// ============================================
// API Configuration
// ============================================
const API_BASE = '/api/products';
let isEditMode = false;
let editingId = null;
let materialsCache = [];

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();

  // Enter key on search inputs
  document.getElementById('search-name').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchProducts();
  });
  document.getElementById('search-material').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchProducts();
  });
});

// ============================================
// API Calls
// ============================================

// API 1: GET all products
async function loadProducts() {
  try {
    showTableLoading();
    const res = await fetch(API_BASE);
    const data = await res.json();
    if (data.success) {
      renderProducts(data.data);
      updateStats(data.data);
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Không thể kết nối server: ' + err.message, 'error');
    renderEmptyState('Không thể kết nối đến server');
  }
}

// API 2: Search products
async function searchProducts() {
  const name = document.getElementById('search-name').value.trim();
  const material = document.getElementById('search-material').value.trim();

  if (!name && !material) {
    showToast('Vui lòng nhập từ khóa tìm kiếm', 'info');
    return;
  }

  try {
    showTableLoading();
    const params = new URLSearchParams();
    if (name) params.append('name', name);
    if (material) params.append('material', material);

    const res = await fetch(`${API_BASE}/search?${params}`);
    const data = await res.json();
    if (data.success) {
      renderProducts(data.data);
      updateStats(data.data);
      const count = data.data.length;
      showToast(`Tìm thấy ${count} sản phẩm`, count > 0 ? 'success' : 'info');
    }
  } catch (err) {
    showToast('Lỗi tìm kiếm: ' + err.message, 'error');
  }
}

// API 3: In-stock products
async function loadInStock() {
  try {
    showTableLoading();
    const res = await fetch(`${API_BASE}/instock`);
    const data = await res.json();
    if (data.success) {
      renderProducts(data.data);
      updateStats(data.data);
      showToast(`${data.data.length} sản phẩm còn tồn kho`, 'success');
    }
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'error');
  }
}

// API 4: Add product
async function addProduct(productData) {
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    const data = await res.json();
    if (data.success) {
      showToast('Thêm sản phẩm thành công!', 'success');
      closeForm();
      loadProducts();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Lỗi thêm sản phẩm: ' + err.message, 'error');
  }
}

// API 5: Update product
async function updateProduct(id, productData) {
  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    const data = await res.json();
    if (data.success) {
      showToast('Cập nhật sản phẩm thành công!', 'success');
      closeForm();
      loadProducts();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Lỗi cập nhật: ' + err.message, 'error');
  }
}

// API 6: Delete product
async function deleteProduct(id, name) {
  if (!confirm(`Bạn có chắc muốn xóa sản phẩm "${name}"?`)) return;

  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (data.success) {
      showToast('Đã xóa sản phẩm thành công!', 'success');
      loadProducts();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Lỗi xóa: ' + err.message, 'error');
  }
}

// API 7: Export In-stock Products to Styled Excel
async function exportToExcel() {
  if (typeof ExcelJS === 'undefined') {
    showToast('Đang tải thư viện Excel, vui lòng thử lại sau giây lát...', 'info');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/instock`);
    const data = await res.json();
    if (!data.success || !data.data || data.data.length === 0) {
      showToast('Không có dữ liệu tồn kho để xuất', 'info');
      return;
    }
    
    showToast('Đang tạo báo cáo Excel...', 'info');
    const products = data.data;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Hàng Tồn Kho');

    // Layout cột
    worksheet.columns = [
      { header: 'Mã SP', key: 'masp', width: 12 },
      { header: 'Tên Sản Phẩm', key: 'tensp', width: 30 },
      { header: 'Chất Liệu', key: 'chatlieu', width: 22 },
      { header: 'Mô Tả', key: 'mota', width: 35 },
      { header: 'Giá Nhập', key: 'gianhap', width: 18 },
      { header: 'Giá Bán', key: 'giaban', width: 18 },
      { header: 'Số Lượng', key: 'soluong', width: 12 }
    ];

    // Style Header: Đổi màu xanh chàm, bôi đậm
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 30;

    // Bơm dữ liệu
    products.forEach((p, index) => {
      const row = worksheet.addRow({
        masp: p.MaSP,
        tensp: p.TenSP,
        chatlieu: p.TenCL,
        mota: p.MoTa || '',
        gianhap: p.GiaNhap,
        giaban: p.GiaBan,
        soluong: p.Soluong
      });

      // Tạo sọc ngựa vằn
      if (index % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
      }

      // Format số
      row.getCell(5).numFmt = '#,##0 \u20AB';
      row.getCell(6).numFmt = '#,##0 \u20AB';
      row.getCell(7).numFmt = '#,##0';
      row.getCell(7).alignment = { horizontal: 'center' };
    });

    // Kẻ bảng (Borders)
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
        };
      });
    });

    // Xuất file
    const uint8Array = await workbook.xlsx.writeBuffer();
    const blob = new Blob([uint8Array], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const date = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `BaoCao_TonKho_${date}.xlsx`;
    link.click();
    
    URL.revokeObjectURL(url);
    showToast('Xuất báo cáo Excel thành công!', 'success');

  } catch (err) {
    showToast('Lỗi xuất Excel: ' + err.message, 'error');
  }
}

// ============================================
// UI Rendering
// ============================================

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
}

function renderProducts(products) {
  const tbody = document.getElementById('products-tbody');

  // Cache materials for the form dropdown
  const uniqueMaterials = new Map();
  products.forEach(p => uniqueMaterials.set(p.MaCL, p.TenCL));
  materialsCache = Array.from(uniqueMaterials, ([MaCL, TenCL]) => ({ MaCL, TenCL }));

  if (!products || products.length === 0) {
    renderEmptyState('Không có sản phẩm nào');
    document.getElementById('product-count').textContent = '0 sản phẩm';
    return;
  }

  document.getElementById('product-count').textContent = `${products.length} sản phẩm`;

  tbody.innerHTML = products.map((p, i) => `
    <tr style="animation: fadeInRow 0.4s ease ${i * 0.05}s both;">
      <td><span class="cell-id">${escapeHtml(p.MaSP)}</span></td>
      <td><span class="cell-name">${escapeHtml(p.TenSP)}</span></td>
      <td><span class="cell-material">${escapeHtml(p.TenCL)}</span></td>
      <td>${escapeHtml(p.MoTa || '—')}</td>
      <td><span class="cell-price-buy">${formatCurrency(p.GiaNhap)}</span></td>
      <td><span class="cell-price">${formatCurrency(p.GiaBan)}</span></td>
      <td><span class="cell-stock ${p.Soluong > 0 ? 'in-stock' : 'out-stock'}">${p.Soluong}</span></td>
      <td>
        <div class="cell-actions">
          <button class="btn btn-ghost btn-sm" onclick='openEditForm(${JSON.stringify(p).replace(/'/g, "&#39;")})' title="Sửa">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Sửa
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteProduct('${escapeHtml(p.MaSP)}', '${escapeHtml(p.TenSP)}')" title="Xóa">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            Xóa
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  // Add the row animation keyframe dynamically
  if (!document.getElementById('row-animation-style')) {
    const style = document.createElement('style');
    style.id = 'row-animation-style';
    style.textContent = `
      @keyframes fadeInRow {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }
}

function renderEmptyState(message) {
  const tbody = document.getElementById('products-tbody');
  tbody.innerHTML = `
    <tr class="empty-row">
      <td colspan="8">
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <p>${message}</p>
        </div>
      </td>
    </tr>
  `;
}

function showTableLoading() {
  const tbody = document.getElementById('products-tbody');
  tbody.innerHTML = `
    <tr class="empty-row">
      <td colspan="8">
        <div class="empty-state">
          <div class="spinner" style="width:32px;height:32px;border-width:3px;"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </td>
    </tr>
  `;
}

function updateStats(products) {
  const total = products.length;
  const inStock = products.filter(p => p.Soluong > 0).length;
  const outStock = total - inStock;

  animateNumber('stat-total', total);
  animateNumber('stat-instock', inStock);
  animateNumber('stat-outstock', outStock);
}

function animateNumber(elementId, target) {
  const el = document.getElementById(elementId);
  const current = parseInt(el.textContent) || 0;
  const diff = target - current;
  const duration = 400;
  const start = performance.now();

  function step(timestamp) {
    const progress = Math.min((timestamp - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    el.textContent = Math.round(current + diff * eased);
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// ============================================
// Modal / Form
// ============================================

function populateMaterialDropdown() {
  const select = document.getElementById('form-macl');
  const currentValue = select.value;
  select.innerHTML = '<option value="">-- Chọn chất liệu --</option>';
  materialsCache.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.MaCL;
    opt.textContent = `${m.MaCL} - ${m.TenCL}`;
    select.appendChild(opt);
  });
  if (currentValue) select.value = currentValue;
}

function openAddForm() {
  isEditMode = false;
  editingId = null;
  document.getElementById('modal-title').textContent = 'Thêm sản phẩm mới';
  document.getElementById('btn-submit').innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
    Thêm sản phẩm
  `;
  document.getElementById('form-masp').disabled = false;
  document.getElementById('product-form').reset();
  populateMaterialDropdown();
  document.getElementById('modal-overlay').classList.add('active');
  document.getElementById('form-masp').focus();
}

function openEditForm(product) {
  isEditMode = true;
  editingId = product.MaSP;
  document.getElementById('modal-title').textContent = 'Cập nhật sản phẩm';
  document.getElementById('btn-submit').innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
    Cập nhật
  `;
  populateMaterialDropdown();

  document.getElementById('form-masp').value = product.MaSP;
  document.getElementById('form-masp').disabled = true;
  document.getElementById('form-tensp').value = product.TenSP;
  document.getElementById('form-macl').value = product.MaCL;
  document.getElementById('form-mota').value = product.MoTa || '';
  document.getElementById('form-gianhap').value = product.GiaNhap;
  document.getElementById('form-giaban').value = product.GiaBan;
  document.getElementById('form-soluong').value = product.Soluong;

  document.getElementById('modal-overlay').classList.add('active');
  document.getElementById('form-tensp').focus();
}

function closeForm() {
  document.getElementById('modal-overlay').classList.remove('active');
  document.getElementById('product-form').reset();
  isEditMode = false;
  editingId = null;
}

function closeModal(event) {
  if (event.target === document.getElementById('modal-overlay')) {
    closeForm();
  }
}

function handleSubmit(event) {
  event.preventDefault();

  const productData = {
    MaSP: document.getElementById('form-masp').value.trim(),
    TenSP: document.getElementById('form-tensp').value.trim(),
    MaCL: document.getElementById('form-macl').value,
    MoTa: document.getElementById('form-mota').value.trim(),
    GiaNhap: parseFloat(document.getElementById('form-gianhap').value) || 0,
    GiaBan: parseFloat(document.getElementById('form-giaban').value) || 0,
    Soluong: parseInt(document.getElementById('form-soluong').value) || 0
  };

  if (isEditMode) {
    updateProduct(editingId, productData);
  } else {
    addProduct(productData);
  }
}

// ============================================
// Toast Notifications
// ============================================

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');

  const icons = {
    success: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    error: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ============================================
// Utilities
// ============================================

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
