INSERT INTO telemetry_observations
SELECT * EXCEPT (day, node_count, database_agent_host_count, extension_count)
FROM telemetry_submissions
WHERE submission_id NOT IN (SELECT submission_id FROM telemetry_observations);
