# Girls Who Code at Columbia

A GitHub Pages website rebuilt from the [published Wix site](https://columbiagwc.wixsite.com/gwc-columbia). The website is generated from editable JSON content and local images. Routine updates do not require editing HTML, CSS, or JavaScript. There are no npm dependencies, Wix services, or client-side JavaScript required to display the pages.

## Update the website through a PR

1. Create a branch in GitHub (or locally).
2. Edit the appropriate file below. GitHub's pencil button works for text edits.
3. Upload new images with **Add file → Upload files** on the same branch. Use descriptive filenames without spaces.
4. Open a PR. The **Check and deploy website** workflow validates the content and builds the entire site. Its `website-preview` artifact contains the generated pages for review; it is not a publicly hosted PR preview.
5. After review, merge into `main`. GitHub Actions builds and deploys the updated website, including the footer's last-updated date.

| What to change | File |
| --- | --- |
| Home artwork, scroll label, mission | `content/home.json` |
| Upcoming events and past-event galleries | `content/events.json` |
| Classes, deadlines, application links, teaching | `content/programs.json` |
| Committee descriptions and photos | `content/committees.json` |
| Board year, names, roles, biographies, photos | `content/board.json` |
| Navigation, newsletter, contact links, footer text | `content/site.json` |
| Images | `public/assets/` |
| Layout and styling | `scripts/build.mjs`, `public/style.css` |

JSON uses double quotes and no trailing commas. Text is plain text, not HTML; use `\n\n` inside a string to separate paragraphs in event descriptions and board biographies. Keep image paths relative to `public/`, for example `assets/board/ann-lee.jpg`.

## Add an upcoming event

Add an object to the `upcoming` array in `content/events.json`. This is an illustrative record; replace every detail with your actual event information:

```json
{
  "id": "fall-coding-workshop",
  "title": "Fall coding workshop",
  "date": "2026-10-10",
  "time": "2:00–4:00 PM ET",
  "location": "Add the confirmed location",
  "description": "Add the event description.",
  "link": {
    "label": "Register",
    "href": "https://example.com/replace-with-registration-form"
  }
}
```

`id`, `title`, `date`, and `description` are required. `time`, `location`, `link`, `image`, `imageAlt`, and `photos` are optional. IDs must be unique lowercase slugs across both lists. Dates use `YYYY-MM-DD`. Upcoming events sort earliest first; past events sort newest first. These are explicit lists: after an event, move its object from `upcoming` to `past` in a PR. They do not silently move based on a visitor's clock.

## Upload past-event photos

1. Move the event into `past`, or add a new past-event record with the same required fields.
2. Upload photos to `public/assets/events/<event-id>/` on your branch. Prefer JPEG/WebP photos around 1600 pixels wide and under 1 MB each.
3. Add a `photos` array to the event:

```json
"photos": [
  {
    "src": "assets/events/fall-coding-workshop/group.jpg",
    "alt": "Workshop participants showing their completed projects",
    "caption": "Our completed projects!"
  },
  {
    "src": "assets/events/fall-coding-workshop/coding.jpg",
    "alt": "Students working together on a coding exercise"
  }
]
```

Each photo needs `src` and descriptive `alt` text. Captions are optional. Photos appear in the supplied order and open at full size when selected. The build rejects missing files. No Wix uploads or external image hosting are needed.

## Newsletter

The footer and upcoming-event buttons open a prefilled email to `columbiagwc+subscribe@googlegroups.com`, the Google-supported subscription command. The visitor clicks Send and follows Google’s confirmation instructions; the site does not silently send email or claim to have subscribed anyone. [Google documents this flow here](https://support.google.com/a/users/answer/10563581?hl=en). Group settings may require approval. Update `newsletter.href` and `newsletter.joinHelp` in `content/site.json` if this changes. The ordinary posting address remains `columbiagwc@googlegroups.com`; it is not the subscription endpoint.

## Program and board dates

The source Wix site identifies its classes and board as **2025**. Those dates and profiles have been preserved. The expired Fall 2025 student application is marked `archived`, and its button contacts the club instead of presenting it as an open application. To open a new term, update all term details and its application URL in `content/programs.json`, then change `term.status` to `open`. `closed` and `archived` both show `term.notice` and a contact link. Existing teaching and committee application links are preserved from Wix; confirm them before the next recruitment cycle.

## Last-updated date

Every generated page's footer shows the deployed Git commit's committer date, formatted in `America/New_York`. The Actions workflow gets this date with `git log -1 --format=%cI` and supplies `SITE_COMMIT_DATE` to the build. Every new deployed commit automatically updates the footer. Redeploying the **same commit** retains that commit's date; it does not pretend the content changed. Local builds use the latest local commit, or the current time only when running outside a Git checkout. Uncommitted preview edits do not change the commit timestamp.

## Local development

Use Node.js 22 or later. No dependency installation is required.

```sh
npm test
npm run build
npm run dev
```

Open the URL printed by `npm run dev`. After editing content or styling, run `npm run build` in a second terminal and refresh. The server is bound to localhost. Set `PORT` if needed. `dist/` is generated and ignored by Git; edit the source content, never `dist/`.

Checks cover generated internal links and anchors, local images, event date validation and ordering, galleries, escaped content, and the commit-date footer. All page content is available without JavaScript. Layouts adapt to smaller screens, include keyboard focus and skip navigation, and respect reduced-motion settings.

## GitHub Pages setup (one time)

The existing Pages address is `https://columbiagwc.github.io/`. To configure this generator:

1. In this repository's **Settings → Pages**, set **Build and deployment → Source** to **GitHub Actions**.
2. Keep the existing GitHub Pages address. The old checkout contained a stale `CNAME` for `gwcatcolumbia.com`, but GitHub reports no custom domain configured; that stale file has been removed. No DNS changes are needed.
3. Allow the `github-pages` environment to deploy from `main`.
4. Run the workflow on `main`, or merge a PR into `main`. Pull requests only build and test; they do not deploy.

The workflow follows [GitHub's custom Pages workflow guidance](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). If you later configure a custom domain in GitHub, add a root `CNAME` and update `content/site.json` (`url`). The build copies `CNAME` only when present. Clean routes are `/programs/`, `/committees/`, `/board/`, and `/past-events/`; `/blank/`, `/blank-1/`, and `/blank-2/` redirect to the corresponding rebuilt pages for links using the old Wix path names on the new domain.

## Migration provenance

Content and images were retrieved from the Wix site's Home, High School Programs, Committees, and E-Board pages on September 3, 2026. Original image URLs are recorded in `content/asset-sources.json`; photographs are resized for web delivery. The linked `columbiagwc/GWC-website` repository contains Wix scaffolding rather than standalone page layouts, so the site was rebuilt from its published content. No event records were invented. The old Wix site and the Google Forms/Google Group are not modified by this repository.
