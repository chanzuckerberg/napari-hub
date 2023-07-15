const config = require('./release-notes.config')

module.exports = async ({github, context, core}) => {

    const pr = context.payload.pull_request;

    if (!pr) {
        console.log("Could not get PR from context");
        return;
    }

    const labels = await github.rest.issues.listLabelsOnIssue({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: pr.number,
    });

    const labelNames = labels.data.map((label) => label.name);
    const configLabels = config.categories.flatMap((category) => category.labels);
    const hasRequiredLabel = labelNames.some((name) => configLabels.includes(name));

    const botCommentBody = "⚠️ This PR does not have a [release label](https://github.com/chanzuckerberg/napari-hub/blob/main/.github/release-notes.config.js). Please add one before merging.";

    const comments = await github.rest.issues.listComments({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: pr.number,
    });

    const botComments = comments.data.filter((comment) => comment.user.login === 'github-actions[bot]' && comment.body === botCommentBody);

    if (!hasRequiredLabel) {
        // If the PR does not have a release label and if the bot has not left a comment before, leave a comment and fail the test.  
        if (botComments.length === 0) {
            await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: pr.number,
                body: botCommentBody,
            });

            core.setFailed("Missing release label");
        }
    } else if (botComments.length > 0) {
        // If the PR has a release label and the bot has left a comment before, delete it since it is no longer needed.
        for (let comment of botComments) {
            await github.rest.issues.deleteComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                comment_id: comment.id,
            });
        }
    }
}
