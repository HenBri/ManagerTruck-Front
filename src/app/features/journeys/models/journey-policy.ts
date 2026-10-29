export function journeyTargets(
  state: unknown,
  canAdminister: boolean,
  assigned: unknown,
): string[] {
  const targets =
    state === 'PENDIENTE'
      ? ['EN_PROCESO', 'CANCELADO']
      : state === 'EN_PROCESO'
        ? ['COMPLETADO', 'CANCELADO']
        : [];
  if (canAdminister) return targets;
  return assigned === true ? targets.filter((target) => target !== 'CANCELADO') : [];
}

export function journeyStep(key: string): number {
  return [
    'freightId',
    'journeyOrigin',
    'journeyDestination',
    'journeyDescription',
    'journeyType',
  ].includes(key)
    ? 0
    : 1;
}
