# PowerShell completion for create-awesome-node-app

Register-ArgumentCompleter -CommandName create-awesome-node-app -ScriptBlock {
  param($wordToComplete, $commandAst, $cursorPosition)

  $top = @(
    '--help', '--version', '--verbose', '--info', '--no-install',
    '--template', '--addons', '--extend',
    '--use-yarn', '--use-pnpm', '--use-bun',
    '--force', '--interactive', '--no-interactive',
    '--list-templates', '--list-addons', '--set',
    '--keep-on-failure', '--strict-version', '--offline', '--no-cache',
    '--fixture', '--cache-dir', '--pin', '--refresh', '--add-completion',
    'cache'
  )
  $cache = @('dir', 'list', 'clean', 'verify', 'outdated', 'update', 'doctor')
  $refresh = @('always', 'stale', 'manual')
  $shells = @('bash', 'zsh', 'fish', 'powershell')

  $tokens = $commandAst.CommandElements | ForEach-Object { $_.Extent.Text }
  $prev = if ($tokens.Count -ge 2) { $tokens[-2] } else { '' }

  $candidates = switch -Regex ($prev) {
    '^cache$' { $cache }
    '^--refresh$' { $refresh }
    '^--add-completion$' { $shells }
    default { $top }
  }

  $candidates |
    Where-Object { $_ -like "$wordToComplete*" } |
    ForEach-Object {
      [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_)
    }
}
