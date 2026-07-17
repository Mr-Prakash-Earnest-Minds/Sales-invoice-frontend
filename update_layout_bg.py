filepath = 'c:/Rpk/Earnest Minds/React/Sales Order/frontend/src/app/(app)/_layout.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Update tabBarStyle
content = content.replace("backgroundColor: 'transparent',", "backgroundColor: '#ffffff', borderRadius: 30, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10,")

# Update inactive pill backgrounds to transparent so they blend with the white container
content = content.replace("backgroundColor: focused ? '#18181A' : '#ffffff',", "backgroundColor: focused ? '#18181A' : 'transparent',")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated tab menu background to white')
