import json

with open('./run.json', "r") as f:
    data = json.load(f)

for item in data["frames"]:
    x = item["spriteSourceSize"]["y"]
    item["spriteSourceSize"]["y"] = x + 1

with open("output.json", "w") as f:
    json.dump(data, f, indent=2)
