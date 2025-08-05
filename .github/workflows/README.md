# CI/CD Workflows

This document explains the purpose and usage of the automated workflows in this repository.

---

## Workflow: `Build and deploy the Backend`

### 🚀 Overview

This workflow automates the process of building, publishing, and deploying the **backend**
application located in `/apps/backend`. It is designed to handle deployments for the **production**
environments based on the **main** branch of the repository.

The workflow determines the target environment automatically, builds the specific
`Dockerfile_Backend`, and publishes the resulting Docker image to the
[GitHub Container Registry](https://github.com/lapis-project/lapis/pkgs/container/lapis-backend-dev).
Finally, it calls a reusable deployment workflow to deploy the image to the ACDH k8s cluster with
the
[deploy](https://github.com/lapis-project/gl-autodevops-minimal-port/blob/main/.github/workflows/deploy.yml)
workflow found in `gl-autodevops-minimal-port/.github/workflows/deploy.yml`.

---

### 🛠️ How to Use

This workflow can be triggered manually for the **main** branch

#### Manual Deployment

You can trigger this workflow manually by following these steps.

1.  Navigate to the **Actions** tab in the GitHub repository.
2.  Select the **"Build and deploy the Backend"** workflow from the list on the left.
3.  Click the **"Run workflow"** dropdown button.
4.  Choose the **main** **branch** from the "Use workflow from" dropdown.
5.  Click the green **"Run workflow"** button.

---

### ⚙️ Configuration Required

For this workflow to run successfully, the following **GitHub Variables** must be configured in your
repository or environment settings (`Settings > Secrets and variables > Actions > Variables`). This
workflow is designed to be used with either tags (for example: **backend-v1.0.0**) or if not a
matching tag can be found the **main** branch is used. The used environment is the **prod-backend**
environment and contains the values for the deployment.

| Variable Name              | Environment | Description                                                                                                                     |
| :------------------------- | :---------- | :------------------------------------------------------------------------------------------------------------------------------ |
| `PUBLIC_URL_BACKEND`       | `Optional`  | The full public URL for the backend service (e.g., `https://lapis-backend.lapis-backend.at`). If not set, it is auto-generated. |
| `KUBE_INGRESS_BASE_DOMAIN` | `Required`  | The base domain for your Kubernetes cluster ingress (e.g., `lapis-online.at`).                                                  |
| `SERVICE_ID_BACKEND`       | `Required`  | The service identifier on for the corresponding redmine issue.                                                                  |

---

## Workflow: `Build and deploy the LexAT21 App`

### 🚀 Overview

This workflow automates the process of building, publishing, and deploying the **LexAT** frontend
application located in `/apps/lexat`. It is designed to handle deployments for the **production**
environments based on the **main** branch of the repository.

The workflow determines the target environment automatically, builds the specific `Dockerfile_Lexat`
with the required build arguments, and publishes the resulting Docker image to the
[GitHub Container Registry](https://github.com/lapis-project/lapis/pkgs/container/lapis-lexat-frontend).
Finally, it calls a reusable deployment workflow to deploy the image to the ACDH k8s cluster with
the
[deploy](https://github.com/lapis-project/gl-autodevops-minimal-port/blob/main/.github/workflows/deploy.yml)
workflow found in `gl-autodevops-minimal-port/.github/workflows/deploy.yml`.

---

### 🛠️ How to Use

This workflow can be triggered manually for the **main** branch

#### Manual Deployment

You can trigger this workflow manually.

1.  Navigate to the **Actions** tab in the GitHub repository.
2.  Select the **"Build and deploy the Corpus App"** workflow from the list on the left.
3.  Click the **"Run workflow"** dropdown button.
4.  Choose the **branch** or **tag** you wish to deploy from the "Use workflow from" dropdown.
5.  Click the green **"Run workflow"** button.

---

### ⚙️ Configuration Required

For this workflow to run successfully, the following **GitHub Variables** must be configured in your
repository or environment settings (`Settings > Secrets and variables > Actions > Variables`). This
workflow is designed to be used with either tags (for example: **lexat-v1.0.0**) or if not a
matching tag can be found the **main** branch is used. The used environment is the **prod-lexat**
environment and contains the values for the deployment.

| Variable Name                         | Environment | Description                                                                     |
| :------------------------------------ | :---------- | :------------------------------------------------------------------------------ |
| `PUBLIC_URL_FRONTEND`                 | `Optional`  | The full public URL for the frontend service. If not set, it is auto-generated. |
| `KUBE_INGRESS_BASE_DOMAIN`            | `Required`  | The base domain for your Kubernetes cluster ingress (e.g., `lapis-online.at`).  |
| `APP_ROOT_FRONTEND`                   | `Required`  | The application root path on the server (e.g., `/`).                            |
| `SERVICE_ID_FRONTEND`                 | `Required`  | The service identifier on for the corresponding redmine issue.                  |
| `NUXT_PUBLIC_MAP_BASELAYER_URL_DARK`  | `Required`  | The URL for the dark mode map tile baselayer.                                   |
| `NUXT_PUBLIC_MAP_BASELAYER_URL_LIGHT` | `Required`  | The URL for the light mode map tile baselayer.                                  |
| `NUXT_PUBLIC_ZOTERO_BASE_URL`         | `Required`  | The base URL for the Zotero integration.                                        |

---

## Workflow: `Build and deploy the Corpus App`

### 🚀 Overview

This workflow automates the process of building, publishing, and deploying the **Corpus** frontend
application located in `/apps/corpus`. It is designed to handle deployments for the **production**
environments based on the **main** branch of the repository.

The workflow determines the target environment automatically, builds the specific
`Dockerfile_Corpus` with the required build arguments, and publishes the resulting Docker image to
the
[GitHub Container Registry](https://github.com/lapis-project/lapis/pkgs/container/lapis-corpus-frontend).
Finally, it calls a reusable deployment workflow to deploy the image to the ACDH k8s cluster with
the
[deploy](https://github.com/lapis-project/gl-autodevops-minimal-port/blob/main/.github/workflows/deploy.yml)
workflow found in `gl-autodevops-minimal-port/.github/workflows/deploy.yml`.

---

### 🛠️ How to Use

This workflow can be triggered manually for the **main** branch

#### Manual Deployment

You can trigger this workflow manually.

1.  Navigate to the **Actions** tab in the GitHub repository.
2.  Select the **"Build and deploy the Corpus App"** workflow from the list on the left.
3.  Click the **"Run workflow"** dropdown button.
4.  Choose the **branch** or **tag** you wish to deploy from the "Use workflow from" dropdown.
5.  Click the green **"Run workflow"** button.

---

### ⚙️ Configuration Required

For this workflow to run successfully, the following **GitHub Variables** must be configured in your
repository or environment settings (`Settings > Secrets and variables > Actions > Variables`). This
workflow is designed to be used with either tags (for example: **corpus-v1.0.0**) or if not a
matching tag can be found the **main** branch is used. The used environment is the **prod-corpus**
environment and contains the values for the deployment.

| Variable Name                         | Environment | Description                                                                     |
| :------------------------------------ | :---------- | :------------------------------------------------------------------------------ |
| `PUBLIC_URL_FRONTEND`                 | `Optional`  | The full public URL for the frontend service. If not set, it is auto-generated. |
| `KUBE_INGRESS_BASE_DOMAIN`            | `Required`  | The base domain for your Kubernetes cluster ingress (e.g., `lapis-online.at`).  |
| `APP_ROOT_FRONTEND`                   | `Required`  | The application root path on the server (e.g., `/`).                            |
| `SERVICE_ID_FRONTEND`                 | `Required`  | The service identifier on for the corresponding redmine issue.                  |
| `NUXT_PUBLIC_MAP_BASELAYER_URL_DARK`  | `Required`  | The URL for the dark mode map tile baselayer.                                   |
| `NUXT_PUBLIC_MAP_BASELAYER_URL_LIGHT` | `Required`  | The URL for the light mode map tile baselayer.                                  |
| `NUXT_PUBLIC_ZOTERO_BASE_URL`         | `Required`  | The base URL for the Zotero integration.                                        |

---

## ✨ Additional Notes

- **Concurrency Control**: The `concurrency` block ensures that only one instance of this workflow
  runs at a time for a specific branch or tag. If a new commit is pushed, the previous in-progress
  run will be automatically canceled.
- **Cache Cleanup**: The `clean_up_cache` job automatically purges older build caches to prevent
  them from growing indefinitely.

---

## Workflow: `Create App Version Tag`

### 🚀 Overview

This workflow automates the creation of signed, semantic version Git tags for a specific application
(`backend`, `lexat`, or `corpus`). It is designed to be triggered manually, providing precise
control over when and what gets versioned.

## The workflow identifies the last relevant commit for the chosen application, calculates the next version number based on Conventional Commit messages, and then creates and pushes tag to that commit.

### 🛠️ How to Use

This workflow must be triggered manually. It is the primary method for creating official version
tags for production or release candidate builds.

1.  Navigate to the **Actions** tab in the GitHub repository.
2.  Ensure you are on the **`main`** branch. The workflow will not run if triggered from any other
    branch.
3.  Select the **"Create App Version Tag"** workflow from the list on the left.
4.  Click the **"Run workflow"** dropdown button.
5.  Fill out the required inputs as described in the table below.
6.  Click the green **"Run workflow"** button to start the tagging process.

---

### ⚙️ Inputs & Configuration

This workflow requires manual inputs.

#### Manual Inputs

| Parameter  | Description                                           | Required | Example |
| :--------- | :---------------------------------------------------- | :------- | :------ |
| `app_name` | The application you want to create a version tag for. | Yes      | `lexat` |

#### Required Secrets

For GPG signing to work, the following secrets must be configured in your repository settings
(`Settings > Secrets and variables > Actions > Secrets`).

| Secret Name       | Description                                                                 |
| :---------------- | :-------------------------------------------------------------------------- |
| `GPG_PRIVATE_KEY` | The full, ASCII-armored GPG private key block used for signing the Git tag. |
| `GPG_PASSPHRASE`  | The passphrase associated with the GPG private key.                         |

---

### ✨ Additional Notes & Ideas

- **Semantic Versioning Logic**: This workflow relies on the
  [paulhatch/semantic-version@v5.4.0](https://github.com/paulhatch/semantic-version) action to
  automatically calculate the next version number.

- **Versioning Strategy**: The version bump is determined by the format of your commit messages.

  - A **MAJOR** version bump (e.g., `v1.2.3` -> `v2.0.0`) is triggered by a commit message starting
    with `feat(app-name)!:`. The `!` indicates a breaking change.
    - Example: `feat(lexat)!: remove deprecated search endpoint`
  - A **MINOR** version bump (e.g., `v1.2.3` -> `v1.3.0`) is triggered by a commit message starting
    with `feat(app-name):`.
    - Example: `feat(lexat): add new filter option to search`
  - A **PATCH** version bump (e.g., `v1.2.3` -> `v1.2.4`) is the default for other standard commit
    types like `fix:`, etc.

- **Scoped Versioning**: This workflow checks changes in the respective directories for the apps. It
  uses the `change_path` parameter to ensure that only commits affecting a specific app's directory
  (e.g., `/apps/lexat`) will trigger a version bump for that app.

- **Targeted Tagging**: The tag is not simply placed on the latest commit of `main`. Instead, the
  workflow finds the **last commit that actually modified the chosen application's code** and
  attaches the tag there. This ensures maximum accuracy in versioning.

- **Branch Restriction**: This workflow includes a check (`if: github.ref_name == 'main'`) to ensure
  it can only be run from the `main` branch.

---

## Workflow: `Create App Version Tag`

### 🚀 Overview

This workflow automates the creation of semantic version Git tags for a specific application
(`backend`, `lexat`, or `corpus`). It is designed to be triggered manually.

The workflow identifies the last relevant commit for the chosen application, calculates the next
version number based on Conventional Commit messages, and then creates and pushes an annotated tag
to that specific commit.

---

### 🛠️ How to Use

This workflow must be triggered manually. It is the primary method for creating official version
tags.

1.  Navigate to the **Actions** tab in the GitHub repository.
2.  Select the **"Create App Version Tag"** workflow from the list on the left.
3.  Click the **"Run workflow"** dropdown button.
4.  Ensure you are on the **`main`** branch, as the workflow will not run if triggered from any
    other branch.
5.  Fill out the required inputs as described in the table below.
6.  Click the green **"Run workflow"** button to start the tagging process.

---

### ⚙️ Inputs & Configuration

This workflow requires the following manual inputs to run.

#### Manual Inputs

| Parameter  | Description                                           | Required | Default | Options                      |
| :--------- | :---------------------------------------------------- | :------- | :------ | :--------------------------- |
| `app_name` | The application you want to create a version tag for. | Yes      | `N/A`   | `backend`, `lexat`, `corpus` |

---

### ✨ Additional Notes

- **Branch Restriction**: This workflow includes a check (`if: github.ref_name == 'main'`) to ensure
  it can only be run from the `main` branch.

- **Semantic Versioning Logic**: The workflow uses the
  [paulhatch/semantic-version](https://github.com/paulhatch/semantic-version) action to
  automatically calculate the next version number based on your commit history.

- **Versioning Strategy**: The version bump is determined by the format of your commit messages
  within the application's specific path (e.g., `apps/lexat`).

  - A **MAJOR** version bump (e.g., `v1.2.3` -> `v2.0.0`) is triggered by a commit message with a
    breaking change indicator (`!`) in the header.
    - Example: `feat(lexat)!: remove deprecated search endpoint`
  - A **MINOR** version bump (e.g., `v1.2.3` -> `v1.3.0`) is triggered by a `feat` commit.
    - Example: `feat(lexat): add new filter option to search`
  - A **PATCH** version bump (e.g., `v1.2.3` -> `v1.2.4`) is the default for other standard commit
    types like `fix:`, `chore:`, etc.

- **Scoped Versioning**: This workflow isolates versioning for each application. It uses the
  `change_path` parameter to ensure that only commits affecting a specific app's directory (e.g.,
  `/apps/lexat`) will be considered for a version bump for that app.

- **Targeted Tagging**: The tag is not placed on the latest commit of the `main` branch by default.
  Instead, the workflow finds the **last commit that actually modified the chosen application's
  code** and attaches the new version tag there. This ensures maximum accuracy in versioning.

- **No Version Change**: If no new version is detected based on the commit history since the last
  tag for that app, the workflow will simply report that and exit without creating a new tag.
