# Director scripts

Set a task's `script` to one of the names below and provide its parameters in `inputArgs`.
Director supplies the execution context, including `taskId`, `logger`, and `scheduledAt`.
`scheduledAt` is the scheduled execution time, even when the task runs late; it is not an input argument.

## `example.echo`

Returns a message together with the execution context, `scheduledAt` as an ISO date string,
and a `timestamp` with the actual execution time.

| Parameter | Type   | Required | Description      |
| --------- | ------ | -------- | ---------------- |
| `message` | string | Yes      | Message to echo. |

Example `inputArgs`:

```json
{
    "message": "Hello from Director"
}
```

## `sum`

Adds two numbers and logs the task ID and scheduled execution time.
Returns a string such as `Hello from the sum script! 2 + 3 = 5`.

| Parameter | Type   | Required | Description    |
| --------- | ------ | -------- | -------------- |
| `a`       | number | Yes      | First number.  |
| `b`       | number | Yes      | Second number. |

Example `inputArgs`:

```json
{
    "a": 2,
    "b": 3
}
```

## `generateConsolidatedStates`

Requests asynchronous generation of consolidated States in Registry for one signature
at `scheduledAt`. Uses `temporalMode: "CAPTURE"`, `ifExists: "KEEP"`, and `isAsync=true`:
existing States are kept. Registry determines whether the scheduled date is a consolidation point.

| Parameter          | Type                                     | Required | Description                                  |
| ------------------ | ---------------------------------------- | -------- | -------------------------------------------- |
| `orgName`          | string                                   | Yes      | Organization name used in the Registry URL.  |
| `orgId`            | string                                   | Yes      | Organization ID for task metadata and logs.  |
| `scopeId`          | string                                   | Yes      | Scope identifier.                            |
| `agColId`          | string                                   | Yes      | Agreement collection identifier.             |
| `agreementVersion` | positive integer or `"auditableVersion"` | Yes      | Version number or current auditable version. |
| `signatureId`      | string                                   | Yes      | Signature whose States should be generated.  |

Example `inputArgs`:

```json
{
    "orgName": "organization",
    "orgId": "organization-id",
    "scopeId": "scope-id",
    "agColId": "agreement-collection-id",
    "agreementVersion": "auditableVersion",
    "signatureId": "69cbea571d5009a043619276"
}
```

Uses `REGISTRY_SERVICE_URL` and service authentication. Returns an acceptance message;
the task does not wait for State calculations to finish. A failed request fails the execution.

## `fetchFetcher`

Checks Fetcher's health and requests asynchronous data capture for one fetcher.
Sends `temporalContext.effectiveAt = scheduledAt`, `temporalContext.mode = "CAPTURE"`,
and `isAsync=true`.

| Parameter       | Type   | Required | Description                                         |
| --------------- | ------ | -------- | --------------------------------------------------- |
| `fetcherId`     | string | Yes      | Fetcher to execute.                                 |
| `fetcherConfig` | object | Yes      | Configuration required by the selected fetcher.     |
| `orgId`         | string | No       | Organization ID for task metadata and logs.         |
| `scopeId`       | string | No       | Scope ID for task metadata and logs.                |
| `agColId`       | string | No       | Agreement collection ID for task metadata and logs. |
| `versionNumber` | number | No       | Agreement version for task metadata and logs.       |

Example `inputArgs`:

```json
{
    "fetcherId": "FT_GQL_ZENHUB_ISSUES",
    "fetcherConfig": {
        "workspaceId": "workspace-id"
    },
    "orgId": "organization-id",
    "scopeId": "scope-id",
    "agColId": "agreement-collection-id",
    "versionNumber": 2
}
```

Uses `FETCHER_SERVICE_URL` and service authentication. The optional metadata is not sent
to Fetcher. Returns an acceptance message without waiting for capture to finish.
An unavailable Fetcher or a failed capture request fails the execution.

## `syncAgreementVersionStates`

Calls Reporter to synchronize States from Registry into InfluxDB, filtering by `updatedAt`.
The range is calculated from the scheduled execution time:

- `updatedFrom = scheduledAt - lookbackMs` (inclusive).
- `updatedTo = scheduledAt` (exclusive).

| Parameter          | Type                                     | Required | Description                                   |
| ------------------ | ---------------------------------------- | -------- | --------------------------------------------- |
| `orgName`          | string                                   | Yes      | Organization name used in the Reporter URL.   |
| `orgId`            | string                                   | Yes      | Organization ID for task metadata and logs.   |
| `scopeId`          | string                                   | Yes      | Scope identifier.                             |
| `agColId`          | string                                   | Yes      | Agreement collection identifier.              |
| `agreementVersion` | positive integer or `"auditableVersion"` | Yes      | Version number or current auditable version.  |
| `lookbackMs`       | positive integer                         | Yes      | How far back to synchronize, in milliseconds. |

Example `inputArgs`:

```json
{
    "orgName": "organization",
    "orgId": "organization-id",
    "scopeId": "scope-id",
    "agColId": "agreement-collection-id",
    "agreementVersion": "auditableVersion",
    "lookbackMs": 3600000
}
```

For `scheduledAt = 2026-09-22T11:00:00Z`, this example synchronizes States updated
from 10:00 UTC inclusive to 11:00 UTC exclusive, even if the execution starts later.

Uses `REPORTER_SERVICE_URL` and service authentication. `orgId` is metadata and is not
sent to Reporter. Waits for the synchronization response and returns its `data` as the
task execution result. Invalid inputs or a failed Reporter request fail the execution.
