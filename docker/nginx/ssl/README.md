# SSL 证书目录

此目录用于存放 Nginx SSL 证书文件。

## 开发环境

运行 `../generate-dev-cert.sh` 生成自签名证书：

```bash
bash ../generate-dev-cert.sh
```

将生成：
- `server.crt` - 证书文件
- `server.key` - 私钥文件

## 生产环境

替换为正式 SSL 证书：
1. 将证书文件命名为 `server.crt`
2. 将私钥文件命名为 `server.key`
3. 或修改 `docker-compose.yml` 中的挂载路径
