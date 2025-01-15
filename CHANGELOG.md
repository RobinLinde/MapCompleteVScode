# Changelog

All notable changes to this project will be documented in this file.

## Unreleased Version 1.2.0 (2025-XX-XX)

### Added

- New caching mechanism for references, tagRenderings and filters.
  This allows the completions to show _all_ filters, not just the ones in `filters.json` and `questions.json`.
  It's also possible to look up uses of a filter or a tagRendering.
  The caching will take about 30 seconds to complete, but it will only run once per session, and will update individual files as they are saved or removed.
- Autocompletion for `icon` fields, giving the built-in icons as suggestions.

### Fixed

- Icons with mappings are not clickable anymore.

## Version 1.1.1 (2025-01-07)

### Fixed

- TagsRenderings, filters and colours with in override or overrideAll were not working correctly.
- Colours were not correctly parsed when using hex colours (oops).
- All files were included in the extension, not just the compiled ones. This made the extension about 50kb larger than it needed to be.

## Version 1.1.0 (2025-01-04)

### Added

- Support for colours in for marker, line and fill colours.

### Fixed

- Icons with a colour in the text (`marker:red`) were not correctly parsed.

## Version 1.0.0 (2025-01-01)

Initial release.

### Added

- Autocompletion for layers, tagRenderings and filters.
- Definition support for layers, tagRenderings, filters and icons.
