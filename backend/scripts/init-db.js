/**
 * Script khởi tạo Database, bảng và dữ liệu mẫu
 * Chạy: node scripts/init-db.js
 */
const sql = require('mssql/msnodesqlv8');

const masterConfig = {
  server: 'localhost',
  database: 'master',
  driver: 'ODBC Driver 18 for SQL Server',
  options: {
    instanceName: 'SQLEXPRESS',
    trustedConnection: true,
    trustServerCertificate: true
  }
};

async function initDatabase() {
  let pool;
  try {
    console.log('🔌 Đang kết nối SQL Server...');
    pool = await sql.connect(masterConfig);
    console.log('✅ Kết nối thành công!\n');

    // Tạo database DuLieu
    console.log('📦 Đang tạo database DuLieu...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'DuLieu')
      BEGIN
        CREATE DATABASE DuLieu;
      END
    `);
    console.log('✅ Database DuLieu đã sẵn sàng!\n');

    // Chuyển sang database DuLieu
    await pool.close();
    pool = await sql.connect({ ...masterConfig, database: 'DuLieu' });

    // Tạo bảng tblChatLieu
    console.log('📋 Đang tạo bảng tblChatLieu...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tblChatLieu' AND xtype='U')
      BEGIN
        CREATE TABLE tblChatLieu (
          MaCL NVARCHAR(10) PRIMARY KEY,
          TenCL NVARCHAR(100) NOT NULL
        );
      END
    `);
    console.log('✅ Bảng tblChatLieu đã tạo!\n');

    // Tạo bảng tblSanPham
    console.log('📋 Đang tạo bảng tblSanPham...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tblSanPham' AND xtype='U')
      BEGIN
        CREATE TABLE tblSanPham (
          MaSP NVARCHAR(10) PRIMARY KEY,
          TenSP NVARCHAR(100) NOT NULL,
          MaCL NVARCHAR(10) NOT NULL,
          MoTa NVARCHAR(255),
          GiaNhap DECIMAL(18,2) DEFAULT 0,
          GiaBan DECIMAL(18,2) DEFAULT 0,
          Soluong INT DEFAULT 0,
          CONSTRAINT FK_SanPham_ChatLieu FOREIGN KEY (MaCL)
            REFERENCES tblChatLieu(MaCL)
        );
      END
    `);
    console.log('✅ Bảng tblSanPham đã tạo!\n');

    // Nhập dữ liệu mẫu tblChatLieu
    console.log('📝 Đang nhập dữ liệu mẫu...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM tblChatLieu)
      BEGIN
        INSERT INTO tblChatLieu (MaCL, TenCL) VALUES
          (N'CL01', N'Vải Cotton'),
          (N'CL02', N'Da thật'),
          (N'CL03', N'Nhựa cao cấp');
      END
    `);
    console.log('✅ Dữ liệu tblChatLieu đã nhập!\n');

    // Nhập dữ liệu mẫu tblSanPham
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM tblSanPham)
      BEGIN
        INSERT INTO tblSanPham (MaSP, TenSP, MaCL, MoTa, GiaNhap, GiaBan, Soluong) VALUES
          (N'SP01', N'Áo thun nam', N'CL01', N'Áo thun cotton thoáng mát', 120000, 250000, 50),
          (N'SP02', N'Ví da nam', N'CL02', N'Ví da bò cao cấp', 300000, 550000, 30),
          (N'SP03', N'Ốp lưng điện thoại', N'CL03', N'Ốp lưng nhựa cứng chống sốc', 50000, 120000, 100);
      END
    `);
    console.log('✅ Dữ liệu tblSanPham đã nhập!\n');

    // Kiểm tra dữ liệu
    const chatLieu = await pool.request().query('SELECT * FROM tblChatLieu');
    const sanPham = await pool.request().query(`
      SELECT sp.*, cl.TenCL FROM tblSanPham sp
      INNER JOIN tblChatLieu cl ON sp.MaCL = cl.MaCL
    `);

    console.log('========================================');
    console.log('📊 DỮ LIỆU HIỆN TẠI:');
    console.log('========================================');
    console.log('\n🏷️  Bảng tblChatLieu:');
    console.table(chatLieu.recordset);
    console.log('\n📦 Bảng tblSanPham:');
    console.table(sanPham.recordset);
    console.log('\n🎉 Khởi tạo database hoàn tất!');

  } catch (err) {
    console.error('❌ Lỗi:', err.message);

    if (err.message.includes('Login failed')) {
      console.log('\n💡 GỢI Ý: Cần bật SQL Authentication và tạo user sa.');
      console.log('   Hoặc chỉnh sửa file config/db.js để dùng Windows Authentication.');
    }
    if (err.message.includes('Could not connect')) {
      console.log('\n💡 GỢI Ý: Kiểm tra SQL Server đã chạy chưa.');
      console.log('   Mở Services.msc và tìm "SQL Server (SQLEXPRESS)".');
    }
    process.exit(1);
  } finally {
    if (pool) await pool.close();
    process.exit(0);
  }
}

initDatabase();
