#!/usr/bin/env bash
# Sourced by VS Code tasks, whose shells do not load interactive shell configuration.

if [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
	source "${NVM_DIR:-$HOME/.nvm}/nvm.sh" && nvm use || return $?
fi

if [ -z "${PNPM_HOME:-}" ]; then
	if [ -n "${XDG_DATA_HOME:-}" ]; then
		PNPM_HOME="$XDG_DATA_HOME/pnpm"
	elif [ "$(uname -s)" = "Darwin" ]; then
		PNPM_HOME="$HOME/Library/pnpm"
	else
		PNPM_HOME="$HOME/.local/share/pnpm"
	fi
fi

export PNPM_HOME
# Current pnpm uses bin/; older standalone installations use PNPM_HOME directly.
export PATH="$PNPM_HOME/bin:$PNPM_HOME:$PATH"
