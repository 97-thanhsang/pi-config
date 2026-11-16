# VENDOR — architecture-diagram-generator

Skill này là **bản vendored** của `tt-a1i/archify` (compiler archify core).

- upstream: `https://github.com/tt-a1i/archify`
- pinned version: **3.0.1**
- pinned commit: **58ab0b98d2d0def8e49dced705c7b566936723ec**
- license: MIT

## Allowlist — chỉ các path này được sync khi upstream bump

Copy từ `<clone>/archify/`:
`bin/archify.mjs` · `renderers/**` · `schemas/**` · `delta/**` · `migrations/**` · `assets/template.html` · `brand-marks/**` · `recipes/**` · `references/**`

## Giữ bản local (KHÔNG ghi đè từ upstream)

- `SKILL.md` — bản Việt-hoá + rewire references (sửa thủ công).
- `package.json` — đã strip các script trỏ `../scripts/*` không tồn tại.
- `skill-release.json` — copy 1 lần, dùng cho drift detection.
- `VENDOR.md` — file này.

## Sync procedure (chỉ khi upstream bump)

1. `git -C <clone> fetch && git -C <clone> diff <pinned>..HEAD --stat`
2. Chỉ apply file trong allowlist.
3. Cập nhật pinned commit ở trên.

Hiện trạng: **no-op** — local 3.0.1 == upstream 3.0.1 (byte-identical ở 89/91 file chung).
