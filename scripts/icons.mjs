// Small, local outline icons. Keys are editable in content/committees.json.
export const committeeIcons = {
  book: '<path d="M12 5v15M12 5C8 2 4 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-2-1-6-2-10 1Z"/>',
  wallet: '<path d="M20 8V5a2 2 0 0 0-2-2L4 6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16V8H4"/><path d="M20 12h-5v5h5"/><circle cx="16" cy="14.5" r=".5" fill="currentColor"/>',
  megaphone: '<path d="m4 9 14-5v16L4 15H2V9h2ZM4 15l2 6h4l-2-5M21 8l2-1m-2 5h2m-2 4 2 1"/>',
  community: '<circle cx="9" cy="7" r="3"/><path d="M2 21v-3a7 7 0 0 1 14 0v3M17 4a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 4v3"/>',
  camera: '<path d="M3 6h4l2-3h6l2 3h4v15H3Z"/><circle cx="12" cy="13" r="4"/><path d="M18 9h1"/>',
  notebook: '<rect x="5" y="2" width="16" height="20" rx="2"/><path d="M2 6h6M2 12h6M2 18h6m4-12h6m-6 5h6m-6 5h4"/>',
  code: '<rect x="2" y="3" width="20" height="18" rx="2"/><path d="M2 7h20m-14 4-3 3 3 3m8-6 3 3-3 3m-3-7-2 8"/>'
};
export const committeeIcon = name => `<svg class="committee-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${committeeIcons[name]}</svg>`;
