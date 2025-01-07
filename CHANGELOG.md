# Changelog

All notable changes to this project will be documented in this file.

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
