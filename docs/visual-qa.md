# Visual QA — September 3, 2026

Compared the rebuilt pages with the published Wix site in isolated Chrome at a 1440px desktop viewport:

- [Home](https://columbiagwc.wixsite.com/gwc-columbia): restored full-width cropped banner, original logo, pill navigation, left-hand community artwork, right-hand mission copy, cream footer, and pink newsletter panel.
- [E-Board](https://columbiagwc.wixsite.com/gwc-columbia/blank-2): restored two narrow cream cards per row, original visual member order, exact Wix portrait crops, pink text, social links, and floral heading.
- [Programs](https://columbiagwc.wixsite.com/gwc-columbia/blank): restored overlapping welcome artwork/pink panel, pink term section, teal course background, numbered course cards, and teaching panel.
- [Committees](https://columbiagwc.wixsite.com/gwc-columbia/blank-1): restored full-width patterned hero, centered green panel, teal committee navigation, alternating pink/green sections, and photo thumbnails.

The original Avenir and Questrial webfonts are included locally. Body text uses slightly darker pink/teal for readability. Intentional differences include removing Wix advertising, retaining the requested upcoming/past events features, using the Google Groups subscription request, marking expired classes as archived, removing the original large empty gap above Teaching Team, and adapting the layout to mobile instead of preserving the reference's horizontal clipping.

Inspected final screenshots and ran browser assertions for all five routes at 1440px and 390px (ten page/viewport combinations). Checks passed for image decoding, font loading, horizontal overflow, mobile menu expansion/Escape handling, the homepage scroll cue, committee thumbnail switching, and the prefilled subscription link. No runtime exceptions or failed page-resource responses were recorded. No subscription email was sent, and group membership confirmation/approval was not exercised.

`npm test` checks content-driven rendering, image/link integrity, gallery data, date ordering/validation, HTML escaping, optional custom-domain output, and the deployed commit date. `npm run build` also validates the actual site's generated local links and anchors. The local preview shows the last existing commit date until changes are committed; deployments use the deployed commit's date.
