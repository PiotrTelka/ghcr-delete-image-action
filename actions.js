const utils = require("./utils");
const core = require("@actions/core");

async function deleteByTag(config, octokit) {
  core.info(`🔎 search package version with tag ${config.tag}...`);

  const packageVersion = await utils.findPackageVersionByTag(
    octokit,
    config.owner,
    config.name,
    config.tag,
    config.isUser,
  );

  core.info(`🆔 package id is #${packageVersion.id}, delete it...`);

  await utils.deletePackageVersion(
    octokit,
    config.owner,
    config.name,
    packageVersion.id,
    config.isUser,
  );

  core.info(`✅ package #${packageVersion.id} deleted.`);
}

async function deleteAllUntagged(config, octokit) {
  core.info(`🔎 get all untagged packages...`);

  const pkgs = await utils.findPackageVersionsUntaggedOrderGreaterThan(
      octokit,
      config.owner,
      config.name,
      0,
      config.isUser,
  );

  core.startGroup(`🗑 delete ${pkgs.length} packages`);

  for (const pkg of pkgs) {
    await utils.deletePackageVersion(
        octokit,
        config.owner,
        config.name,
        pkg.id,
        config.isUser,
    );

    core.info(`✅ package #${pkg.id} deleted.`);
  }

  core.info(`✅ All ${pkgs.length} packages deleted.`);
}

module.exports = { deleteByTag, deleteAllUntagged };
