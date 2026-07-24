# Green theme fix

The previous archive still contained several hard-coded yellow values outside the theme tokens.
They were removed from:

- `src/layouts/default-layout.css`
- `src/pages/auth.css`
- `src/components/course/curriculum-module-card.css`

Brand marks, active navigation text, avatars, and module counters now use the green accent tokens.
The warning status uses orange rather than yellow and remains independent from the brand color.
