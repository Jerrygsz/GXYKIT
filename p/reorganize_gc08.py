import json
import re

# Read data.js
with open('data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract version and JSON data
version_match = re.search(r"const DATA_VERSION = '([^']+)'", content)
version = version_match.group(1) if version_match else 'unknown'

# Parse JSON data
json_text = re.sub(r'const\s+DATA_VERSION\s*=\s*["\'][^"\']*["\'];?', '', content)
json_text = re.sub(r'const\s+PRODUCTS\s*=\s*', '', json_text).strip()
if json_text.endswith(';'):
    json_text = json_text[:-1].strip()

products = json.loads(json_text)

# Separate GC08 and non-GC08 products
non_gc08 = []
gc08_entries = []

for p in products:
    if p['model'].startswith('GC08'):
        gc08_entries.append(p)
    else:
        non_gc08.append(p)

print(f"Found {len(gc08_entries)} GC08 entries to remove:")
for p in gc08_entries:
    print(f"  - {p['model']}")

# Base GC08 specs from Excel (GC08 PD+L configuration)
base_specs = {
    "category": "Car Charger",
    "type_cn": "伸缩线车充",
    "type_en": "Retractable Cable Car Charger",
    "image": "images/GC08.jpg",
    "dim": "61 x 33.5 x 153 mm",
    "weight": "143.8 g",
    "cable": "80CM",
    "p_sample": "50.0",
    "p_500": "45.0",
    "p_2000": "43.0",
    "p_5000": "42.0",
    "nw": "143.8 g",
    "gw": "178 g",
    "acc": "User Manual x1",
    "material": "Aluminum Alloy + PC + ABS",
    "input_v": "DC 12V-24V",
    "desc": "Output Ports: 4\nTotal Output: Max 90W\nInput: DC 12V-24V Max 5.0A\nPD Retractable Cable Output: 5V/3A,9V/3A,12V/3A,15V/3A,20V/3.25A(Max 65W)\niOS Retractable Charging Cable Output: 5V/2.4A\nUSB + Type-C Simultaneous Output: 5V/3.2A\nSolo Use Max Output: 5V/3A\nRetractable Cable Length: Total Length 80cm\n(Effective Length 78cm ± 1cm)\nCar Charger Material: Aluminum Alloy + PC + ABS\n7-Color LED Light: One-Touch Switch",
    "features": "Colorful Lights, Smart Protection, 360° Rotation, Universal for Cars"
}

# Create 6 new GC08 entries
new_gc08 = []

# 1. GC08 PD+L (Pure Car Charger - Main)
gc08_pdl = {**base_specs}
gc08_pdl["model"] = "GC08 PD+L"
gc08_pdl["power"] = "Total 65W+25W"
gc08_pdl["ports"] = "PD 65W + Lightning 12W | Retractable Cable"
new_gc08.append(gc08_pdl)

# 2. GC08 PD+C (Pure Car Charger - Variant)
gc08_pdc = {**base_specs}
gc08_pdc["model"] = "GC08 PD+C"
gc08_pdc["power"] = "Total 65W+25W"
gc08_pdc["ports"] = "PD 65W + USB-C 18W | Retractable Cable"
gc08_pdc["desc"] = gc08_pdc["desc"].replace("iOS Retractable Charging Cable Output: 5V/2.4A", "USB-C Retractable Cable Output: 5V/3A,9V/2A,12V/1.5A (18W)")
new_gc08.append(gc08_pdc)

# 3. GC08 2PD (Pure Car Charger - Variant)
gc08_2pd = {**base_specs}
gc08_2pd["model"] = "GC08 2PD"
gc08_2pd["power"] = "Total 65W+65W"
gc08_2pd["ports"] = "Dual PD 65W | Retractable Cable"
gc08_2pd["desc"] = gc08_2pd["desc"].replace("iOS Retractable Charging Cable Output: 5V/2.4A", "PD Retractable Cable 2 Output: 5V/3A,9V/3A,12V/3A,15V/3A,20V/3.25A (Max 65W)")
new_gc08.append(gc08_2pd)

# 4. GC08-FM(PD+L) (Car Bluetooth MP3 - Main)
gc08_fm_pdl = {**base_specs}
gc08_fm_pdl["model"] = "GC08-FM(PD+L)"
gc08_fm_pdl["category"] = "Car Bluetooth MP3"
gc08_fm_pdl["type_cn"] = "车载蓝牙MP3"
gc08_fm_pdl["type_en"] = "Car MP3 Player"
gc08_fm_pdl["power"] = "Total 65W+25W"
gc08_fm_pdl["ports"] = "PD 65W + Lightning 12W | Retractable Cable"
gc08_fm_pdl["bt"] = "BT 5.4"
gc08_fm_pdl["fm"] = "87.5-108MHz"
gc08_fm_pdl["selling"] = "⚡ PD 65W Fast Charge + Lightning Cable\n🎵 Bluetooth 5.4 FM Transmitter\n🌈 7-Color LED Light with One-Touch Switch"
new_gc08.append(gc08_fm_pdl)

# 5. GC08-FM(PD+C) (Car Bluetooth MP3 - Variant)
gc08_fm_pdc = {**base_specs}
gc08_fm_pdc["model"] = "GC08-FM(PD+C)"
gc08_fm_pdc["category"] = "Car Bluetooth MP3"
gc08_fm_pdc["type_cn"] = "车载蓝牙MP3"
gc08_fm_pdc["type_en"] = "Car MP3 Player"
gc08_fm_pdc["power"] = "Total 65W+25W"
gc08_fm_pdc["ports"] = "PD 65W + USB-C 18W | Retractable Cable"
gc08_fm_pdc["bt"] = "BT 5.4"
gc08_fm_pdc["fm"] = "87.5-108MHz"
gc08_fm_pdc["desc"] = gc08_fm_pdc["desc"].replace("iOS Retractable Charging Cable Output: 5V/2.4A", "USB-C Retractable Cable Output: 5V/3A,9V/2A,12V/1.5A (18W)")
gc08_fm_pdc["selling"] = "⚡ PD 65W Fast Charge + USB-C Cable\n🎵 Bluetooth 5.4 FM Transmitter\n🌈 7-Color LED Light with One-Touch Switch"
new_gc08.append(gc08_fm_pdc)

# 6. GC08-FM(2PD) (Car Bluetooth MP3 - Variant)
gc08_fm_2pd = {**base_specs}
gc08_fm_2pd["model"] = "GC08-FM(2PD)"
gc08_fm_2pd["category"] = "Car Bluetooth MP3"
gc08_fm_2pd["type_cn"] = "车载蓝牙MP3"
gc08_fm_2pd["type_en"] = "Car MP3 Player"
gc08_fm_2pd["power"] = "Total 65W+65W"
gc08_fm_2pd["ports"] = "Dual PD 65W | Retractable Cable"
gc08_fm_2pd["bt"] = "BT 5.4"
gc08_fm_2pd["fm"] = "87.5-108MHz"
gc08_fm_2pd["desc"] = gc08_fm_2pd["desc"].replace("iOS Retractable Charging Cable Output: 5V/2.4A", "PD Retractable Cable 2 Output: 5V/3A,9V/3A,12V/3A,15V/3A,20V/3.25A (Max 65W)")
gc08_fm_2pd["selling"] = "⚡ Dual PD 65W Fast Charge\n🎵 Bluetooth 5.4 FM Transmitter\n🌈 7-Color LED Light with One-Touch Switch"
new_gc08.append(gc08_fm_2pd)

# Combine: non-GC08 + new GC08 entries
# Insert new GC08 entries at a reasonable position (after other Car Chargers)
# Find the position of the first Car Charger entry and insert before it
final_products = non_gc08 + new_gc08

# Update version
new_version = "2026-09-11-v16"

# Write back
output = f"const DATA_VERSION = '{new_version}';\nconst PRODUCTS = "
output += json.dumps(final_products, ensure_ascii=False, indent=2)
output += ";\n"

with open('data.js', 'w', encoding='utf-8') as f:
    f.write(output)

print(f"\nReorganization complete:")
print(f"  Removed: {len(gc08_entries)} old GC08 entries")
print(f"  Added: {len(new_gc08)} new GC08 entries")
print(f"  Total products: {len(final_products)}")
print(f"  Version: {new_version}")
print(f"\nNew GC08 entries:")
for p in new_gc08:
    print(f"  + {p['model']} ({p['category']})")
