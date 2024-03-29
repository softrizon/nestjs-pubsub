# Change Log

This file contains the documentation on the notable changes and bug fixes, and
is formatted following this [standard](https://keepachangelog.com/en/1.0.0/).
This project also adheres to [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2022-10-14
- Breaking change: The `emit` method takes named arguments, you can pass `topic` and `format`, and the config object has `defaultTopic` and `defaultFormat`.

## [0.1.5] - 2022-06-01

- Renamed the filtering attributes:
  - `eventType` => `event`
  - `dataFormat` => `format`

## [0.1.4] - 2022-05-31

- Added support for multiple subscriptions.

## [0.1.2] - 2022-05-30

- Updated message filter (via attributes to map handlers)

## [0.1.1] - 2022-04-14

- Fixed typos in documentation.
- Improved message handling performance.

## [0.1.0] - 2022-04-14

Initial version

[0.1.5]: https://github.com/softrizon/nestjs-pubsub/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/softrizon/nestjs-pubsub/compare/v0.1.2...v0.1.4
[0.1.2]: https://github.com/softrizon/nestjs-pubsub/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/softrizon/nestjs-pubsub/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/softrizon/nestjs-pubsub/releases/tag/v0.1.0
