filepath = 'c:/Rpk/Earnest Minds/React/Sales Order/frontend/src/app/(app)/_layout.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("'#18181A' : '#f1f5f9'", "'#18181A' : '#ffffff'")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated')
