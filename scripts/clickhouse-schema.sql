CREATE TABLE IF NOT EXISTS telemetry_submissions
(
    `submission_id`             UUID,
    `received_at`               DateTime('UTC'),
    `day`                       Date MATERIALIZED toDate(received_at),
    `country`                   LowCardinality(String),

    `uuid`                      UUID,

    `panel_version`             LowCardinality(String),
    `panel_container_type`      LowCardinality(String),
    `panel_database_version`    LowCardinality(String),
    `panel_cache_version`       LowCardinality(String),
    `panel_architecture`        LowCardinality(String),
    `panel_kernel_version`      String CODEC(ZSTD(3)),

    `users_total`               UInt64,
    `users_languages`           Map(LowCardinality(String), UInt64),
    `backups_total`             UInt64,
    `backups_disks`             Map(LowCardinality(String), UInt64),
    `servers_total`             UInt64,

    `nodes.version`                     Array(LowCardinality(String)),
    `nodes.container_type`              Array(LowCardinality(String)),
    `nodes.architecture`                Array(LowCardinality(String)),
    `nodes.kernel_version`              Array(String),
    `nodes.memory_total_bytes`          Array(UInt64),
    `nodes.memory_free_bytes`           Array(UInt64),
    `nodes.memory_used_bytes`           Array(UInt64),
    `nodes.memory_used_bytes_process`   Array(UInt64),
    `nodes.servers_total`               Array(UInt64),
    `nodes.servers_online`              Array(UInt64),
    `nodes.servers_offline`             Array(UInt64),

    `database_agent_hosts.version`                   Array(LowCardinality(String)),
    `database_agent_hosts.container_type`            Array(LowCardinality(String)),
    `database_agent_hosts.architecture`              Array(LowCardinality(String)),
    `database_agent_hosts.kernel_version`            Array(String),
    `database_agent_hosts.memory_total_bytes`        Array(UInt64),
    `database_agent_hosts.memory_free_bytes`         Array(UInt64),
    `database_agent_hosts.memory_used_bytes`         Array(UInt64),
    `database_agent_hosts.memory_used_bytes_process` Array(UInt64),
    `database_agent_hosts.instances_total`           Array(UInt64),
    `database_agent_hosts.instances_online`          Array(UInt64),
    `database_agent_hosts.instances_offline`         Array(UInt64),

    `extensions.package_name`      Array(LowCardinality(String)),
    `extensions.name`              Array(String),
    `extensions.description`       Array(String),
    `extensions.version`           Array(LowCardinality(String)),
    `extensions.panel_version_req` Array(LowCardinality(String)),
    `extensions.authors`           Array(Array(String)),
    `extensions.has_license`       Array(UInt8),

    `node_count`               UInt32 MATERIALIZED length(`nodes.version`),
    `database_agent_host_count` UInt32 MATERIALIZED length(`database_agent_hosts.version`),
    `extension_count`          UInt32 MATERIALIZED length(`extensions.package_name`)
)
ENGINE = ReplacingMergeTree(received_at)
PARTITION BY toYYYYMM(day)
ORDER BY (day, uuid)
TTL day + INTERVAL 2 YEAR DELETE;

