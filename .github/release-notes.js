const config = require('./release-notes.config')

/**
 * Gets the latest non-draft release and returns the name and publish date.
 */
async function getLatestRelease(github, context) {
  const { data: release } = await github.rest.repos.getLatestRelease({
    owner: context.repo.owner,
    repo: context.repo.repo,
  })

  return JSON.stringify({
    latestRelease: release.name,
    publishDate: release.published_at,
  })
}

/**
 * Gets a list of pull requests since the last release and categorizes them
 * based on the configured PR labels.
 */
async function categorizePullRequests(github, context) {
  const { LATEST_RELEASE } = process.env
  const { publishDate } = JSON.parse(LATEST_RELEASE)

  const date = new Date(publishDate)
  const formattedPublishDate = `${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()}`

  // There is no API for getting pull requests since a git tag, so we need to
  // use the search API + query params to find merged PRs after the last release
  // date.
  const result = await github.rest.search.issuesAndPullRequests({
    q: [
      'is:merged',
      `repo:${context.repo.owner}/${context.repo.repo}`,
      `merged:>=${formattedPublishDate}`,
    ].join(' '),
  })

  const categorizedPullRequests = {}
  const pullRequests = result.data.items

  for (const pr of pullRequests) {
    const category = config.categories.find(cat => {
      return cat.labels.some(label =>
        pr.labels.some(prLabel => prLabel.name === label)
      )
    })

    const categoryKey = category?.key ?? 'uncategorized'
    const prs = categorizedPullRequests[categoryKey] ?? []

    prs.push({
      title: pr.title,
      number: pr.number,
      user: pr.user.login,
    })

    categorizedPullRequests[categoryKey] = prs
  }

  return JSON.stringify(categorizedPullRequests)
}

/**
 * Determines the next release tag to show. If the release is in the same month,
 * then the version number is incremented.
 */
function getNextReleaseTag() {
  const { LATEST_RELEASE } = process.env
  const { latestRelease } = JSON.parse(LATEST_RELEASE)

  const date = new Date()
  const month = date.getMonth() + 1
  const year = date.getFullYear()

  const formattedYear = String(year).slice(2)
  let formattedMonth = String(month)
  if (month < 10) {
    formattedMonth = `0${formattedMonth}`
  }

  const versionRegex = new RegExp(
    `v${formattedYear}\.${formattedMonth}\.([0-9]*)`
  )
  const match = versionRegex.exec(latestRelease)

  let versionNumber = 0

  if (match) {
    const [, version] = match
    versionNumber = +version
    if (Number.isNaN(versionNumber)) {
      versionNumber = 0
    } else {
      versionNumber += 1
    }
  }

  return `v${formattedYear}.${formattedMonth}.${versionNumber}`
}

/**
 * Creates a new release notes draft using the categories
 */
async function draftReleaseNotes(github, context, core) {
  const { LATEST_RELEASE, NEXT_RELEASE, PULL_REQUESTS } = process.env
  const { latestRelease } = JSON.parse(LATEST_RELEASE)
  const pullRequests = JSON.parse(PULL_REQUESTS)

  let body = []
  for (const category of config.categories) {
    const prs = pullRequests[category.key]
    if (prs && prs.length > 0) {
      body.push(`## ${category.title}`)
      for (const pr of prs) {
        body.push(`- #${pr.number} ${pr.title} by @${pr.user}`)
      }
    }
  }

  body.push(
    // Push empty string for newline
    '',
    `**Full Changelog**: https://github.com/chanzuckerberg/napari-hub/compare/${NEXT_RELEASE}...${latestRelease}`
  )

  const releaseProps = {
    body: body.join('\n'),
    draft: true,
    owner: context.repo.owner,
    repo: context.repo.repo,
    name: NEXT_RELEASE,
    tag_name: NEXT_RELEASE,
  }

  const { data: releases } = await github.rest.repos.listReleases({
    owner: context.repo.owner,
    repo: context.repo.repo,
  })

  const [mostRecentRelease] = releases
  if (mostRecentRelease.draft) {
    core.notice(`Updating existing release ${NEXT_RELEASE}`)
    await github.rest.repos.updateRelease({
      ...releaseProps,
      release_id: mostRecentRelease.id,
    })
  } else {
    core.notice(`Creating new release ${NEXT_RELEASE}`)
    await github.rest.repos.createRelease(releaseProps)
  }
}

module.exports = {
  getLatestRelease,
  categorizePullRequests,
  getNextReleaseTag,
  draftReleaseNotes,
}
