npm-completion(1) -- Tab Completion for npm
===========================================

## SYNOPSIS

    npm completion >> ~/.bashrc
    npm completion >> ~/.zshrc

## DESCRIPTION

Sets up a function that enables tab-completion in all npm commands.

You may of course also pipe the relevant script to a file such as
`/usr/local/etc/bash_completion.d/npm` if you have a system that will
read that file for you.

When `COMP_CWORD`, `COMP_LINE`, and `COMP_POINT` are defined in the
environment, `npm completion` acts in "plumbing mode", and outputs
completions based on the arguments.
