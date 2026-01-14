import { join } from 'path';
import { writeFile } from 'fs/promises';

const aliases: Record<string, string> = {};

(() => {
  try {
    // Dynamically import aliases.json
    const importedAliases = require(join(__dirname, '..', '..', 'aliases.json'));
    Object.assign(aliases, importedAliases);
  } catch (error) {
    writeFile(join(__dirname, '..', '..', 'aliases.json'), JSON.stringify(aliases, null, 2));
  }
})()

export const checkForAlias = (name: string): string => {
  return aliases[name] ?? name;
}

export const addAlias = (oldName: string, newName: string): void => {
  aliases[oldName] = newName;
  writeFile(join(__dirname, '..', '..', 'aliases.json'), JSON.stringify(aliases, null, 2));
}