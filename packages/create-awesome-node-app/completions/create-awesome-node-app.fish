# fish completion for create-awesome-node-app

complete -c create-awesome-node-app -f

complete -c create-awesome-node-app -n __fish_use_subcommand -a cache -d 'Inspect and manage the local template cache'

complete -c create-awesome-node-app -n '__fish_seen_subcommand_from cache' -a 'dir list clean verify outdated update doctor'

complete -c create-awesome-node-app -l help -d 'Show help'
complete -c create-awesome-node-app -l version -d 'Show version'
complete -c create-awesome-node-app -l verbose -d 'Print additional logs'
complete -c create-awesome-node-app -l info -d 'Print environment debug info'
complete -c create-awesome-node-app -l no-install -d 'Skip dependency install'
complete -c create-awesome-node-app -l template -d 'Template URL or slug' -r
complete -c create-awesome-node-app -l addons -d 'Extension URL(s)' -r
complete -c create-awesome-node-app -l extend -d 'Extra extension URL(s)' -r
complete -c create-awesome-node-app -l use-yarn -d 'Use yarn'
complete -c create-awesome-node-app -l use-pnpm -d 'Use pnpm'
complete -c create-awesome-node-app -l use-bun -d 'Use bun'
complete -c create-awesome-node-app -l force -d 'Allow non-empty directory'
complete -c create-awesome-node-app -l interactive -d 'Force interactive mode'
complete -c create-awesome-node-app -l no-interactive -d 'Disable interactive mode'
complete -c create-awesome-node-app -l list-templates -d 'List templates'
complete -c create-awesome-node-app -l list-addons -d 'List addons'
complete -c create-awesome-node-app -l set -d 'Set custom option key=value' -r
complete -c create-awesome-node-app -l offline -d 'Use cache only'
complete -c create-awesome-node-app -l no-cache -d 'Disable catalog cache'
complete -c create-awesome-node-app -l fixture -d 'Use local fixtures catalog' -r
complete -c create-awesome-node-app -l cache-dir -d 'Override cache root' -r
complete -c create-awesome-node-app -l pin -d 'Pin template ref' -r
complete -c create-awesome-node-app -l refresh -d 'Refresh mode' -xa 'always stale manual'
complete -c create-awesome-node-app -l add-completion -d 'Print shell completion script' -xa 'bash zsh fish powershell'
complete -c create-awesome-node-app -l json -d 'JSON output (cache subcommands)'
complete -c create-awesome-node-app -l catalog -d 'Also clear catalog cache'
