#!/usr/bin/env node
const fs = require('fs');

// Get repository names from command line arguments
const [repo1Name, repo2Name] = process.argv.slice(2);

// Check if both repository names are provided
if (!repo1Name || !repo2Name) {
    console.error('Please provide two repository names as arguments.');
    console.log('Usage: node compare-packages.js <repo1name> <repo2name>');
    process.exit(1);
}

// Load the two package.json files
const package1 = JSON.parse(fs.readFileSync(`../${repo1Name}/package.json`, 'utf8'));
const package2 = JSON.parse(fs.readFileSync(`../${repo2Name}/package.json`, 'utf8'));

const deps1 = package1.dependencies || {};
const deps2 = package2.dependencies || {};

// Calculate totals
const totalPackages1 = Object.keys(deps1).length;
const totalPackages2 = Object.keys(deps2).length;

let bothCount = 0;
let uniqueTo1Count = 0;
let uniqueTo2Count = 0;
let matchesCount = 0;
let mismatchesCount = 0;
const majorVersionDifferences = [];

// Function to normalize version strings
const normalizeVersion = (version) => version.replace(/[^0-9.]/g, '');

// Function to check if two versions are compatible based on their prefix
const areVersionsCompatible = (version1, version2) => {
  // Check for exact match first
  if (normalizeVersion(version1) === normalizeVersion(version2)) {
    return true; // Exact match
  }

  const major1 = parseInt(normalizeVersion(version1).split('.')[0]);
  const major2 = parseInt(normalizeVersion(version2).split('.')[0]);

  // Check if major versions are the same
  if (major1 !== major2) return false;

  const minor1 = parseInt(normalizeVersion(version1).split('.')[1] || 0);
  const minor2 = parseInt(normalizeVersion(version2).split('.')[1] || 0);
  const patch1 = parseInt(normalizeVersion(version1).split('.')[2] || 0);
  const patch2 = parseInt(normalizeVersion(version2).split('.')[2] || 0);

  // Handle tilde (~) and caret (^) versions
  const isVersion1Tilde = version1.startsWith('~');
  const isVersion2Tilde = version2.startsWith('~');
  const isVersion1Caret = version1.startsWith('^');
  const isVersion2Caret = version2.startsWith('^');

  // Check compatibility based on the version type
  if (isVersion1Tilde && isVersion2Tilde) {
    return minor1 === minor2 && patch1 >= patch2; // Same minor version, patch can vary
  }
  if (isVersion1Caret && isVersion2Caret) {
    return major1 === major2 && minor1 === minor2 && patch1 === patch2; // Exact match required
  }
  if (isVersion1Tilde && isVersion2Caret) {
    return major1 === major2 && minor1 === minor2 && patch1 >= patch2; // Tilde can match caret
  }
  if (isVersion1Caret && isVersion2Tilde) {
    return major1 === major2 && minor1 === minor2 && patch2 >= patch1; // Caret can match tilde
  }

  // Fallback to strict equality check
  return version1 === version2;
};

// Prepare the Markdown output
let output = `# Package Version Comparison between ${repo1Name} and ${repo2Name}\n\n`;

// Summary section
output += `## Summary\n`;
output += `- Total packages in **${repo1Name}**: ${totalPackages1}\n`;
output += `- Total packages in **${repo2Name}**: ${totalPackages2}\n`;

// Section for packages that exist in both package.json files
output += `## Packages present in both ${repo1Name} and ${repo2Name} (Total: `;
Object.keys(deps1).forEach((dep) => {
  if (deps2[dep]) {
    bothCount++;
  }
});
output += `${bothCount})\n\n`;

// Matches subsection
output += `### Matches (Total: `;
Object.keys(deps1).forEach((dep) => {
  if (deps2[dep]) {
    const version1 = deps1[dep];
    const version2 = deps2[dep];

    if (areVersionsCompatible(version1, version2)) {
      matchesCount++;
    }
  }
});
output += `${matchesCount})\n\n`;

Object.keys(deps1).forEach((dep) => {
  if (deps2[dep]) {
    const version1 = deps1[dep];
    const version2 = deps2[dep];

    if (areVersionsCompatible(version1, version2)) {
      output += `- **${dep}** - Version match: \`${version1}\`\n`;
    }
  }
});

// Mismatches subsection
output += `### Mismatches (Total: `;
Object.keys(deps1).forEach((dep) => {
  if (deps2[dep]) {
    const version1 = deps1[dep];
    const version2 = deps2[dep];

    if (!areVersionsCompatible(version1, version2)) {
      mismatchesCount++;
    }
  }
});
output += `${mismatchesCount})\n\n`;

Object.keys(deps1).forEach((dep) => {
  if (deps2[dep]) {
    const version1 = deps1[dep];
    const version2 = deps2[dep];

    if (!areVersionsCompatible(version1, version2)) {
      output += `- **${dep}** - Version mismatch:\n`;
      output += `  - ${repo1Name}: \`${version1}\`\n`;
      output += `  - ${repo2Name}: \`${version2}\`\n`;

      // Check for major version difference
      const majorVersion1 = normalizeVersion(version1).split('.')[0];
      const majorVersion2 = normalizeVersion(version2).split('.')[0];
      if (majorVersion1 !== majorVersion2) {
        majorVersionDifferences.push({
          package: dep,
          version1,
          version2,
        });
      }
    }
  }
});

// Section for packages only in package1.json
output += `\n## Packages present only in ${repo1Name} (Total: `;
Object.keys(deps1).forEach((dep) => {
  if (!deps2[dep]) {
    uniqueTo1Count++;
  }
});
output += `${uniqueTo1Count})\n\n`;

Object.keys(deps1).forEach((dep) => {
  if (!deps2[dep]) {
    output += `- **${dep}**: \`${deps1[dep]}\`\n`;
  }
});

// Section for packages only in package2.json
output += `\n## Packages present only in ${repo2Name} (Total: `;
Object.keys(deps2).forEach((dep) => {
  if (!deps1[dep]) {
    uniqueTo2Count++;
  }
});
output += `${uniqueTo2Count})\n\n`;

Object.keys(deps2).forEach((dep) => {
  if (!deps1[dep]) {
    output += `- **${dep}**: \`${deps2[dep]}\`\n`;
  }
});

// Major Version Differences section
output += `\n## Major Version Differences (Total: `;
output += `${majorVersionDifferences.length})\n`;
if (majorVersionDifferences.length > 0) {
  majorVersionDifferences.forEach(diff => {
    output += `- **${diff.package}**: \`${diff.version1}\` (in ${repo1Name}) vs \`${diff.version2}\` (in ${repo2Name})\n`;
  });
} else {
  output += `- No major version differences found.\n`;
}

// Final summary
output += `\n## Final Counts\n`;
output += `- Total packages found in both: ${bothCount}\n`;
output += `- Total packages unique to **${repo1Name}**: ${uniqueTo1Count}\n`;
output += `- Total packages unique to **${repo2Name}**: ${uniqueTo2Count}\n`;
output += `- Total major version differences: ${majorVersionDifferences.length}\n`;

// Write the output to a Markdown file
fs.writeFileSync('comparison-results.md', output, 'utf8');

console.log('Comparison results written to comparison-results.md');
