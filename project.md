some notes for the project structure

- The parser itself and its helper are mostly in one single file.
- the streaming parser is in transformStream.
- txml2js was made to have a xml2js compatible version to that parser, it was intended to work with the SVGO npm module, but they decided to follow a different path for dropping the C++ dependency. The txml2js was published as its own module.
- the test directory was introduced to test the type definitions before publishing a new version. It is not published to npm.
