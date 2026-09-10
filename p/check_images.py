import json, re, os

with open('p/data.js','r',encoding='utf-8') as f:
    text = f.read()

json_text = re.sub(r'const\s+DATA_VERSION\s*=\s*["\'][^"\']*["\'];?', '', text)
json_text = re.sub(r'const\s+PRODUCTS\s*=\s*', '', json_text).strip()
if json_text.endswith(';'):
    json_text = json_text[:-1].strip()
products = json.loads(json_text)

referenced = set()
for p in products:
    if p.get('image'): referenced.add(p['image'].replace('images/', ''))
    if p.get('options'):
        for v in p['options']:
            if v.get('image'): referenced.add(v['image'].replace('images/', ''))

actual = set(os.listdir('p/images/'))
missing = referenced - actual
unused = actual - referenced

print('=== Image File Check ===')
print(f'Referenced in data.js: {len(referenced)}')
print(f'Actual files in images/: {len(actual)}')
print(f'Referenced but MISSING: {len(missing)}')
for m in sorted(missing):
    print(f'  - {m}')
print(f'\nUnused in images/: {len(unused)}')
for u in sorted(unused)[:15]:
    print(f'  - {u}')
if len(unused) > 15:
    print(f'  ... and {len(unused)-15} more')

empty_main = [p['model'] for p in products if not p.get('image')]
print(f'\nMain products with empty image: {len(empty_main)}')
for m in empty_main:
    print(f'  - {m}')

empty_variant = []
for p in products:
    if p.get('options'):
        for v in p['options']:
            if not v.get('image'):
                empty_variant.append(f"{p['model']} -> {v['model']}")
print(f'\nVariants with empty image: {len(empty_variant)}')
for v in empty_variant[:10]:
    print(f'  - {v}')
if len(empty_variant) > 10:
    print(f'  ... and {len(empty_variant)-10} more')
