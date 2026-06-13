import os
import re
import sys

# Configure stdout to print UTF-8 characters safely
sys.stdout.reconfigure(encoding='utf-8')

project_dir = r"d:\Workspace\Project\_freelance\mitomxanh"
assets_dir = os.path.join(project_dir, "assets")

# Find all references in code files
code_files = [
    os.path.join(project_dir, "index.html"),
    os.path.join(project_dir, "script.js"),
    os.path.join(project_dir, "style.css"),
]
for f in os.listdir(project_dir):
    if f.startswith("section_") and f.endswith(".html"):
        code_files.append(os.path.join(project_dir, f))

references = set()
# Regular expression to extract file paths starting with assets/
# Supporting both double/single quotes, parentheses (for CSS url()), etc.
asset_pattern = re.compile(r'assets/[^"\'\)\s]+')

for filepath in code_files:
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            matches = asset_pattern.findall(content)
            for m in matches:
                # Clean up match
                clean_path = m.strip().replace('/', os.sep)
                references.add(clean_path.lower())

# Scan assets dir
unused_files = []
used_files = []

def scan_dir(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            full_path = os.path.join(root, file)
            # Get relative path starting with assets/
            rel_path = os.path.relpath(full_path, project_dir)
            rel_path_lower = rel_path.lower()
            
            # Check if this rel_path (or any part of it) is referenced in code
            is_used = False
            for ref in references:
                if ref == rel_path_lower or rel_path_lower.endswith(ref):
                    is_used = True
                    break
            
            if is_used:
                used_files.append(full_path)
            else:
                unused_files.append(full_path)

scan_dir(assets_dir)

print("--- USED ASSETS ---")
for f in sorted(used_files):
    print("  ", os.path.basename(f))

print("\n--- UNUSED ASSETS ---")
for f in sorted(unused_files):
    print("  ", os.path.basename(f))

# Delete unused files
print(f"\nDeleting {len(unused_files)} unused assets...")
for f in unused_files:
    try:
        os.remove(f)
        print(f"Deleted: {os.path.basename(f)}")
    except Exception as e:
        print(f"Error deleting {f}: {e}")

print("Done.")
