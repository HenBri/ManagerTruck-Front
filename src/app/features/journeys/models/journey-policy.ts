export function journeyTargets(
  state: unknown,
  canAdminister: boolean,
  executionType: unknown,
): string[] {
  const targets =
    state === 'PLANNED'
      ? ['IN_PROGRESS', 'CANCELLED']
      : state === 'IN_PROGRESS'
        ? ['COMPLETED', 'CANCELLED']
        : [];
  if (canAdminister) return targets;
  return executionType === 'PARTNER' ? targets.filter((target) => target !== 'CANCELLED') : [];
}

export function journeyStep(key: string): number {
  return [
    'containerId',
    'journeyOrigin',
    'journeyDestination',
    'journeyDescription',
    'journeyType',
  ].includes(key)
    ? 0
    : 1;
}
