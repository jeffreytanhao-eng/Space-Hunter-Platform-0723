#!/usr/bin/env python3
"""调试 API：用 Python requests 直接测试"""
import paramiko
import time

HOST = "39.106.193.166"
USER = "root"
PASSWORD = "Asd1asd1!"

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=30)

    # 用宿主机 Python 测试（绕过容器，直接访问映射的端口）
    # 但 backend 只 expose 不映射端口，所以需要通过 docker exec 在容器内用 python3
    print("=== 在容器内用 Python requests 测试 ===")
    script = """
import http.client
import json
import os

# 创建 multipart form data
boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
body = b''

# file field
with open('/tmp/test_astro.jpg', 'rb') as f:
    file_data = f.read()
body += f'--{boundary}\\r\\n'.encode()
body += b'Content-Disposition: form-data; name="file"; filename="test_astro.jpg"\\r\\n'
body += b'Content-Type: image/jpeg\\r\\n\\r\\n'
body += file_data + b'\\r\\n'

# other fields
for key, val in [('sessionId', 'test_session_001'), ('beta', '4.0'), ('residualRef', '50'), ('style', 'deepspace'), ('intensity', '0.5')]:
    body += f'--{boundary}\\r\\n'.encode()
    body += f'Content-Disposition: form-data; name="{key}"\\r\\n\\r\\n'.encode()
    body += f'{val}\\r\\n'.encode()

body += f'--{boundary}--\\r\\n'.encode()

conn = http.client.HTTPConnection('localhost', 3000, timeout=30)
headers = {
    'Content-Type': f'multipart/form-data; boundary={boundary}',
    'Origin': 'http://localhost:3000',
}
conn.request('POST', '/image-process/process', body, headers)
resp = conn.getresponse()
print(f'Status: {resp.status} {resp.reason}')
data = resp.read().decode()
print(f'Body: {data}')
conn.close()
"""

    # 先生成测试图
    stdin, stdout, stderr = ssh.exec_command(
        """docker exec spacehunter-backend-1 python3 -c "
from PIL import Image; import numpy as np
img = np.zeros((400, 400, 3), dtype=np.uint8)
for y in range(400):
    for x in range(400):
        img[y, x] = [x % 256, y % 256, (x+y) % 256]
Image.fromarray(img).save('/tmp/test_astro.jpg', quality=95)
print('test image created')
" """
    )
    stdout.channel.recv_exit_status()
    print(stdout.read().decode())

    # 执行测试脚本
    escaped_script = script.replace("'", "'\\''").replace("\n", "\\n")
    stdin, stdout, stderr = ssh.exec_command(
        f"docker exec spacehunter-backend-1 python3 -c '{escaped_script}'",
        timeout=30
    )
    stdout.channel.recv_exit_status()
    print("STDOUT:", stdout.read().decode())
    err = stderr.read().decode()
    if err:
        print("STDERR:", err)

    # 等 5 秒
    print("\n等待 5 秒...")
    time.sleep(5)

    # 查询历史
    print("\n=== 查询历史 ===")
    stdin, stdout, stderr = ssh.exec_command(
        """docker exec spacehunter-backend-1 python3 -c "
import http.client, json
conn = http.client.HTTPConnection('localhost', 3000, timeout=10)
conn.request('GET', '/image-process/history?sessionId=test_session_001')
resp = conn.getresponse()
print(f'Status: {resp.status}')
print(resp.read().decode())
conn.close()
" """, timeout=15
    )
    stdout.channel.recv_exit_status()
    print(stdout.read().decode())
    err = stderr.read().decode()
    if err:
        print("STDERR:", err)

    # 检查日志
    print("\n=== backend 日志 ===")
    stdin, stdout, stderr = ssh.exec_command(
        "docker logs spacehunter-backend-1 --tail 15 2>&1", timeout=10
    )
    stdout.channel.recv_exit_status()
    print(stdout.read().decode())

    # 检查文件
    print("\n=== 检查生成文件 ===")
    stdin, stdout, stderr = ssh.exec_command(
        "docker exec spacehunter-backend-1 ls -laR /app/packages/server/uploads/image-process/ 2>&1 || echo 'No files'",
        timeout=10
    )
    stdout.channel.recv_exit_status()
    print(stdout.read().decode())

    ssh.close()

if __name__ == "__main__":
    main()
