#!/bin/bash
###-begin-npm-completion-###
#
# npm command completion script
#
# Installation: npm completion >> ~/.bashrc  (or ~/.zshrc)
# Or, maybe: npm completion > /usr/local/etc/bash_completion.d/npm
#

COMP_WORDBREAKS=${COMP_WORDBREAKS/=/}
COMP_WORDBREAKS=${COMP_WORDBREAKS/@/}
export COMP_WORDBREAKS

if complete &>/dev/null; then
  _npm_completion () {
    IFS=$'\n' COMPREPLY=( $(COMP_CWORD="$COMP_CWORD" \
                            COMP_LINE="$COMP_LINE" \
                            COMP_POINT="$COMP_POINT" \
                            npm completion -- "${COMP_WORDS[@]}" \
                            2>npm-completion.log) ) || return $?
  }
  complete -F _npm_completion npm
elif compctl &>/dev/null; then
  echo "todo: zsh version"
fi
###-end-npm-completion-###
