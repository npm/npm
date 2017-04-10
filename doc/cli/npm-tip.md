npm-tip(1) -- Tip a package maintainer
======================================

## SYNOPSIS

    npm tip <pkg> [amount] [account]

## DESCRIPTION

Tip the maintainer of a package by sending them a specified amount.
If no amount is specified then a default value is used (see `npm-config(1)`).

## CONFIGURATION

### amount

* Default: 0.001BTC
* Type: String

The amount to send as a tip. This is specified as a numeric amount followed by
a unit (`BTC`, `mBTC` or `uBTC`).

The default amount is in Bitcoin and is currently valued at around $1 USD. This
can be changed by setting the `tip-amount` and `tip-unit` configuration
settings.

### account

* Type: String

The tipping account to use when sending the tip. The first account added is
used by default. This can be changed by setting the `primary-tip-account`
configuration setting.

## SEE ALSO

* npm-link-tip-account(1)
* npm-config(1)
