# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Sync docs and package metadata to the new default placeholder `UUID#7`
  (`README.md` examples, `package.json` description, rule `docs.description`).

## [0.1.2] - 2026-08-02

### Changed

- Update tests to match the new default placeholder `UUID#7`.

## [0.1.1] - 2026-08-02

### Changed

- Change the default placeholder from `\UUID` to `UUID#7`.
- Reorganize `package.json` fields and add author information.

## [0.1.0] - 2026-08-02

### Added

- Initial release: an ESLint rule that replaces configurable placeholder string
  literals (default `\UUID`) with fresh v4/v7 UUIDs via `eslint --fix`.
- Matches `Literal` and `TemplateLiteral` nodes, preserving the original quote
  style (`'`, `"`, or backtick).
- Bundled `recommended` flat config that enables the rule with its defaults.

[Unreleased]: https://github.com/RickyLi79/eslint-rule-uuid-generator/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/RickyLi79/eslint-rule-uuid-generator/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/RickyLi79/eslint-rule-uuid-generator/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/RickyLi79/eslint-rule-uuid-generator/releases/tag/v0.1.0
