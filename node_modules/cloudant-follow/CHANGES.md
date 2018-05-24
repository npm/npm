# 0.17.0 (2018-03-22)
- [NEW] Allow a custom HTTP agent to be specified.
- [NEW] Trim the database URL if it includes the `/_changes` endpoint.
- [FIXED] Correctly pass request parameters to `feed.filter` function.
- [FIXED] Retry `/_db_updates` request using the last recorded sequence value as
  the `since` query parameter.
- [NOTE] Update engines in preparation for Node.js 4 “Argon” end-of-life.

# 0.16.1 (2017-11-02)
- [FIXED] Corrected `eslint` to be `devDependencies` instead of `dependencies`.

# 0.16.0 (2017-10-31)
- [UPGRADED] Use latest version of request@2.x.x.

# 0.15.0 (2017-10-30)
- [FIXED] Check `request` is defined before using in feed timeout handler.
- [FIXED] Update list of possible feed query parameters.

# 0.14.0 (2017-09-29)
- [NEW] Correctly construct feed URL for `feed.view`.

# 0.13.0 (2017-05-16)
- [FIXED] Retry changes feed if server sends `last_seq`.
