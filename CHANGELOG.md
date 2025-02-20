# Changelog

All notable changes to this project will be documented in this file.

## Version 1.2.1 (2025-02-20)

### Fixed

- Layer definition also works for lists in the `builtin` property.
- The `socialImage` is now also clickable.

## Version 1.2.0 (2025-01-15)

### Added

- New caching mechanism for references, tagRenderings and filters.
  This allows the completions to show _all_ filters, not just the ones in `filters.json` and `questions.json`.
  It's also possible to look up uses of a filter or a tagRendering.
  The caching will take about 30 seconds to complete, but will be saved so it only needs to be done once. On subsequent activations, the cache will be updated if there are changes to the files. Also, it's updated whenever you save or remove a file in your editor. It is also possible to disable this feature in settings, however this will disable the autocompletion for filters and tagRenderings that are not in the `filters.json` and `questions.json` files, as well as the implementation support.
- Autocompletion for `icon` fields, giving the built-in icons as suggestions. ([#7](https://github.com/RobinLinde/MapCompleteVScode/issues/7))

### Fixed

- Icons with mappings are not clickable anymore. ([#14](https://github.com/RobinLinde/MapCompleteVScode/issues/14))

## Version 1.1.1 (2025-01-07)

### Fixed

- TagRenderings, filters and colours with in override or overrideAll were not working correctly.
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
