#
# npm command completion script
#
# Install Method 1: Automatic
# Put this file in /etc/bash-completion.d or /usr/local/etc/bash-completion.d
# or wherever bash-completion scripts are sourced on your system.
#
# Install Method 2: Generic
# Put this in .bashrc or whatever file you run when you log into a machine:
# . path/to/npm-completion.sh
#
# Then use the tab key, which executes the "npm completion" command.
#
# Special thanks to Evan Meagher for making the npm completion command
# much more useful and complete.

export COMP_WORDBREAKS=${COMP_WORDBREAKS/@/}
export COMP_WORDBREAKS=${COMP_WORDBREAKS/=/}
__npm_completion () {
  COMPREPLY=()
  local cur prev opts
  cur="${COMP_WORDS[COMP_CWORD]}"
  prev="${COMP_WORDS[COMP_CWORD-1]}"
  # opts=$(npm complete --loglevel silent --color false -- "$cur")
  COMPREPLY=( $(COMP_CWORD=$COMP_CWORD \
                COMP_LINE=$COMP_LINE \
                COMP_POINT=$COMP_POINT \
                COMP_WORDBREAKS=$COMP_WORDBREAKS \
                COMP_WORDS="${COMP_WORDS[@]}" \
                npm completion --color false --loglevel warn \
                -- "${COMP_WORDS[@]}" \
                2>>./npm-completion.log ) )
  return $?
}

complete -o default -F __npm_completion npm
