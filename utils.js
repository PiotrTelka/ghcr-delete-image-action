const core = require("@actions/core");

/**
 * Parse input from env.
 * @returns Config
 */
let getConfig = function () {
  const config = {
    owner: core.getInput("owner", { required: true }),
    name: core.getInput("name", { required: true }),
    token: core.getInput("token", { required: true }),
    tag: core.getInput("tag") || null,
    untaggedAll: core.getInput("untagged-all") || null,
    isUser: core.getInput("is-user") || false,
  };

  const definedOptionsCount = [
    config.tag,
    config.untaggedAll,
  ].filter((x) => x !== null).length;

  if (definedOptionsCount === 0) {
    throw new Error("no any required options defined");
  } else if (definedOptionsCount > 1) {
    throw new Error("too many selectors defined, use only one");
  }

  return config;
};

let findPackageVersionByTag = async function (octokit, owner, name, tag, isUser) {
  const tags = new Set();

  for await (const pkgVer of iteratePackageVersions(octokit, owner, name, isUser)) {
    const versionTags = pkgVer.metadata.container.tags;

    if (versionTags.includes(tag)) {
      return pkgVer;
    } else {
      versionTags.map((item) => {
        tags.add(item);
      });
    }
  }

  throw new Error(
    `package with tag '${tag}' does not exits, available tags: ${Array.from(
      tags
    ).join(", ")}`
  );
};

let findPackageVersionsUntaggedOrderGreaterThan = async function (
  octokit,
  owner,
  name,
  n,
  isUser
) {
  const pkgs = [];

  for await (const pkgVer of iteratePackageVersions(octokit, owner, name, isUser)) {
    const versionTags = pkgVer.metadata.container.tags;
    if (versionTags.length === 0) {
      pkgs.push(pkgVer);
    }
  }

  pkgs.sort((a, b) => {
    return new Date(b.updated_at) - new Date(a.updated_at);
  });

  return pkgs.slice(n);
};

let iteratePackageVersions = async function* (octokit, owner, name, isUser) {
  const dataUser = {
    package_type: "container",
    package_name: name,
    username: owner,
    per_page: 100,
  }

  const dataOrg = {
    package_type: "container",
    package_name: name,
    org: owner,
    per_page: 100,
  }

  for await (const response of octokit.paginate.iterator(
    isUser ? octokit.rest.packages.getAllPackageVersionsForPackageOwnedByUser : octokit.rest.packages.getAllPackageVersionsForPackageOwnedByOrg,
    isUser ? dataUser : dataOrg
  )) {
    for (let packageVersion of response.data) {
      yield packageVersion;
    }
  }
};

let deleteVersionsUser = async (octokit, owner, name, versionId) => {
  await octokit.rest.packages.deletePackageVersionForUser({
    package_type: "container",
    package_name: name,
    username: owner,
    package_version_id: versionId,
  });
}

let deleteVersionsOrg = async (octokit, owner, name, versionId) => {
  await octokit.rest.packages.deletePackageVersionForOrg({
    package_type: "container",
    package_name: name,
    org: owner,
    package_version_id: versionId,
  });
}

let deletePackageVersion = async (octokit, owner, name, versionId, isUser) => {
  if (isUser) await deleteVersionsUser(octokit, owner, name, versionId)
  else  await deleteVersionsOrg(octokit, owner, name, versionId)
};

module.exports = {
  getConfig,
  findPackageVersionByTag,
  deletePackageVersion,
  findPackageVersionsUntaggedOrderGreaterThan,
};
