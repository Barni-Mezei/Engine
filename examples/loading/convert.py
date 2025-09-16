out = open("item_list.json", "w", encoding="utf8")

with open("textures.json", "r", encoding="utf8") as f:
    out.write('{\n')

    for index, line in enumerate(f):
        name = line.strip()
        id = "minecraft:" + name.replace(" ", "_").replace("'", "").replace("(", "").replace(")", "").lower()

        first_part = '    "' + id + '" :'

        out.write(f"{first_part:<60}\"" + name + '",\n')

    out.seek(out.tell() - 2)
    out.write('\n}\n')

out.close()
