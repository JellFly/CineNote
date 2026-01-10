# CineNote: AI Coding Agent Instructions

## Project Overview
**CineNote** is a single-page anime/film/series tracking application with multi-profile support and Firebase cloud synchronization. Users organize watched content by type (animes, films, series), rate/comment on items, and maintain a watchlist.

## Architecture & Data Flow

### Core Architecture Pattern
- **Multi-file SPA**: Single `site.js` manages all logic; each page (index, add, list, watchlist, profiles) loads this shared script
- **Global State Management**: All state lives in `site.js` global variables (`profiles`, `animes`, `films`, `series`, `watch`, `currentProfileIndex`, `currentType`)
- **Hybrid Persistence**: Tries Firebase Firestore first; falls back to localStorage if unavailable
- **Profile-Scoped Data**: Each profile object contains its own `{animes[], films[], series[], watch[]}` arrays

### Data Model
```javascript
Profile: {name, avatar, bio, animes[], films[], series[], watch[]}
Item: {title, image, rating (0-5), date (YYYY-MM-DD), comment}
Watch: [string] (simple titles, not full objects)
```

### Critical Data Flow
1. **Load**: `loadProfilesFromFirebase()` → tries Firebase → falls back to `loadProfilesLocal()` (localStorage)
2. **Edit Flow**: Item editing uses localStorage bridge (`editingItem`, `editingType`, `editingIndex`)
3. **Save**: `saveProfiles()` writes all profiles to Firebase + localStorage backup
4. **Render**: `render()` recomputes DOM from arrays; run after any data mutation

## Key Patterns & Conventions

### LocalStorage Keys (Edit Bridge)
When editing, data is stored in localStorage with these specific keys:
- `editingItem`: JSON stringified item object
- `editingType`: "animes"|"films"|"series"
- `editingIndex`: array index as string

This pattern allows cross-page data passing without query params.

### Window Functions
All public functions are attached to `window.*` for global HTML onclick handlers:
- `window.switchType(type)`, `window.switchFilterType(type)`
- `window.editItem(i, typeParam)`, `window.deleteItem(i, typeParam)`
- `window.openAuthModal()`, `window.closeAuthModal()`
- Avoid namespace collisions; always verify `window.*` function exists before adding

### Render Logic
- `render()` is the single source of truth for DOM updates (never manually manipulate cards)
- Page detection: Check for specific elements: `document.getElementById("filterType") !== null` = library page
- Index finding on library page is tricky due to filtering—use `.findIndex()` to locate original array position
- Stats updates (`updateStats()`) run inside `render()`—don't call separately

### Filter & Sort State
- Global variables: `filterType` (what to show), `sortBy` (how to order), `currentType` (page context)
- HTML selectors have event listeners added at initialization (bottom of `site.js`)
- Always sync state from DOM selects to global vars during init

## Firebase Integration

### Configuration
API keys are hardcoded in `index.html` (module script) and exposed to `window.auth`, `window.db`, `window.userDataFromFirebase`

### Patterns
- Check `window.auth?.currentUser` before assuming online
- All Firestore operations are wrapped in try-catch; localStorage is always fallback
- User document path: `/users/{uid}` with flat structure (no subcollections)
- `setDoc` creates new profile on signup; `updateDoc` saves changes

## Common Development Tasks

### Adding a Filter/Sort Option
1. Add option to HTML select (e.g., `list.html` `#filterType`)
2. Update `getFilteredAndSortedItems()` switch statement
3. Add corresponding global variable assignment at init

### Adding a New Item Property
1. Extend item object in `saveItem()` and edit form (`add.html`)
2. Update `loadEditingData()` to populate new field
3. Update `render()` to display new property in card
4. Remember: Always call `render()` after mutations

### Editing Cross-Page
1. Caller (`list.html`): `editItem(i, type)` → saves to localStorage
2. Receiver (`add.html`): `loadEditingData()` runs on DOMContentLoaded, populates form
3. On save: `saveItem()` redirects only if `isNewItem` is true

## Testing & Debugging

### Key Breakpoints
- `saveProfiles()`: Verify Firebase write and localStorage fallback
- `render()`: Check item count matches array length
- `loadEditingData()`: Confirm localStorage keys populate correctly
- Profile switching: Verify arrays load correctly via `switchProfile()`

### Common Issues
- **Cards not appearing**: Check if `animeListEl` exists in DOM and `render()` was called
- **Firebase fails silently**: Check browser console; network tab shows request failures
- **Edit doesn't work**: Verify localStorage keys were set before navigation
- **Profile switching broken**: Ensure `profiles` array isn't empty and index is valid

## File Reference
- [site.js](../site.js): All application logic (648 lines)
- [index.html](../index.html): Firebase setup, auth modals, homepage
- [add.html](../add.html): Form for adding/editing items
- [list.html](../list.html): Library view with filters and sorting
- [watchlist.html](../watchlist.html): Watchlist management
- [profiles.html](../profiles.html): Profile CRUD and editing
- [style.css](../style.css): CSS variables use `--primary`, `--bg`, `--text` theme
