"""Fix logo href on all HTML files to use an absolute path so a click from
anywhere reliably lands on the language homepage."""
import os, re

fixed = 0
total = 0
for root, dirs, files in os.walk('public'):
    if '.wrangler' in root:
        continue
    for fn in files:
        if not fn.endswith('.html'):
            continue
        p = os.path.join(root, fn)
        with open(p, 'r', encoding='utf-8') as fh:
            s = fh.read()
        orig = s
        # Path normalization: forward slashes for matching only
        norm = p.replace('\\', '/')
        is_cn = '/cn/' in norm or norm.endswith('/cn/index.html') or '/cn/index.html' in norm
        target = '/cn/' if is_cn else '/'
        s = re.sub(
            r'<a href="(?:\.\./)*index\.html"\s+style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: inherit;">',
            f'<a href="{target}" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: inherit;">',
            s,
        )
        if s != orig:
            with open(p, 'w', encoding='utf-8') as fh:
                fh.write(s)
            fixed += 1
        total += 1
print(f'logo hrefs absolute-pathed in {fixed} of {total} html files')
