# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2025-12-06

### Added
- Interactive customization prompt in scaffold flow allowing users to review and modify generated project settings before creation
- Clear option labels in customization prompt for better user experience

### Fixed
- Improved prompt text clarity and consistency across the CLI interface

### Changed
- Enhanced type definitions handling for p5.js 2.x versions with better fallback strategy for versions 2.0.0-2.0.1

## [0.1.0] - 2025-12-05

### Added
- Initial release of create-p5js
- Interactive scaffolding for p5.js projects with customizable options
- Support for both JavaScript and TypeScript
- Support for both global and instance p5.js modes
- Multiple delivery modes: CDN or local files
- Multi-CDN support (jsdelivr, cdnjs, unpkg)
- Automatic TypeScript type definitions download
- Project configuration management via p5-config.json
- Update command for existing projects
- Community template support via degit
- Comprehensive i18n architecture with English translations
- Version selection with stable/prerelease filtering
- Git initialization option
- Command-line flags for non-interactive usage
- Built-in templates: basic-global-js, basic-global-ts, basic-instance-js, basic-instance-ts

### Features
- Smart HTML manipulation using linkedom
- Version management with jsdelivr API integration
- Graceful error handling and user-friendly error messages
- Progress indicators and spinners for long-running operations
- Input validation for all user inputs
- Automated testing with Vitest

[0.1.1]: https://github.com/sableraf/create-p5/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/sableraf/create-p5/releases/tag/v0.1.0
