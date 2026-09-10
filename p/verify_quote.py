with open('p/admin.html','r',encoding='utf-8') as f:
    c = f.read()

checks = [
    ('mergeVariant function', 'function mergeVariant(p, vIdx)'),
    ('getCartItem function', 'function getCartItem(c)'),
    ('cartKey function', 'function cartKey(c)'),
    ('renderVariantSubgrid function', 'function renderVariantSubgrid(parentCard'),
    ('variant subgrid CSS', '.variant-subgrid'),
    ('variant subcard CSS', '.variant-subcard'),
    ('cart item params CSS', '.cart-item-params'),
    ('toggleCart with variantIdx', 'function toggleCart(idx, variantIdx)'),
    ('renderCart uses getCartItem', "const item = getCartItem(c);"),
]

for name, pattern in checks:
    found = pattern in c
    print(f'{name}: {"OK" if found else "MISSING"}')

# Count getCartItem occurrences
print(f'\ngetCartItem occurrences: {c.count("getCartItem")}')
print(f'variantIdx occurrences: {c.count("variantIdx")}')
print(f'Total file length: {len(c)}')
