#!/bin/bash
# 生成自签名 SSL 证书（仅用于开发/测试环境）
# 生产环境请替换为正式证书

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SSL_DIR="$SCRIPT_DIR/ssl"

mkdir -p "$SSL_DIR"

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$SSL_DIR/server.key" \
  -out "$SSL_DIR/server.crt" \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=SpaceHunter/CN=localhost"

echo "SSL 证书已生成到 $SSL_DIR/"
echo "  server.crt - 证书文件"
echo "  server.key - 私钥文件"
