import re

with open('admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

scripts = re.findall(r'<script>(.*?)</script>', content, re.DOTALL)
js = scripts[-1] if scripts else ''

# Write to temp file
open('/tmp/admin_check.js', 'w', encoding='utf-8').write(js)
print(f'Script length: {len(js)} chars, {len(js.splitlines())} lines')

# Brace/paren count
print(f'Braces: {{ {js.count("{")} }} {js.count("}")}')
print(f'Parens: ( {js.count("(")} ) {js.count(")")}')

# Check security
print()
if 'AUTH_PASS' in js and 'AUTH_HASH' not in js:
    print('! Still has AUTH_PASS without AUTH_HASH')
elif 'AUTH_HASH' in js:
    print('OK: Uses AUTH_HASH')

# Find the doLogin function to check it's complete
idx = js.find('function doLogin')
if idx >= 0:
    # Find the matching closing brace by counting
    end = idx + len('function doLogin')
    depth = 0
    in_string = False
    string_char = None
    while end < len(js):
        ch = js[end]
        if in_string:
            if ch == '\\':
                end += 2
                continue
            if ch == string_char:
                in_string = False
        elif ch in '\'"':
            in_string = True
            string_char = ch
        elif ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                break
        end += 1
    
    func_body = js[idx:end+1]
    print(f'doLogin function: {len(func_body)} chars, ends at char {end}')
    
    # Check if there's something after the function that looks wrong
    after = js[end+1:end+100].strip()
    if after and after[0] not in ';/':
        print(f'! Unexpected content after doLogin: "{after[:50]}"')

print()
print('Syntax check complete')
