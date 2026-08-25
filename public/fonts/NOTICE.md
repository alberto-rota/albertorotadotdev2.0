# CascadiaCodeNF-subset.woff2

Cascadia Code NF (Nerd Font) Regular, from the official Microsoft release
`v2407.24` (`woff2/static/CascadiaCodeNF-Regular.woff2`) — the same patched
font distributed elsewhere as "CaskaydiaCove Nerd Font".

Subset with `fonttools` down to what this site actually renders, which takes it
from 1.3 MB to ~18 KB:

    pyftsubset CascadiaCodeNF-Regular.woff2 \
      --unicodes=0000-00FF,2013-2014,2018-201F,2022,2026,2190-2199,\
2500-257F,2580-259F,25A0-25FF,2800-28FF,\
E0A0,E0B0,E0B2,E702,E718,E73C,E795,E7A8,E62B,\
F002,F005,F00C,F00D,F013,F021,F07B,F085,F09B,F120,F121,F126,F15B,F17C,F179,F1C0,F489,F0E7 \
      --layout-features= --no-hinting --desubroutinize --flavor=woff2

That is: Latin-1, box drawing, block elements, geometric shapes, Braille
patterns, arrows, and the handful of Powerline / Devicon / Font Awesome glyphs
used by the hero background (see `src/components/site/GlyphField.tsx`).

Cascadia Code is licensed under the SIL Open Font License 1.1
(https://github.com/microsoft/cascadia-code/blob/main/LICENSE). The Nerd Fonts
glyphs it embeds carry their own upstream OFL / MIT licenses
(https://github.com/ryanoasis/nerd-fonts).
