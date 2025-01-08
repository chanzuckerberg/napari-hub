module.exports = {
  /**
   * Different categories to show on the release page based on a specific PR
   * label. The order of the array determines the order of the categories.
   */
  categories: [
    {
      title: '🚀 New Features',
      key: 'new-feature',
      labels: ['new-feature'],
    },

    {
      title: '⚡️ Improvements',
      key: 'improvement',
      labels: ['improvement'],
    },

    {
      title: '🚀 Bug Fixes',
      key: 'bug-fix',
      labels: ['bug-fix'],
    },

    {
      title: '🧰 Maintenance',
      key: 'maintenance',
      labels: ['maintenance'],
    },

    {
      title: '🤖 CI/CD',
      key: 'cicd',
      labels: ['cicd'],
    },

    {
      title: '🤔 Uncategorized',
      key: 'uncategorized',
      labels: [],
    },
  ],

  /**
   * Ignore specific commits that cause problems with the release notes workflow.
   */
  ignoreCommits: [
    "e5b0a312ddb1d508b2d14b4c101b894f2a4c7356", // committed without PR
  ],
}
