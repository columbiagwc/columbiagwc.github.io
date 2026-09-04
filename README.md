# Columbia Girls Who Code website

[Live site](https://columbiagwc.github.io/) · Content is edited in JSON files; no HTML changes are needed for routine updates.

## Make an update

1. Create a branch in GitHub. Edit a file with the pencil button; upload images with **Add file → Upload files** on the same branch.
2. Open a PR. Wait for **Check and deploy website** to pass, then review and merge into `main`.
3. GitHub deploys the change. The footer automatically shows the deployed commit’s date.

Use double quotes in JSON, no trailing commas, and `\n\n` for paragraph breaks. Edit source files—not the generated `dist/` folder.

## Where to edit

| Change | File in `content/` |
| --- | --- |
| External button links/labels; close or reopen applications | `buttons.json` |
| Board year, names, roles, bios, photos, display order | `board.json` |
| Upcoming events and past-event photo galleries | `events.json` |
| Committee names, descriptions, icons, photos, destinations | `committees.json` |
| Class dates, schedule, eligibility, courses, teaching text | `programs.json` |
| Homepage banner, scroll label, mission text/artwork | `home.json` |
| Site name/description, logo, navigation, contact/social links, newsletter heading, footer text | `site.json` |

## Buttons and applications

**Every external button URL is in `content/buttons.json`:** `getInvolved`, `newsletter`, `teachingApplication`, `committeeApplication`, and `studentApplication`.

- Change `href` to update a link or `label` to change its text.
- All external links automatically open in a new tab, including forms and social links. Email links launch the visitor’s mail app. No per-button setting is needed.
- For an application, change `"disabled": false` to **`"disabled": true`** to close it. Its button is replaced with `closedMessage` and a newsletter link. Edit the message freely.
- Set `disabled` back to `false` to reopen. Keep the URL in place while closed.

For example, the teaching application can be closed with:

```json
"disabled": true,
"closedMessage": "The teaching application is currently closed. Join our newsletter for updates when we open applications!"
```

Changing `newsletter.href` updates **all** newsletter buttons, including closed-application notices. No signup data is stored by this website; forms handle submissions.

**High school classes:** also update `programs.json` → `term` (title, dates, deadline, schedule, eligibility, notice). `term.status` is `open`, `closed`, or `archived`. Course application buttons appear only for an open term; their link and disabled setting live in `buttons.json` → `studentApplication`.

## Board members

In `board.json`, update `subtitle` for the board year. Each object in `members` has:

```json
{
  "name": "Member name",
  "role": "Position",
  "image": "assets/board/member-name.jpg",
  "bio": "Introduction.\n\nFun fact or advice."
}
```

Add/remove an object to add/remove a person. Reorder objects to change display order (left to right on desktop, top to bottom on mobile). Add `"visible": false` to temporarily hide someone; remove it or set it to `true` to show them. Upload their photo to `public/assets/board/`.

## Events and photos

In `events.json`, add an object to `upcoming` or `past`:

```json
{
  "id": "coding-workshop",
  "title": "Coding workshop",
  "date": "2026-10-10",
  "time": "2–4 PM ET",
  "location": "Confirmed location",
  "description": "Event details.",
  "link": { "label": "Register", "href": "https://example.com/registration" },
  "photos": [
    {
      "src": "assets/events/coding-workshop/group.jpg",
      "alt": "Participants showing their projects",
      "caption": "Our finished projects!"
    }
  ]
}
```

Replace the example details. Required: `id`, `title`, `date`, `description`. IDs must be unique lowercase names with hyphens; dates use `YYYY-MM-DD`. Other fields are optional. A cover image uses `image` and `imageAlt`.

Upload gallery photos to `public/assets/events/<event-id>/`. Each photo needs `src` and descriptive `alt`; `caption` is optional. Photos display in array order.

Upcoming events sort earliest first; past events sort newest first. **Move an event from `upcoming` to `past` after it happens.** Events do not move automatically. The homepage shows upcoming events; `/events/` shows both lists. Page headings and empty-state messages are also in `events.json`.

## Committees

Edit or add an object in `committees.json` → `items`. Use a unique `id`, a `title`, `description`, `image`, and `icon`. Reorder objects to reorder navigation and sections. Update the page `intro` if the committee count changes.

- Icons: `book`, `wallet`, `megaphone`, `community`, `camera`, `notebook`, `code`.
- `art` adds a second gallery image; omit it if not needed.
- The committee-name button normally scrolls to its section. Optional `href` overrides its destination. Teaching uses `programs/#teaching` and its details live on the Programs page.
- The overall committee application is controlled in `buttons.json`.

## Images, navigation, and design

Put images in `public/assets/`. Reference them without `public/`, e.g. `assets/board/member.jpg`. Use filenames without spaces; photos around 1600px wide and under 1 MB load faster. Missing files fail the build.

In `site.json`, `navigation` controls top-bar labels/order/links, `socials` controls **Follow us**, and `profileSocials` controls board-profile social links. Add/remove objects to change links. Internal paths look like `events/`; external links start with `https://`.

For design changes: `public/style.css` controls colors, rounding, spacing, and transitions; `scripts/build.mjs` controls page layouts; `scripts/icons.mjs` defines the committee icons; `public/site.js` handles the mobile menu and galleries.

## Preview and publishing

Use Node.js 22+. No dependency installation is needed.

```sh
npm test
npm run dev
```

Open the printed local URL. After edits, run `npm run build` in another terminal and refresh. PRs build/test and provide a downloadable `website-preview` artifact; they do not publish a live preview.

**One-time admin setting:** in GitHub **Settings → Pages**, select **Source → GitHub Actions**. The legacy “Deploy from a branch” mode can overwrite the generated site. Publishing runs from `main` via `.github/workflows/pages.yml`.

The old `/past-events/` path redirects to `/events/`; `/blank/`, `/blank-1/`, and `/blank-2/` redirect to the migrated pages. For a future custom domain, configure it in GitHub, add a root `CNAME`, and update `site.json` → `url`.
