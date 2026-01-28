import os
import re
from pathlib import Path

def remove_comments_from_ts_tsx(content):
    lines = content.split('\n')
    result = []
    in_multiline_comment = False
    
    for line in lines:
        if in_multiline_comment:
            if '*/' in line:
                line = line[line.index('*/') + 2:]
                in_multiline_comment = False
            else:
                continue
        
        if '/*' in line:
            if '*/' in line:
                line = re.sub(r'/\*.*?\*/', '', line)
            else:
                line = line[:line.index('/*')]
                in_multiline_comment = True
        
        line = re.sub(r'//.*$', '', line)
        
        if line.strip():
            result.append(line.rstrip())
        elif not result or result[-1]:
            result.append('')
    
    while result and not result[-1]:
        result.pop()
    
    return '\n'.join(result)

def remove_comments_from_sql(content):
    lines = content.split('\n')
    result = []
    
    for line in lines:
        line = re.sub(r'--.*$', '', line)
        
        if line.strip():
            result.append(line.rstrip())
        elif not result or result[-1]:
            result.append('')
    
    while result and not result[-1]:
        result.pop()
    
    return '\n'.join(result)

def process_directory(base_path, extensions, processor):
    base = Path(base_path)
    if not base.exists():
        print(f"Path not found: {base_path}")
        return 0
    
    count = 0
    for ext in extensions:
        for filepath in base.rglob(f'*.{ext}'):
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                cleaned = processor(content)
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(cleaned)
                
                print(f"Processed: {filepath.relative_to(base)}")
                count += 1
            except Exception as e:
                print(f"Error processing {filepath}: {e}")
    
    return count

def main():
    base_dir = r"d:\download\Nova pasta\Nova pasta\Ascend Novo\AscendTest"
    
    print("Removing comments from TypeScript/TypeScript React files...")
    ts_count = process_directory(
        os.path.join(base_dir, "src"),
        ["ts", "tsx"],
        remove_comments_from_ts_tsx
    )
    
    print("\nRemoving comments from SQL migration files...")
    sql_count = process_directory(
        os.path.join(base_dir, "supabase", "migrations"),
        ["sql"],
        remove_comments_from_sql
    )
    
    print("\nRemoving comments from Edge Functions...")
    edge_count = process_directory(
        os.path.join(base_dir, "supabase", "functions"),
        ["ts"],
        remove_comments_from_ts_tsx
    )
    
    total = ts_count + sql_count + edge_count
    print(f"\n✅ Done! Processed {total} files total.")
    print(f"  - TypeScript/React: {ts_count}")
    print(f"  - SQL migrations: {sql_count}")
    print(f"  - Edge functions: {edge_count}")

if __name__ == "__main__":
    main()
