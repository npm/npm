npm-link-tip-account(1) -- Link a tipping account to send tips
==============================================================

## SYNOPSIS

    npm link-bitcoin-account <type> <token> [secretToken ...]

## DESCRIPTION

Associate a tipping account with the current user so that tips can be made (see
`npm-tip(1)`).

## CONFIGURATION

### type

* Type: String

The type or provider of the account. Currently only `coinbase` is supported.

### token

* Type: String

The token(s) required to access your account. These tokens will be
dependent upon the account type. If multiple tokens are required, such as for
the `coinbase` account type, the tokens are separated by a space.

When specifying multiple tokens the public token should be given first,
followed by the secret token.

## SEE ALSO

* npm-tip(1)
