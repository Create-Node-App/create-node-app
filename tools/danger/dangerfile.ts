import { danger, warn, fail, message, TextDiff } from "danger";

const SMALL_PR_FILES = 10;
const SMALL_PR_LINES = 200;

const DOC_FILE_MATCH = "**/*.md";
const SRC_FILE_REGEXP = /test.*\.([tj]s?)$/;

// No PR is too small to include a description of why you made a change
if (
  !danger.github.pr.body ||
  !danger.github.pr.body.includes("# What's this PR do?")
) {
  const title = ":clipboard: Missing Summary";
  const idea =
    "Can you add a Summary? " +
    "To do so, add a `# What's this PR do?` section to your PR description. " +
    "This is a good place to explain the motivation for making this change.";
  message(`${title} - <i>${idea}</i>`);
}

if (!danger.github.pr.title) {
  const title = ":id: Missing PR Title";
  const idea = "Can you add the relevant title?";
  warn(`${title} - <i>${idea}</i>`);
}

const touchedFiles = danger.git.created_files.concat(danger.git.modified_files);
const allFiles = touchedFiles.concat(danger.git.deleted_files);

const diffsList: Promise<(TextDiff | null)[]> = Promise.all(
  allFiles.map((p) => danger.git.diffForFile(p))
);

diffsList
  .then((diffs) => diffs.filter(Boolean) as TextDiff[])
  .then((diffs) => ({
    removed: diffs.reduce(
      (lines, diff) => lines + diff.removed.split("\n").length,
      0
    ),
    added: diffs.reduce(
      (lines, diff) => lines + diff.added.split("\n").length,
      0
    ),
    lines: diffs.reduce(
      (lines, diff) =>
        lines + diff.added.split("\n").length + diff.removed.split("\n").length,
      0
    ),
    files: diffs.length,
  }))
  .then((diff) => {
    if (diff.added < diff.removed) {
      message("Thanks! We :heart: removing more lines than added!");
    }

    if (diff.lines <= SMALL_PR_LINES && diff.files <= SMALL_PR_FILES) {
      message("Thanks! We :heart: small PRs!");
    }

    if (diff.lines > SMALL_PR_LINES) {
      warn(`This PR is changing more than ${SMALL_PR_LINES} lines.`);
    }

    if (diff.files > SMALL_PR_FILES) {
      warn(`This PR is changing more than ${SMALL_PR_FILES} files.`);
    }
  });

// Request changes to src also include changes to tests.
const docs = danger.git.fileMatch(DOC_FILE_MATCH);
const appModified = touchedFiles.some((p) => p.match(SRC_FILE_REGEXP));

if (docs.edited) {
  message("Thanks for updating docs! We :heart: documentation!");
}

if (appModified) {
  message(
    "Thanks for updating tests! Only YOU can prevent production fires. :fire::evergreen_tree::bear:"
  );
}

// Warns if there are changes to package.json, and tags the team.
const packageJSON = danger.git.fileMatch("package.json");
const yarnLockfile = danger.git.fileMatch("yarn.lock");
const npmLockfile = danger.git.fileMatch("package-lock.json");

if (packageJSON.modified) {
  const title = ":lock: package.json";
  const idea = "Changes were made to package.json.";
  warn(`${title} - <i>${idea}</i>`);
}

if (packageJSON.modified && !npmLockfile.modified) {
  const title = ":lock: package.json";
  const idea =
    "If you’ve changed any dependencies (added, removed or updated any packages), " +
    "please run `npm install` and commit changes in package-lock.json file. " +
    "Make sure you’re using the correct npm and node versions.";
  warn(`${title} - <i>${idea}</i>`);
}

if (!packageJSON.modified && npmLockfile.modified) {
  const title = ":lock: package.json";
  const idea =
    "Changes were made to `package-lock.json`, but not to `package.json`. " +
    "Please remove `package-lock.json` changes from your pull request. " +
    "Try to run `git checkout master -- package-lock.json` and commit changes.";
  fail(`${title} - <i>${idea}</i>`);
}

if (yarnLockfile.modified) {
  const title = ":rage: yarn.lock";
  const idea =
    "This PR is adding file `yarn.lock` and we don't use npm!. " +
    "Please remove `yarn.lock` and commit changes.";
  fail(`${title} - <i>${idea}</i>`);
}
