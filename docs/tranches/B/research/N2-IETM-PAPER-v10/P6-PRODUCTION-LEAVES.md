# P6 — derived leaves and executable audit shape

Status: **PAPER RED / zero credit**.

All 43 leaf identities derive from exact UTF-8 byte spans in the authenticated validator module. Production and audit share PREDICATES and validateWithDispatch. Audit-only suppression installs an accepting stub; control-of-control installs a sentinel; all 1,806 nonowner rows are iterated and result-checked; six refusal paths are distinct. These sources are materialized but unexecuted.
