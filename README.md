# bunny-deploy

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/R-J-dev/bunny-deploy/badge)](https://scorecard.dev/viewer/?uri=github.com/R-J-dev/bunny-deploy)

GitHub action for deploying your static app to Bunny CDN 🚀

✔️ Uploads a given directory to a storage zone on Bunny \
✔️ Doesn't upload unchanged files \
✔️ Optionally deletes directories and files from your storage zone that doesn't exist in the specified directory-to-upload \
✔️ Optionally purges the cache of a given pull zone \
✔️ Optionally use concurrency to make it fast

The default action for this GitHub action, is that it uploads a given directory to a storage zone on Bunny.
It also provides some extra features, which are listed under [Feature flags](#feature-flags-optional).
The required inputs could be different depending on the feature flag(s) that you enable. See for more info: [Config](#config).

> **Warnings (3)** ⚠️
>
> 1. There is no option yet to rollback the changes that you can make with this GitHub Action. When something fails while running this action, you might have to manually fix it yourself.
> 2. Ensure this action is not executed concurrently, otherwise it could result in unexpected errors and/or conflicting results. This might happen for example when you trigger this action on push. The action from the first push might still be running when you trigger the action again by the second push.
> 3. Ensure this action isn't cancelled in the middle of a run, because that could result in a broken static app.

## Example upload with delete and purge

See for more examples: [Examples](#examples)

```yaml
deploy:
  runs-on: ubuntu-22.04
  permissions:
    contents: read
  timeout-minutes: 5 # Depending on the size of your project
  steps:
    # Checkout repo
    # Build your code or download build cache
    - name: Deploy to Bunny
      uses: R-J-dev/bunny-deploy@vx.x.x # Select the version you wish to use
      with:
        access-key: ${{ secrets.BUNNY_ACCESS_KEY }}
        directory-to-upload: "./build"
        storage-endpoint: "https://storage.bunnycdn.com"
        storage-zone-name: "my-storage-zone"
        storage-zone-password: ${{ secrets.BUNNY_STORAGE_ZONE_PASSWORD }}
        concurrency: "50" # Make sure to check the docs about concurrency before choosing this setting
        enable-delete-action: true
        enable-purge-pull-zone: true
        pull-zone-id: "12345"
        replication-timeout: "15000"
        request-timeout: "5000" # optional, defaults to 5000
        retry-limit: "3" # optional, defaults to 3
```

## Config

### Required inputs for upload

<table>
  <tr>
    <th style="width: 150px">Key</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>storage-zone-password</td>
    <td>
      Your bunny.net storage zone password, you can find this in the storage zone details page FTP & API Access. It should have read & write access, otherwise it can't upload files for example. This is necessary for edge storage API requests that needs to be made to Bunny. See for more info: <a href="https://docs.bunny.net/reference/storage-api#header-name-accesskey">authentication header</a> in the docs. This will be read in src/config/config.ts, setSecret is used to mask it from logs (in case it will be logged by accident in your action run). Do not set this as plain text, save this as a secret in GitHub and reference here the secret id. See for more info: <a href="https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions#using-secrets-in-a-workflow">Using secrets in a workflow</a>. </br></br> In case you still have doubts, check the source code and pin this action to a full length commit SHA. See for more info: <a href="https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions#using-third-party-actions">Using third-party actions</a> about pinning an action to a full length commit SHA.
    </td>
  </tr>
  <tr>
    <td>directory-to-upload</td>
    <td>The path to the directory that needs to be uploaded to Bunny. An absolute path is preferred, but otherwise the action will combine the GITHUB_WORKSPACE with this input.</td>
  </tr>
  <tr>
    <td>storage-endpoint</td>
    <td>The storage API endpoint of your primary storage region. See for more info: <a href="https://docs.bunny.net/reference/storage-api#storage-endpoints">Storage Endpoints</a>.</td>
  </tr>
  <tr>
    <td>storage-zone-name</td>
    <td>The name of your storage zone, to determine to which storage zone the static app needs to upload.</td>
  </tr>
  <tr>
    <td>concurrency</td>
    <td>The maximum amount of concurrent actions (retrieving remote file info, deleting files, uploading files). For example this action can upload files using concurrency, but it depends on the GitHub runner and the API limit how much concurrent requests are possible. At Bunny the limit for concurrent uploads per storage zone seems to be 50. See for more info: <a href="https://docs.bunny.net/reference/edge-storage-api-limits">Edge Storage API Limits</a>.</td>
  </tr>
</table>

### Required inputs when purge is enabled

<table>
  <tr>
    <th style="width: 150px">Key</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>access-key</td>
    <td>
      Your bunny.net storage zone API key. This is necessary for the network requests that needs to be made to Bunny. See for more info: <a href="https://docs.bunny.net/reference/bunnynet-api-overview#header-name-accesskey">authentication header</a> in the docs. This will be read in src/config/config.ts, setSecret is used to mask it from logs (in case it will be logged by accident in your action run). Do not set this as plain text, save this as a secret in GitHub and reference here the secret id. See for more info: <a href="https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions#using-secrets-in-a-workflow">Using secrets in a workflow</a>. </br></br> In case you still have doubts, check the source code and pin this action to a full length commit SHA. See for more info: <a href="https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions#using-third-party-actions">Using third-party actions</a> about pinning an action to a full length commit SHA.
    </td>
  </tr>
  <tr>
    <td>pull-zone-id</td>
    <td>The pull zone id is required for purging the cache.</td>
  </tr>
  <tr>
    <td>replication-timeout</td>
    <td>
      The amount of milliseconds to wait before purging the cache. Unfortunately Bunny doesn't provide an api endpoint yet to check if the replicated storage zones are on the latest version (equal to main storage zone). See for more info: <a href="https://support.bunny.net/hc/en-us/articles/360020526159-Understanding-Geo-Replication">Understanding Geo-Replication</a>. As you can read in the before mentioned link, an uploaded file should be replicated to other regions within a couple of seconds. So I think it should be safe to set this to 15000 milliseconds (15 seconds), but check what works best for you.
    </td>
  </tr>
</table>

### Optional inputs for upload

<table>
  <tr>
    <th style="width: 150px">Key</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>target-directory</td>
    <td>The directory path where the files from directory-to-upload needs to be uploaded to inside your storage zone. When the target-directory hasn't been passed or is an empty string, then the directory-to-upload will be uploaded to the root of your storage zone.</td>
  </tr>
</table>

### Feature flags (optional)

<table>
  <tr>
    <th style="width: 150px">Key</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>enable-delete-action</td>
    <td>
      Removes directories and files from your storage zone that doesn't exists or doesn't have read access in the local specified directory-to-upload.
    </td>
  </tr>
  <tr>
    <td>enable-purge-pull-zone</td>
    <td>Purges the cache of the given pull-zone-id when all actions have finished.</td>
  </tr>
  <tr>
    <td>disable-upload</td>
    <td>Disables the default upload action. This makes it possible to run for example the delete and/or purge action only.</td>
  </tr>
  <tr>
    <td>disable-type-validation</td>
    <td>Disables type validation when the action retrieves file info. You probably will not need to disable the type validation, but in case Bunny changes their API and the action doesn't break due to the changes, you might choose to temporary disable the type validation. In the mean time a new PR can be created to fix this.</td>
  </tr>
</table>

## Examples

### Basic upload

```yaml
deploy:
  runs-on: ubuntu-22.04
  permissions:
    contents: read
  timeout-minutes: 5 # Depending on the size of your project
  steps:
    # Checkout repo
    # Build your code or download build cache
    - name: Deploy to Bunny
      uses: R-J-dev/bunny-deploy@vx.x.x # Select the version you wish to use
      with:
        storage-zone-password: ${{ secrets.BUNNY_STORAGE_ZONE_PASSWORD }}
        directory-to-upload: "./build"
        storage-endpoint: "https://storage.bunnycdn.com"
        storage-zone-name: "my-storage-zone"
        concurrency: "50" # Make sure to check the docs about concurrency before choosing this setting
```

### Upload with delete and purge

```yaml
deploy:
  runs-on: ubuntu-22.04
  permissions:
    contents: read
  timeout-minutes: 5 # Depending on the size of your project
  steps:
    # Checkout repo
    # Build your code or download build cache
    - name: Deploy to Bunny
      uses: R-J-dev/bunny-deploy@vx.x.x # Select the version you wish to use
      with:
        access-key: ${{ secrets.BUNNY_ACCESS_KEY }}
        directory-to-upload: "./build"
        storage-endpoint: "https://storage.bunnycdn.com"
        storage-zone-name: "my-storage-zone"
        storage-zone-password: ${{ secrets.BUNNY_STORAGE_ZONE_PASSWORD }}
        concurrency: "50" # Make sure to check the docs about concurrency before choosing this setting
        enable-delete-action: true
        enable-purge-pull-zone: true
        pull-zone-id: "12345"
        replication-timeout: "15000"
```

### Purge only

```yaml
purge:
  runs-on: ubuntu-22.04
  permissions:
    contents: read
  timeout-minutes: 5 # Depending on the size of your project
  steps:
    # Checkout repo
    # Build your code or download build cache
    - name: Purge pull zone
      uses: R-J-dev/bunny-deploy@vx.x.x # Select the version you wish to use
      with:
        access-key: ${{ secrets.BUNNY_ACCESS_KEY }}
        disable-upload: true
        enable-purge-pull-zone: true
        pull-zone-id: "12345"
        replication-timeout: "15000"
```

## More detailed information about how this action works

### How does this action determine which files can be skipped uploading?

The [list files API endpoint](https://docs.bunny.net/reference/get_-storagezonename-path-) from Bunny is used to do checksum comparisons with all the local files (also nested files in child directories) that are located in the given `directory-to-upload`. This way the action knows if a file has been changed or not.

> **Note**: The process of checking which files are unchanged is always enabled when you choose to upload or delete files with this action. In case deleting files is enabled, but `disable-upload` is true, unchanged files are still logged.

### How does this action determine which files can be deleted from the storage zone?

Files from the [list files API endpoint](https://docs.bunny.net/reference/get_-storagezonename-path-) from Bunny, including those in nested directories, are checked for local read access using Node.js's [access method](https://nodejs.org/api/fs.html#fspromisesaccesspath-mode). Files without local read access are marked as unknown remote files, because they either doesn't exist or doesn't have read access. When a local file doesn't have read access it also couldn't be uploaded, so it would make sense to delete it from the storage zone. If `enable-delete-action` is set to true, these files will be deleted from the storage zone.

> **Note**: The process of checking which files are unknown is always enabled when you choose to upload or delete files with this action. In case uploading files is enabled, but `enable-delete-action` is false, unknown or unreadable files are still logged.
