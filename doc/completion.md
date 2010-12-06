npm-completion(1) -- Tab Completion for npm
===========================================

## DESCRIPTION

You should set up tab completion for npm if you haven't already.
There are a few ways to do this:

1. Add `. /path/to/npm-completion.sh` to your ~/.bashrc file. OR:
2. Create a symlink like this if you have automatic bash completion set up:
  `ln - /path/to/npm-completion.sh /etc/bash-completion.d/npm`
  or, perhaps:
  `ln - /path/to/npm-completion.sh /usr/local/etc/bash-completion.d/npm`

If you're using a non-bash shell (like zsh or ksh) then this might not work.

To get the path to the npm-completion.sh file, use `npm explore npm pwd`.

It's a very new feature, and it would be great to get feedback on it.
Hopefully, I'll be able to work out a way to install the completion script
automatically.  If you have any ideas about how that should work, then please
share them.