CREATE TABLE IF NOT EXISTS telemetry_observations
(
    `submission_id`             UUID,
    `received_at`               DateTime('UTC'),
    `day`                       Date MATERIALIZED toDate(received_at),
    `country`                   LowCardinality(String),

    `uuid`                      UUID,

    `panel_version`             LowCardinality(String),
    `panel_container_type`      LowCardinality(String),
    `panel_database_version`    LowCardinality(String),
    `panel_cache_version`       LowCardinality(String),
    `panel_architecture`        LowCardinality(String),
    `panel_kernel_version`      String CODEC(ZSTD(3)),

    `users_total`               UInt64,
    `users_languages`           Map(LowCardinality(String), UInt64),
    `backups_total`             UInt64,
    `backups_disks`             Map(LowCardinality(String), UInt64),
    `servers_total`             UInt64,

    `nodes.version`                     Array(LowCardinality(String)),
    `nodes.container_type`              Array(LowCardinality(String)),
    `nodes.architecture`                Array(LowCardinality(String)),
    `nodes.kernel_version`              Array(String),
    `nodes.memory_total_bytes`          Array(UInt64),
    `nodes.memory_free_bytes`           Array(UInt64),
    `nodes.memory_used_bytes`           Array(UInt64),
    `nodes.memory_used_bytes_process`   Array(UInt64),
    `nodes.servers_total`               Array(UInt64),
    `nodes.servers_online`              Array(UInt64),
    `nodes.servers_offline`             Array(UInt64),

    `database_agent_hosts.version`                   Array(LowCardinality(String)),
    `database_agent_hosts.container_type`            Array(LowCardinality(String)),
    `database_agent_hosts.architecture`              Array(LowCardinality(String)),
    `database_agent_hosts.kernel_version`            Array(String),
    `database_agent_hosts.memory_total_bytes`        Array(UInt64),
    `database_agent_hosts.memory_free_bytes`         Array(UInt64),
    `database_agent_hosts.memory_used_bytes`         Array(UInt64),
    `database_agent_hosts.memory_used_bytes_process` Array(UInt64),
    `database_agent_hosts.instances_total`           Array(UInt64),
    `database_agent_hosts.instances_online`          Array(UInt64),
    `database_agent_hosts.instances_offline`         Array(UInt64),

    `extensions.package_name`      Array(LowCardinality(String)),
    `extensions.name`              Array(String),
    `extensions.description`       Array(String),
    `extensions.version`           Array(LowCardinality(String)),
    `extensions.panel_version_req` Array(LowCardinality(String)),
    `extensions.authors`           Array(Array(String)),
    `extensions.has_license`       Array(UInt8),

    `node_count`               UInt32 MATERIALIZED length(`nodes.version`),
    `database_agent_host_count` UInt32 MATERIALIZED length(`database_agent_hosts.version`),
    `extension_count`          UInt32 MATERIALIZED length(`extensions.package_name`)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(day)
ORDER BY (uuid, received_at, submission_id)
TTL day + INTERVAL 2 YEAR DELETE;

CREATE TABLE IF NOT EXISTS telemetry_moderation
(
    uuid UUID,
    submission_id UUID,
    event_id UUID,
    recorded_at UInt64,
    action Enum8('quarantine' = 1, 'approve' = 2, 'reset' = 3),
    reason String
)
ENGINE = MergeTree()
ORDER BY (uuid, submission_id, recorded_at, event_id);

CREATE TABLE IF NOT EXISTS telemetry_decisions
(
    uuid UUID,
    generation UUID,
    generated_at DateTime('UTC') DEFAULT now(),
    submission_id UUID,
    received_at DateTime('UTC'),
    accepted UInt8,
    eligible UInt8,
    reason LowCardinality(String)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(received_at)
ORDER BY (uuid, generation, received_at, submission_id)
TTL received_at + INTERVAL 2 YEAR DELETE;

CREATE TABLE IF NOT EXISTS telemetry_accepted_history
(
    uuid UUID,
    generation UUID,
    generated_at DateTime('UTC') DEFAULT now(),
    submission_id UUID,
    received_at DateTime('UTC'),
    day Date MATERIALIZED toDate(received_at),
    users_total UInt64,
    servers_total UInt64,
    backups_total UInt64,
    node_count UInt32,
    database_agent_host_count UInt32,
    node_memory_bytes UInt64,
    servers_online UInt64
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(day)
ORDER BY (uuid, generation, received_at, submission_id)
TTL received_at + INTERVAL 2 YEAR DELETE;

CREATE TABLE IF NOT EXISTS telemetry_reputation
(
    uuid UUID,
    generation UUID,
    started_at UInt64,
    policy_version UInt32,
    source_count UInt64,
    source_fingerprint String,
    moderation_revision String,
    accepted_days UInt32,
    first_accepted_at UInt32,
    last_accepted_at UInt32,
    tier Enum8('new' = 1, 'probation' = 2, 'established' = 3)
)
ENGINE = MergeTree()
ORDER BY (uuid, started_at, generation);
