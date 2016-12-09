#compdef npm

# Zsh completion script for npm, modified from hg version
# Rename this file to _npm and copy
# it into your zsh function path (/usr/share/zsh/site-functions for
# instance)
#
# If you do not want to install it globally, you can copy it somewhere
# else and add that directory to $fpath. This must be done before
# compinit is called. If the file is copied to ~/.zsh.d, your ~/.zshrc
# file could look like this:
#
# fpath=("$HOME/.zsh.d" $fpath)
# autoload -U compinit
# compinit
#
# Copyright (C) 2005, 2006 Steve Borho <steve@borho.org>
# Copyright (C) 2006-10 Brendan Cully <brendan@kublai.com>
# Copyright (C) 2011 Qing 'kuno' Guan <neokuno AT gmail DOT com>
#
# Permission is hereby granted, without written agreement and without
# licence or royalty fees, to use, copy, modify, and distribute this
# software and to distribute modified versions of this software for any
# purpose, provided that the above copyright notice and the following
# two paragraphs appear in all copies of this software.
#
# In no event shall the authors be liable to any party for direct,
# indirect, special, incidental, or consequential damages arising out of
# the use of this software and its documentation, even if the authors
# have been advised of the possibility of such damage.
#
# The authors specifically disclaim any warranties, including, but not
# limited to, the implied warranties of merchantability and fitness for
# a particular purpose.  The software provided hereunder is on an "as
# is" basis, and the authors have no obligation to provide maintenance,
# support, updates, enhancements, or modifications.

emulate -LR zsh
setopt extendedglob

local curcontext="$curcontext" state line
typeset -A _npm_cmd_globals

_npm() {
  local cmd
  integer i=2
  _npm_cmd_globals=()

  while (( i < $#words ))
  do
    if [[ -z "$cmd" ]]
    then
      cmd="$words[$i]"
      words[$i]=()
      (( CURRENT-- ))
    fi
    (( i++ ))
  done

  if [[ -z "$cmd" ]]
  then
    _arguments -s -w : $_npm_global_opts \
    ':npm command:_npm_commands'
    return
  fi

  # resolve abbreviations and aliases
  if ! (( $+functions[_npm_cmd_${cmd}] ))
  then
    local cmdexp
    (( $#_npm_cmd_list )) || _npm_get_commands

    cmdexp=$_npm_cmd_list[(r)${cmd}*]
    if [[ $cmdexp == $_npm_cmd_list[(R)${cmd}*] ]]
    then
      # might be nice to rewrite the command line with the expansion
      cmd="$cmdexp"
    fi
    if [[ -n $_npm_alias_list[$cmd] ]]
    then
      cmd=$_npm_alias_list[$cmd]
    fi
  fi

  curcontext="${curcontext%:*:*}:npm-${cmd}:"

  zstyle -s ":completion:$curcontext:" cache-policy update_policy

  if [[ -z "$update_policy" ]]
  then
    zstyle ":completion:$curcontext:" cache-policy _npm_cache_policy
  fi

  if (( $+functions[_npm_cmd_${cmd}] ))
  then
    _npm_cmd_${cmd}
  else
    # complete unknown commands normally
    _arguments -s -w : $_npm_global_opts \
      '*:files:_npm_files'
  fi
}

_npm_cache_policy() {
  typeset -a old

  # cache for a minute
  old=( "$1"(mm+10) )
  (( $#old )) && return 0

  return 1
}

_npm_get_commands() {
  typeset -ga _npm_cmd_list
  typeset -gA _npm_alias_list
  local hline cmd cmdalias

  _call_program npm npm completion | while read -A hline
  do
    cmd=$hline[1]
    _npm_cmd_list+=($cmd)

    for cmdalias in $hline[2,-1]
    do
      _npm_cmd_list+=($cmdalias)
      _npm_alias_list+=($cmdalias $cmd)
    done
  done
}

_npm_commands() {
  (( $#_npm_cmd_list )) || _npm_get_commands
  _describe -t commands 'npm command' _npm_cmd_list
}

_npm "$@"
