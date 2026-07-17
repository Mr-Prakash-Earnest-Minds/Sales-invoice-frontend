import sys
import re

filepath = 'c:/Rpk/Earnest Minds/React/Sales Order/frontend/src/app/(app)/invoices.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('<TouchableOpacity style={styles.card} onPress={() => openEditModal(item.id, true)} activeOpacity={0.7}>', '<View style={styles.card}>')

old_actions = """<Ionicons name="pencil" size={20} color="#18181A" style={{ marginBottom: 12 }} onPress={() => openEditModal(item.id, false)} />
          <Ionicons name="trash" size={20} color="#ef4444" onPress={() => handleDelete(item.id)} />
        </View>
      </TouchableOpacity>"""

new_actions = """<Ionicons name="eye-outline" size={20} color="#10b981" style={{ marginBottom: 12 }} onPress={() => openEditModal(item.id, true)} />
          <Ionicons name="pencil-outline" size={20} color="#18181A" style={{ marginBottom: 12 }} onPress={() => openEditModal(item.id, false)} />
          <Ionicons name="trash-outline" size={20} color="#ef4444" onPress={() => handleDelete(item.id)} />
        </View>
      </View>"""

content = content.replace(old_actions, new_actions)
content = content.replace(old_actions.replace('\n', '\r\n'), new_actions.replace('\n', '\r\n'))

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated invoices")
