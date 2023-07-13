const config = require('./release-notes.config')

module.exports = async ({github, context, core}) => {
  const pr = context.payload.pull_request;

  if (!pr) {
    console.log("Could not get PR from context");
    return;
  }

  const labels = await github.issues.listLabelsOnIssue({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: pr.number,
  });

  const labelNames = labels.data.map((label) => label.name);
  const configLabels = config.categories.flatMap((category) => category.labels);

  const hasRequiredLabel = labelNames.some((name) => configLabels.includes(name));

  if (!hasRequiredLabel) {
    await github.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: pr.number,
      body: "⚠️ This PR does not have a [release label](https://github.com/chanzuckerberg/napari-hub/blob/main/.github/release-notes.config.js). Please add one before merging.",
    });

    core.setFailed("Missing release label");
  }
}