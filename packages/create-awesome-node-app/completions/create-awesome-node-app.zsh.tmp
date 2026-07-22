# shellcheck disable=SC2148
#compdef create-awesome-node-app

_create_awesome_node_app() {
  local -a top_opts cache_cmds refresh_modes shells

  top_opts=(
    '--help' '--version' '--verbose' '--info' '--no-install'
    '--template' '--addons' '--extend'
    '--use-yarn' '--use-pnpm' '--use-bun'
    '--force' '--interactive' '--no-interactive'
    '--list-templates' '--list-addons' '--set'
    '--keep-on-failure' '--strict-version' '--offline' '--no-cache'
    '--fixture' '--cache-dir' '--pin' '--refresh' '--add-completion'
  )
  cache_cmds=(dir list clean verify outdated update doctor)
  refresh_modes=(always stale manual)
  shells=(bash zsh fish powershell)

  if (( CURRENT == 2 )); then
    _arguments \
      '1: :->cmd' \
      '*:: :->args'
    _describe -t commands 'command' '(cache)'
    _describe -t options 'options' top_opts
    return
  fi

  if [[ ${words[2]} == cache ]]; then
    if (( CURRENT == 3 )); then
      _describe -t commands 'cache command' cache_cmds
      return
    fi
    _arguments '--json' '--catalog' '--help'
    return
  fi

  case ${words[CURRENT-1]} in
    --refresh)
      _describe -t values 'refresh mode' refresh_modes
      return
      ;;
    --add-completion)
      _describe -t values 'shell' shells
      return
      ;;
    --template|--addons|--extend|--cache-dir|--fixture|--pin|--set)
      _files
      return
      ;;
  esac

  _describe -t options 'options' top_opts
}

compdef _create_awesome_node_app create-awesome-node-app
