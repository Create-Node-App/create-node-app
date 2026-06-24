const unquoteSetValue = (value: string): string => {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
};

/**
 * Parse --set key=value assignments into an overrides map.
 * Commander may split values containing spaces into multiple argv tokens;
 * rejoin segments that lack '=' with the previous assignment.
 */
export const parseSetOverrides = (
  set: string[] | undefined,
): Record<string, string> => {
  const setOverrides: Record<string, string> = {};

  if (!Array.isArray(set)) {
    return setOverrides;
  }

  const assignments: string[] = [];
  for (const part of set) {
    if (part.includes("=") || assignments.length === 0) {
      assignments.push(part);
    } else {
      assignments[assignments.length - 1] += ` ${part}`;
    }
  }

  for (const assignment of assignments) {
    const eqIdx = assignment.indexOf("=");
    if (eqIdx > 0) {
      setOverrides[assignment.slice(0, eqIdx).trim()] = unquoteSetValue(
        assignment.slice(eqIdx + 1).trim(),
      );
    }
  }

  return setOverrides;
};
