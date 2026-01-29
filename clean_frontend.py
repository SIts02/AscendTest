import os
import re
from pathlib import Path

def remove_comments_typescript(content):
    lines = content.split('\n')
    result = []
    in_multiline_comment = False
    
    for line in lines:
        original_line = line
        
        if in_multiline_comment:
            if '*/' in line:
                line = line[line.index('*/') + 2:]
                in_multiline_comment = False
            else:
                continue
        
        if '/*' in line:
            if '*/' in line:
                before = line[:line.index('/*')]
                after = line[line.index('*/') + 2:]
                line = before + after
            else:
                line = line[:line.index('/*')]
                in_multiline_comment = True
        
        line = re.sub(r'//.*$', '', line)
        
        if line.strip() or (not line.strip() and result and result[-1].strip()):
            result.append(line.rstrip())
    
    while result and not result[-1].strip():
        result.pop()
    
    return '\n'.join(result)

def process_files(base_path):
    base = Path(base_path)
    count = 0
    errors = []
    
    for filepath in base.rglob('*.ts*'):
        if filepath.suffix not in ['.ts', '.tsx']:
            continue
            
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            cleaned = remove_comments_typescript(content)
            
            with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
                f.write(cleaned)
            
            rel_path = filepath.relative_to(base)
            print(f"✓ {rel_path}")
            count += 1
        except Exception as e:
            errors.append((filepath, str(e)))
    
    return count, errors

def main():
    src_dir = r"d:\download\Nova pasta\Nova pasta\Ascend Novo\AscendTest\src"
    
    print("🧹 Removendo comentários do frontend (src/)...\n")
    
    count, errors = process_files(src_dir)
    
    print(f"\n✅ Processados {count} arquivos com sucesso!")
    
    if errors:
        print(f"\n❌ {len(errors)} erros:")
        for filepath, error in errors:
            print(f"  - {filepath}: {error}")
    
    print("\n🎉 Limpeza concluída!")

if __name__ == "__main__":
    main()
