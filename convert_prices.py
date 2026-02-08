import re

with open('js/data.js', 'r') as f:
    content = f.read()

# Convert prices from USD to LKR (multiply by 330)
def convert_price(match):
    price = float(match.group(1))
    lkr_price = int(round(price * 330))
    return f"price: {lkr_price}"

def convert_retail(match):
    price = float(match.group(1))
    lkr_price = int(round(price * 330))
    return f"retailPrice: {lkr_price}"

def convert_wholesale(match):
    price = float(match.group(1))
    lkr_price = int(round(price * 330))
    return f"wholesalePrice: {lkr_price}"

content = re.sub(r'price: ([\d.]+)', convert_price, content)
content = re.sub(r'retailPrice: ([\d.]+)', convert_retail, content)
content = re.sub(r'wholesalePrice: ([\d.]+)', convert_wholesale, content)

with open('js/data.js', 'w') as f:
    f.write(content)

print("✓ Converted all prices from USD to LKR (×330)")
