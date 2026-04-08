const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/db');

// API 1: GET /api/products - Lấy toàn bộ sản phẩm (JOIN tblChatLieu)
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT sp.MaSP, sp.TenSP, sp.MaCL, cl.TenCL, sp.MoTa, sp.GiaNhap, sp.GiaBan, sp.Soluong
      FROM tblSanPham sp
      INNER JOIN tblChatLieu cl ON sp.MaCL = cl.MaCL
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API 2: GET /api/products/search?name={name}&material={material}
router.get('/search', async (req, res) => {
  try {
    const { name, material } = req.query;
    const pool = await getPool();
    const request = pool.request();

    let query = `
      SELECT sp.MaSP, sp.TenSP, sp.MaCL, cl.TenCL, sp.MoTa, sp.GiaNhap, sp.GiaBan, sp.Soluong
      FROM tblSanPham sp
      INNER JOIN tblChatLieu cl ON sp.MaCL = cl.MaCL
      WHERE 1=1
    `;

    if (name) {
      request.input('name', sql.NVarChar, `%${name}%`);
      query += ` AND sp.TenSP LIKE @name`;
    }
    if (material) {
      request.input('material', sql.NVarChar, `%${material}%`);
      query += ` AND cl.TenCL LIKE @material`;
    }

    const result = await request.query(query);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API 3: GET /api/products/instock - Sản phẩm tồn kho (Soluong > 0)
router.get('/instock', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT sp.MaSP, sp.TenSP, sp.MaCL, cl.TenCL, sp.MoTa, sp.GiaNhap, sp.GiaBan, sp.Soluong
      FROM tblSanPham sp
      INNER JOIN tblChatLieu cl ON sp.MaCL = cl.MaCL
      WHERE sp.Soluong > 0
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API 4: POST /api/products - Thêm mới sản phẩm
router.post('/', async (req, res) => {
  try {
    const { MaSP, TenSP, MaCL, MoTa, GiaNhap, GiaBan, Soluong } = req.body;

    if (!MaSP || !TenSP || !MaCL) {
      return res.status(400).json({ success: false, message: 'MaSP, TenSP, MaCL là bắt buộc.' });
    }

    const pool = await getPool();
    await pool.request()
      .input('MaSP', sql.NVarChar(10), MaSP)
      .input('TenSP', sql.NVarChar(100), TenSP)
      .input('MaCL', sql.NVarChar(10), MaCL)
      .input('MoTa', sql.NVarChar(255), MoTa || '')
      .input('GiaNhap', sql.Decimal(18, 2), GiaNhap || 0)
      .input('GiaBan', sql.Decimal(18, 2), GiaBan || 0)
      .input('Soluong', sql.Int, Soluong || 0)
      .query(`
        INSERT INTO tblSanPham (MaSP, TenSP, MaCL, MoTa, GiaNhap, GiaBan, Soluong)
        VALUES (@MaSP, @TenSP, @MaCL, @MoTa, @GiaNhap, @GiaBan, @Soluong)
      `);

    res.status(201).json({ success: true, message: 'Thêm sản phẩm thành công.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API 5: PUT /api/products/:id - Cập nhật sản phẩm
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { TenSP, MaCL, MoTa, GiaNhap, GiaBan, Soluong } = req.body;

    const pool = await getPool();
    const result = await pool.request()
      .input('MaSP', sql.NVarChar(10), id)
      .input('TenSP', sql.NVarChar(100), TenSP)
      .input('MaCL', sql.NVarChar(10), MaCL)
      .input('MoTa', sql.NVarChar(255), MoTa || '')
      .input('GiaNhap', sql.Decimal(18, 2), GiaNhap || 0)
      .input('GiaBan', sql.Decimal(18, 2), GiaBan || 0)
      .input('Soluong', sql.Int, Soluong || 0)
      .query(`
        UPDATE tblSanPham
        SET TenSP = @TenSP, MaCL = @MaCL, MoTa = @MoTa,
            GiaNhap = @GiaNhap, GiaBan = @GiaBan, Soluong = @Soluong
        WHERE MaSP = @MaSP
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });
    }

    res.json({ success: true, message: 'Cập nhật sản phẩm thành công.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API 6: DELETE /api/products/:id - Xóa sản phẩm
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const result = await pool.request()
      .input('MaSP', sql.NVarChar(10), id)
      .query('DELETE FROM tblSanPham WHERE MaSP = @MaSP');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });
    }

    res.json({ success: true, message: 'Xóa sản phẩm thành công.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
