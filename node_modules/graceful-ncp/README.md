graceful-ncp
===

[ncp](https://github.com/AvianFlu/ncp) but on top of [graceful-fs](https://github.com/isaacs/node-graceful-fs) instead of plain old Node `fs`. This protects you against `EMFILE` errors when opening too many files, etc.

## Installation

`npm install graceful-ncp`

## API

The exact same as [ncp](https://github.com/AvianFlu/ncp)'s.