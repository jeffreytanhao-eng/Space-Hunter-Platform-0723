import json
with open('/home/admin/spacehunter/packages/server/tsconfig.json', 'r') as f:
    config = json.load(f)
config['compilerOptions']['esModuleInterop'] = True
config['compilerOptions']['allowSyntheticDefaultImports'] = True
with open('/home/admin/spacehunter/packages/server/tsconfig.json', 'w') as f:
    json.dump(config, f, indent=2)
print('tsconfig.json 已更新')