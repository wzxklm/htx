const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 8090; // 本地监听端口
const externalUrl = 'http://8.138.35.63:8091'; // 外部访问地址（通过端口映射）

// Enable CORS
app.use(cors());

// Serve static files from public directory
app.use(express.static('public'));
app.use('/uploads', express.static('data/uploads'));

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use data/uploads directory for file storage
    const filesDir = 'data/uploads';
    console.log('文件保存目录:', filesDir);
    
    // Ensure the directory exists
    if (!fs.existsSync(filesDir)) {
      console.log('创建文件目录:', filesDir);
      fs.mkdirSync(filesDir, { recursive: true });
    }
    
    // Check if directory is writable
    try {
      fs.accessSync(filesDir, fs.constants.W_OK);
      console.log('文件目录可写');
    } catch (err) {
      console.error('文件目录不可写:', err);
    }
    
    cb(null, filesDir);
  },
  filename: function (req, file, cb) {
    // Use original filename with timestamp to avoid duplicates
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + '-' + file.originalname;
    console.log('生成的文件名:', filename);
    cb(null, filename);
  }
});

// No file size limits
const upload = multer({ storage: storage });

// Store file metadata
let fileDatabase = [];
const databaseFile = 'data/uploads/database.json';

// Load existing file database if it exists
if (fs.existsSync(databaseFile)) {
  try {
    const data = fs.readFileSync(databaseFile, 'utf8');
    fileDatabase = JSON.parse(data);
    console.log(`已加载 ${fileDatabase.length} 个文件记录`);
  } catch (err) {
    console.error('Error reading database file:', err);
  }
} else {
  console.log('数据库文件不存在，将在首次上传时创建');
}

// Save database to file
function saveDatabase() {
  try {
    // Ensure the directory exists before saving
    const databaseDir = path.dirname(databaseFile);
    if (!fs.existsSync(databaseDir)) {
      fs.mkdirSync(databaseDir, { recursive: true });
      console.log('创建数据库目录:', databaseDir);
    }
    
    fs.writeFileSync(databaseFile, JSON.stringify(fileDatabase, null, 2), 'utf8');
    console.log(`已保存 ${fileDatabase.length} 个文件记录到数据库`);
  } catch (err) {
    console.error('Error saving database file:', err);
  }
}

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Handle file upload
app.post('/api/upload', (req, res, next) => {
  console.log('接收到文件上传请求');
  next();
}, upload.single('file'), (req, res) => {
  try {
    console.log('处理文件上传请求');
    
    if (!req.file) {
      console.error('没有接收到文件');
      return res.status(400).json({ error: '没有选择文件' });
    }
    
    console.log('文件信息:', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

    const description = req.body.description || '';
    console.log('文件描述:', description);
    
    // Create file metadata
    const fileData = {
      id: Date.now().toString(),
      name: req.file.originalname,
      filename: req.file.filename,
      type: req.file.mimetype,
      size: req.file.size,
      description: description,
      timestamp: Date.now(),
      path: `${externalUrl}/uploads/${req.file.filename}` // 使用外部URL和新的uploads路径
    };
    
    // Add to database
    fileDatabase.push(fileData);
    saveDatabase();
    console.log('文件元数据已保存到数据库');
    
    res.json(fileData);
    console.log('文件上传成功');
  } catch (error) {
    console.error('上传处理失败:', error);
    res.status(500).json({ error: '文件上传失败: ' + error.message });
  }
});

// Get all files
app.get('/api/files-list', (req, res) => {
  try {
    // Sort by timestamp in descending order (newest first)
    const sortedFiles = [...fileDatabase].sort((a, b) => b.timestamp - a.timestamp);
    console.log(`返回 ${sortedFiles.length} 个文件记录`);
    res.json(sortedFiles);
  } catch (error) {
    console.error('获取文件列表失败:', error);
    res.status(500).json({ error: '获取文件列表失败: ' + error.message });
  }
});

// Delete a file
app.delete('/api/files/:id', (req, res) => {
  try {
    const fileId = req.params.id;
    console.log(`接收到删除文件请求，文件ID: ${fileId}`);
    
    // Find the file in the database
    const fileIndex = fileDatabase.findIndex(file => file.id === fileId);
    
    if (fileIndex === -1) {
      console.error(`文件不存在，ID: ${fileId}`);
      return res.status(404).json({ error: '文件不存在' });
    }
    
    const fileData = fileDatabase[fileIndex];
    console.log('要删除的文件信息:', fileData);
    
    // Extract filename from path
    const filename = fileData.filename;
    
    // Remove the file from the filesystem
    const filePath = path.join('data/uploads', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`已删除文件: ${filePath}`);
    } else {
      console.warn(`文件不存在于文件系统: ${filePath}`);
    }
    
    // Remove the file from the database
    fileDatabase.splice(fileIndex, 1);
    saveDatabase();
    console.log('文件已从数据库中删除');
    
    res.json({ success: true, message: '文件删除成功' });
  } catch (error) {
    console.error('删除文件失败:', error);
    res.status(500).json({ error: '删除文件失败: ' + error.message });
  }
});

// Server status route for health checks
app.get('/api/status', (req, res) => {
  try {
    const filesDir = 'data/uploads';
    const dirExists = fs.existsSync(filesDir);
    let dirWritable = false;
    
    try {
      fs.accessSync(filesDir, fs.constants.W_OK);
      dirWritable = true;
    } catch (err) {
      // Directory is not writable
    }
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      filesDirectory: {
        path: filesDir,
        exists: dirExists,
        writable: dirWritable
      },
      database: {
        path: databaseFile,
        exists: fs.existsSync(databaseFile),
        fileCount: fileDatabase.length
      }
    });
  } catch (error) {
    console.error('状态检查失败:', error);
    res.status(500).json({ error: '状态检查失败: ' + error.message });
  }
});

// Start the server - listen on all interfaces (0.0.0.0) to allow external connections
app.listen(port, '0.0.0.0', () => {
  console.log(`服务器本地运行在 http://localhost:${port}`);
  console.log(`外部访问地址: ${externalUrl}`);
});
