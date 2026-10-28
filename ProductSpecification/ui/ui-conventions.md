# UI Conventions

## Visual Language

- Product UI uses Inter with a calm, workspace-like visual tone.
- Primary accent is indigo. Supporting assistant accents use violet.
- Corners are soft but restrained: 10px for controls, 16px for cards, 20px for the composer.
- Desktop content is centered at a maximum width of 840px. Navigation uses a 272px sidebar.
- Mobile layouts use a 16px page gutter and touch targets of at least 44px.

## Themes

| Token | Light | Dark |
|---|---|---|
| Canvas | `#f7f7f8` | `#171719` |
| Surface | `#ffffff` | `#222225` |
| Elevated surface | `#ffffff` | `#2a2a2e` |
| Primary text | `#17171a` | `#f4f4f5` |
| Secondary text | `#6b6b73` | `#a7a7b0` |
| Border | `#e5e5e9` | `#39393f` |
| Accent | `#5b5ce2` | `#818cf8` |

Theme switches preserve the current screen and only change visual tokens. The control always shows the destination theme icon.

## Chat Layout

- Desktop chat uses a persistent sidebar with product identity, primary Chat/Dashboard navigation, new-chat action, history, and profile.
- Desktop chat has a 284px right rail for explicit tools. Each tool shows an icon, name, short purpose, and enabled state.
- Mobile chat replaces the sidebar with a compact top bar and bottom navigation. Tools open in a right-side drawer.
- Assistant messages align left with a branded avatar and no heavy bubble.
- User messages align right in a quiet accent-tinted bubble.
- The composer stays visually anchored at the bottom, with attachment and send actions inside one elevated container.
- Supporting AI disclaimers sit below the composer in secondary text.

## Dashboard Layout

- Dashboard uses the same global navigation as chat, with Dashboard visibly active.
- The first content row contains exactly four summary cards.
- Recent conversations remain the primary continuation action.
- A secondary right rail contains quick actions and short activity context.

## Application Shell

- The global desktop sidebar contains product identity, workspace selector, module navigation, security note, and account profile in that order.
- Module navigation labels are: Мой кабинет, Чат, Дашборды, Автодействия, Свои отчёты, Обращения, Безопасность.
- Desktop navigation uses a floating 286px frosted panel with a 26px outer radius and restrained translucency.
- Mobile navigation uses the same information hierarchy inside a 340px modal drawer.
- Chat selection reveals an animated chat surface that fills the entire workspace beside the global navigation. Other module selections change only the page heading until those modules receive their own interfaces.
- Motion uses short opacity and translation transitions with Apple-like easing. Reduced-motion preferences disable nonessential animation.

## Interaction States

- Primary buttons use the accent token and a high-contrast foreground.
- Hover states increase surface contrast without changing layout.
- Focus-visible states use a 3px translucent accent ring.
- Disabled actions reduce opacity but remain legible.
