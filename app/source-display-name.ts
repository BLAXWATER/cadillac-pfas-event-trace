const finalFileExtension = /(\.(?:pdf|png|jpe?g|docx?|xlsx?|csv|html?|msg))(?=(?:\s*·.*)?$)/i;

export function formatSourceDisplayName(name: string): string {
  const extension = name.match(finalFileExtension);
  const extensionIndex = extension?.index;

  if (extensionIndex === undefined) {
    return name.replace(/\./g, " ").replace(/\s+/g, " ").trim();
  }

  const title = name.slice(0, extensionIndex).replace(/\./g, " ");
  const preservedExtensionAndSuffix = name.slice(extensionIndex);

  return `${title}${preservedExtensionAndSuffix}`.replace(/\s+/g, " ").trim();
}
