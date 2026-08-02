export function netBenefit(controlNs, candidateNs, allocGcNs, startupNs, migrationNs) {
    return controlNs - candidateNs - allocGcNs - startupNs - migrationNs;
}
