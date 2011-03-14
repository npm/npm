#compdef npm

# Zsh completion script for npm, delegating the whole affair to "npm complete"
# The only trouble with this approach is that not all npm comands do completion
# (so if you try one of those, some happy "npm ERR!" spew fills your terminal).
#
# To install, rename this file to "_npm" and drop it somewhere in your $fpath;
# /usr/share/zsh/site-functions for instance

_npm() {
  compadd -- $(_npm_complete $words)
}

# We want to show all errors of any substance, but never the "npm (not )ok" one.
# (Also doesn't consider "ERR! no match found" worth breaking the terminal for.)
_npm_complete() {
  local ask_npm
  ask_npm=(npm completion --color false --loglevel error -- $@)
  { _call_program npm $ask_npm 2>&1 >&3 \
  | egrep -v '^(npm (not |)ok|ERR! no match found)$' >&2; \
  } 3>&1
}

_npm "$@"
