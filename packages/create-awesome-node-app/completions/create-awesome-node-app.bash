# bash completion for create-awesome-node-app
_create_awesome_node_app() {
  local cur prev opts
  COMPREPLY=()
  cur="${COMP_WORDS[COMP_CWORD]}"
  prev="${COMP_WORDS[COMP_CWORD-1]}"

  local top_opts="--help --version --verbose --info --no-install --template --addons --extend --use-yarn --use-pnpm --use-bun --force --interactive --no-interactive --list-templates --list-addons --set --keep-on-failure --strict-version --offline --no-cache --fixture --cache-dir --pin --refresh --add-completion"
  local cache_cmds="dir list clean verify outdated update doctor"
  local refresh_modes="always stale manual"
  local shells="bash zsh fish powershell"

  if [[ ${COMP_CWORD} -eq 1 ]]; then
    COMPREPLY=( $(compgen -W "cache ${top_opts}" -- "${cur}") )
    return 0
  fi

  if [[ "${COMP_WORDS[1]}" == "cache" ]]; then
    if [[ ${COMP_CWORD} -eq 2 ]]; then
      COMPREPLY=( $(compgen -W "${cache_cmds}" -- "${cur}") )
      return 0
    fi
    case "${prev}" in
      clean|verify|update)
        COMPREPLY=( $(compgen -W "--catalog --json --help" -- "${cur}") )
        return 0
        ;;
      list|outdated|doctor)
        COMPREPLY=( $(compgen -W "--json --help" -- "${cur}") )
        return 0
        ;;
    esac
  fi

  case "${prev}" in
    --refresh)
      COMPREPLY=( $(compgen -W "${refresh_modes}" -- "${cur}") )
      return 0
      ;;
    --add-completion)
      COMPREPLY=( $(compgen -W "${shells}" -- "${cur}") )
      return 0
      ;;
    --template|--addons|--extend|--cache-dir|--fixture|--pin|--set)
      COMPREPLY=( $(compgen -f -- "${cur}") )
      return 0
      ;;
  esac

  COMPREPLY=( $(compgen -W "${top_opts}" -- "${cur}") )
}

complete -F _create_awesome_node_app create-awesome-node-app
