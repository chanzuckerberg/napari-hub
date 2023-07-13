const { Octokit } = require("@octokit/rest");
const config = require('./release-notes.config')

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function run() {
  const { context = {} } = github;
  const { pull_request: pr } = context.payload;

  if (!pr) {
    console.log("Could not get PR number from context.");
    return;
  }

  const { data: labels } = await octokit.issues.listLabelsOnIssue({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: pr.number,
  });

  const labelNames = labels.map((label) => label.name);
  const configLabels = config.categories.flatMap((category) => category.labels);

  const hasRequiredLabel = labelNames.some((name) => configLabels.includes(name));

  if (!hasRequiredLabel) {
    await octokit.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: pr.number,
      body: "⚠️ This PR does not have one of the required labels. Please add one before merging.",
    });

    throw new Error("Missing required label");
  }
}

run();
