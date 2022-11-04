const utils = require("./utils");

let withEnv = (envs, cb) => {
  for (const k in envs) {
    process.env[k] = envs[k];
  }

  cb();

  for (const k in envs) {
    delete process.env[k];
  }
};

describe("getConfig", () => {
  test("throw error if value is missing", () => {
    expect(() => {
      utils.getConfig();
    }).toThrow();
  });

  const sharedRequiredOpts = {
    INPUT_OWNER: "bots-house",
    INPUT_NAME: "ghcr-delete-image-action",
    INPUT_TOKEN: "some-token",
  };

  test("returns valid config", () => {
    withEnv(
      {
        ...sharedRequiredOpts,
        INPUT_TAG: "latest",
      },
      () => {
        expect(utils.getConfig()).toStrictEqual({
          owner: "bots-house",
          name: "ghcr-delete-image-action",
          token: "some-token",
          tag: "latest",
          untaggedAll: null,
        });
      }
    );
  });

  test("throw error if no any required defined", () => {
    withEnv(
      {
        ...sharedRequiredOpts,
      },
      () => {
        expect(() => utils.getConfig()).toThrow(
          "no any required options defined"
        );
      }
    );
  });

  test("throw error if more then on selector defined", () => {
    withEnv(
      {
        ...sharedRequiredOpts,
        "INPUT_TAG": "2",
        "INPUT_UNTAGGED-ALL": "true",
      },
      () => {
        expect(() => utils.getConfig()).toThrow(
          "too many selectors defined, use only one"
        );
      }
    );
  });

  test("ok when untagged all is passed", () => {
    withEnv(
        {
          ...sharedRequiredOpts,
          "INPUT_UNTAGGED-ALL": "true"
        },
        () => {
          expect(utils.getConfig()).toStrictEqual(
              {
                owner: "bots-house",
                name: "ghcr-delete-image-action",
                token: "some-token",
                tag: null,
                untaggedAll: "true",
              }
          );
        }
    );
  });
});
