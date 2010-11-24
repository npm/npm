#
# npm command completion script
#
# Install Method 1: Automatic
# Drop this file in /etc/bash-completion.d or /usr/local/etc/bash-completion.d
# or wherever bash-completion scripts are sourced on your system.
#
# Install Method 2: Generic
# Put this in your .bashrc or whatever file you run when you log into a machine:
# . path/to/npm-completion.sh
#
# Then use the tab key to complete commands, which executes the "npm completion"
# command.
#
# Note that command completion is very rudimentary and incomplete (harhar) as of
# this time.  Patches welcome!
#
# --i

__npm_completion () {
  COMPREPLY=()
  local cur prev opts
  cur="${COMP_WORDS[COMP_CWORD]}"
  prev="${COMP_WORDS[COMP_CWORD-1]}"
  # opts=$(npm complete --loglevel silent --color false -- "$cur")
  COMPREPLY=( $(COMP_CWORD=${COMP_CWORD} npm completion --loglevel silent --color false \
                -- "${COMP_WORDS[@]}" ) )
  return $?
}

complete -o default -F __npm_completion npm
