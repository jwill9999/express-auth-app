export const hasValidEmailFormat = (email: string): boolean => {
  const atIndex = email.indexOf('@');
  const domainPart = atIndex >= 0 ? email.slice(atIndex + 1) : '';
  const hasSingleAt = atIndex > 0 && atIndex === email.lastIndexOf('@');
  const hasValidDomain =
    domainPart.length > 2 && domainPart.includes('.') && !domainPart.endsWith('.');

  return hasSingleAt && hasValidDomain;
};
