// 文件类型图标映射
const fileTypeIcons = {
    'image': '🖼️',
    'text': '📄',
    'video': '🎬',
    'application': '📁',
    'audio': '🎵',
    'default': '📎'
};

// API端点
const API_URL = 'http://8.138.35.63:8091'; // 外部访问地址（通过端口映射）

// 上传文件到服务器
async function uploadFile(file, description) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);
    
    try {
        const response = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '上传失败');
        }
        
        return await response.json();
    } catch (error) {
        console.error('文件上传失败:', error);
        throw error;
    }
}

// 从服务器获取所有文件
async function getAllFiles() {
    try {
        const response = await fetch(`${API_URL}/api/files-list`);
        
        if (!response.ok) {
            throw new Error('获取文件列表失败');
        }
        
        return await response.json();
    } catch (error) {
        console.error('获取文件失败:', error);
        throw error;
    }
}

// 删除文件
async function deleteFile(fileId) {
    try {
        const response = await fetch(`${API_URL}/api/files/${fileId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '删除失败');
        }
        
        return await response.json();
    } catch (error) {
        console.error('文件删除失败:', error);
        throw error;
    }
}

// 获取文件图标
function getFileIcon(fileType) {
    const type = fileType.split('/')[0];
    return fileTypeIcons[type] || fileTypeIcons.default;
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 格式化日期时间
function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// 创建文件查看器模态框
function createFileViewer() {
    // 检查是否已存在查看器
    if (document.getElementById('file-viewer-modal')) {
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'file-viewer-modal';
    modal.className = 'modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-button';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = closeFileViewer;
    
    const fileTitle = document.createElement('h2');
    fileTitle.id = 'viewer-file-title';
    
    const fileViewerContainer = document.createElement('div');
    fileViewerContainer.id = 'file-viewer-container';
    
    modalContent.appendChild(closeBtn);
    modalContent.appendChild(fileTitle);
    modalContent.appendChild(fileViewerContainer);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
    
    // 点击模态框外部关闭
    window.onclick = function(event) {
        if (event.target === modal) {
            closeFileViewer();
        }
    };
}

// 关闭文件查看器
function closeFileViewer() {
    const modal = document.getElementById('file-viewer-modal');
    if (modal) {
        modal.style.display = 'none';
        const container = document.getElementById('file-viewer-container');
        if (container) {
            container.innerHTML = '';
        }
    }
}

// 打开文件查看器
function openFileViewer(file) {
    createFileViewer();
    
    const modal = document.getElementById('file-viewer-modal');
    const fileTitle = document.getElementById('viewer-file-title');
    const container = document.getElementById('file-viewer-container');
    
    fileTitle.textContent = file.name;
    container.innerHTML = '';
    
    const filePath = file.path.startsWith('http') ? file.path : `${API_URL}${file.path}`;
    const fileType = file.type.toLowerCase();
    
    // 根据文件类型显示不同的查看器
    if (fileType.startsWith('image/')) {
        // 图片查看器
        const img = document.createElement('img');
        img.className = 'viewer-image';
        img.src = filePath;
        img.alt = file.name;
        container.appendChild(img);
    } else if (fileType.startsWith('video/')) {
        // 视频查看器
        const video = document.createElement('video');
        video.className = 'viewer-video';
        video.controls = true;
        video.autoplay = false;
        video.src = filePath;
        container.appendChild(video);
    } else if (fileType.startsWith('text/') || fileType === 'application/json') {
        // 文本查看器
        fetchAndDisplayText(filePath, container);
    } else if (fileType === 'application/pdf') {
        // PDF查看器
        const iframe = document.createElement('iframe');
        iframe.className = 'viewer-pdf';
        iframe.src = filePath;
        container.appendChild(iframe);
    } else {
        // 不支持的文件类型
        container.innerHTML = `
            <div class="unsupported-file">
                <p>无法在线预览此类型的文件 (${file.type})。</p>
                <p>请下载后查看。</p>
                <a href="${filePath}" download="${file.name}" class="download-btn">下载文件</a>
            </div>
        `;
    }
    
    modal.style.display = 'block';
}

// 获取并显示文本文件内容
async function fetchAndDisplayText(url, container) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('无法获取文件内容');
        }
        
        const text = await response.text();
        const pre = document.createElement('pre');
        pre.className = 'viewer-text';
        pre.textContent = text;
        container.appendChild(pre);
    } catch (error) {
        container.innerHTML = `<div class="error-message">加载文件内容失败: ${error.message}</div>`;
    }
}

// 渲染文件列表
function renderFilesList(files) {
    const filesList = document.getElementById('files-list');
    
    if (files.length === 0) {
        filesList.innerHTML = '<div class="no-files-message">暂无上传文件</div>';
        return;
    }
    
    filesList.innerHTML = '';
    
    files.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.dataset.fileId = file.id;
        
        const fileIcon = document.createElement('div');
        fileIcon.className = 'file-icon';
        fileIcon.textContent = getFileIcon(file.type);
        
        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';
        
        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        fileName.textContent = file.name;
        
        const fileDescription = document.createElement('div');
        fileDescription.className = 'file-description';
        fileDescription.textContent = file.description;
        
        const fileMeta = document.createElement('div');
        fileMeta.className = 'file-meta';
        fileMeta.textContent = `${formatFileSize(file.size)} · ${formatDateTime(file.timestamp)}`;
        
        fileInfo.appendChild(fileName);
        fileInfo.appendChild(fileDescription);
        fileInfo.appendChild(fileMeta);
        
        const fileActions = document.createElement('div');
        fileActions.className = 'file-actions';
        
        // 查看按钮
        const fileView = document.createElement('button');
        fileView.className = 'file-view';
        fileView.textContent = '查看';
        fileView.onclick = function() {
            openFileViewer(file);
        };
        
        // 下载按钮
        const fileDownload = document.createElement('a');
        fileDownload.className = 'file-download';
        fileDownload.textContent = '下载';
        // 确保文件路径使用完整的服务器URL
        fileDownload.href = file.path.startsWith('http') ? file.path : `${API_URL}${file.path}`;
        fileDownload.download = file.name;
        
        // 删除按钮
        const fileDelete = document.createElement('button');
        fileDelete.className = 'file-delete';
        fileDelete.textContent = '删除';
        fileDelete.onclick = async function() {
            if (confirm(`确定要删除文件 "${file.name}" 吗？`)) {
                try {
                    await deleteFile(file.id);
                    // 重新加载文件列表
                    const updatedFiles = await getAllFiles();
                    renderFilesList(updatedFiles);
                    showError(`文件 "${file.name}" 已成功删除`);
                } catch (error) {
                    console.error('删除文件失败:', error);
                    showError('删除文件失败: ' + error.message);
                }
            }
        };
        
        fileActions.appendChild(fileView);
        fileActions.appendChild(fileDownload);
        fileActions.appendChild(fileDelete);
        
        fileItem.appendChild(fileIcon);
        fileItem.appendChild(fileInfo);
        fileItem.appendChild(fileActions);
        
        filesList.appendChild(fileItem);
    });
}

// 处理文件上传
async function handleFileUpload(event) {
    event.preventDefault();
    
    const fileInput = document.getElementById('file-input');
    const descriptionInput = document.getElementById('file-description');
    
    if (!fileInput.files.length) {
        alert('请选择文件');
        return;
    }
    
    const description = descriptionInput.value.trim();
    if (!description) {
        alert('请输入文件描述');
        return;
    }
    
    const file = fileInput.files[0];
    
    try {
        // 上传文件到服务器
        await uploadFile(file, description);
        
        // 重新加载文件列表
        const files = await getAllFiles();
        renderFilesList(files);
        
        // 重置表单
        document.getElementById('upload-form').reset();
        document.getElementById('file-name').textContent = '未选择文件';
        
        alert('文件上传成功');
    } catch (error) {
        console.error('上传处理失败:', error);
        alert('文件上传失败: ' + error.message);
    }
}


// 更新文件名显示
function updateFileName() {
    const fileInput = document.getElementById('file-input');
    const fileNameSpan = document.getElementById('file-name');
    
    if (fileInput.files.length) {
        fileNameSpan.textContent = fileInput.files[0].name;
    } else {
        fileNameSpan.textContent = '未选择文件';
    }
}

// 显示错误消息
function showError(message) {
    console.error(message);
    
    // 创建错误提示元素
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.color = 'red';
    errorDiv.style.padding = '10px';
    errorDiv.style.marginBottom = '10px';
    errorDiv.style.backgroundColor = '#ffeeee';
    errorDiv.style.borderRadius = '5px';
    errorDiv.style.border = '1px solid #ffaaaa';
    
    // 添加到页面顶部
    const container = document.querySelector('.container');
    container.insertBefore(errorDiv, container.firstChild);
    
    // 5秒后自动移除
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// 检查服务器状态
async function checkServerStatus() {
    try {
        const response = await fetch(`${API_URL}/api/status`);
        if (!response.ok) {
            throw new Error('服务器状态检查失败');
        }
        const status = await response.json();
        console.log('服务器状态:', status);
        return status;
    } catch (error) {
        console.error('服务器状态检查失败:', error);
        throw error;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 检查服务器状态
        try {
            await checkServerStatus();
            console.log('服务器连接成功');
        } catch (error) {
            showError(`无法连接到服务器 (${API_URL})，请确保服务器已启动`);
        }
        
        // 加载文件列表
        try {
            const files = await getAllFiles();
            renderFilesList(files);
        } catch (error) {
            console.error('加载文件列表失败:', error);
            showError('加载文件列表失败: ' + error.message);
        }
        
        // 绑定事件监听器
        document.getElementById('upload-form').addEventListener('submit', handleFileUpload);
        document.getElementById('file-input').addEventListener('change', updateFileName);
    } catch (error) {
        console.error('初始化失败:', error);
        showError('系统初始化失败: ' + error.message);
    }
});
