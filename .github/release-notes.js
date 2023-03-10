const config = require('./release-notes.config')

/**
 * Gets the latest non-draft release and returns the name and publish date.
 */
async function getLatestRelease(github, context) {
  const { data: release } = await github.rest.repos.getLatestRelease({
    owner: context.repo.owner,
    repo: context.repo.repo,
  })

  return release.name
}

async function getCommitsSinceLastRelease(exec) {
  const { LATEST_RELEASE, TARGET_BRANCH } = process.env
  const hashes = []

  await exec.exec(
    'git',
    ['log', '--pretty=format:"%h"', `${LATEST_RELEASE}..${TARGET_BRANCH}`],
    {
      listeners: {
        stdout(data) {
          const hash = data.toString()

          if (hash) {
            hashes.push(hash)
          }
        },
      },
    }
  )

  return hashes
    .flatMap(hash => hash.split('\n'))
    .filter(Boolean)
    .map(hash => hash.replaceAll('"', ''))
}

/**
 * Gets a list of pull requests since the last release and categorizes them
 * based on the configured PR labels.
 */
async function categorizePullRequests(github, context, exec) {
  const hashes = await getCommitsSinceLastRelease(exec)

  const pullRequests = await Promise.all(
    hashes.map(async hash => {
      const {
        data: [pr],
      } = await github.rest.repos.listPullRequestsAssociatedWithCommit({
        owner: context.repo.owner,
        repo: context.repo.repo,
        commit_sha: hash,
      })

      return pr
    })
  )

  const categorizedPullRequests = {}
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
      merged: pr.merged_at,
    })

    categorizedPullRequests[categoryKey] = prs
  }

  // Sort pull requests by merge date
  for (const prs of Object.values(categorizedPullRequests)) {
    prs.sort((pr1, pr2) => new Date(pr1.merged) - new Date(pr2.merged))
  }

  return JSON.stringify(categorizedPullRequests)
}

/**
 * Determines the next release tag to show. If the release is in the same month,
 * then the version number is incremented.
 */
function getNextReleaseTag() {
  const { LATEST_RELEASE } = process.env

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
  const match = versionRegex.exec(LATEST_RELEASE)

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
    `**Full Changelog**: https://github.com/chanzuckerberg/napari-hub/compare/${NEXT_RELEASE}...${LATEST_RELEASE}`
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
