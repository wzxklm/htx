// API端点
const API_URL = 'http://8.138.35.63:7861/api/v1/webhook/d1e184bf-bdf9-4abc-9d32-f459ab3da52f';

// 存储响应内容的变量
let responseContent = '';

// 显示错误消息
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;

    const container = document.querySelector('.container');
    container.insertBefore(errorDiv, container.firstChild);

    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// 显示成功消息
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;

    const container = document.querySelector('.container');
    container.insertBefore(successDiv, container.firstChild);

    setTimeout(() => {
        successDiv.remove();
    }, 5000);
}

// 更新响应内容显示
function updateResponseContent(content) {
    const responseContainer = document.getElementById('response-content');
    if (!content) {
        responseContainer.innerHTML = '<div class="no-response-message">暂无回复内容</div>';
        return;
    }

    const responseItem = document.createElement('div');
    responseItem.className = 'response-item';
    responseItem.textContent = content;

    responseContainer.innerHTML = '';
    responseContainer.appendChild(responseItem);
}

// 显示加载状态
function showLoading() {
    const responseContainer = document.getElementById('response-content');
    responseContainer.innerHTML = '<div class="loading">正在处理请求</div>';
}

// 发送API请求
async function sendRequest(email) {
    showLoading();

    try {
        const response = await fetch(API_URL + '?stream=false', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                payload: {
                    sender: `${email}`,
                    preview: '你好',
                },
                out: 'messsage'
            })
        });

        if (!response.ok) {
            throw new Error('请求失败');
        }

        const data = await response.json();
        responseContent = data;
        updateResponseContent(JSON.stringify(data, null, 2));
        showSuccess('请求已成功处理');

    } catch (error) {
        console.error('API请求失败:', error);
        showError('请求处理失败: ' + error.message);
        updateResponseContent('');
    }
}

// 处理表单提交
async function handleSubmit(event) {
    event.preventDefault();

    const emailInput = document.getElementById('email-input');
    const email = emailInput.value.trim();

    if (!email) {
        showError('请输入邮箱地址');
        return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('请输入有效的邮箱地址');
        return;
    }

    await sendRequest(email);
}

// 页面退出时清空响应内容
window.addEventListener('beforeunload', () => {
    responseContent = '';
    updateResponseContent('');
});

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 绑定表单提交事件
    document.getElementById('email-form').addEventListener('submit', handleSubmit);

    // 初始化响应内容显示
    updateResponseContent('');
});
