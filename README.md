# Package Version Comparison Script

This repository contains a Node.js script that compares the dependencies in two `package.json` files. It highlights version mismatches and lists packages that are unique to each project.

## Features

- **Custom Project Names**: Specify names for the projects being compared.
- **Sectioned Output**: Organized output that clearly differentiates between:
  - Packages present in both projects (with version comparisons)
  - Packages only in the first project
  - Packages only in the second project

## Prerequisites

- [Node.js](https://nodejs.org/) installed on your machine.

## Getting Started

1. **Clone the Repository into the same folder as your other repos**

   ```bash
   git clone <your-repo-url>
   cd <your-repo-name>
   ```

   Your repos folder would look like:
   repos

   - scale-respawned
   - respawned-navigation
   - compare-packages
     ....

2. **Update repositories being compared in the script**

   ```javascript
   const package1Name = "scale-respawned";
   const package2Name = "render-scale-hub";
   ```

3. **Run script**

   ```bash
    node compare-packages.js
   ```

   You can view the generated markdown in "comparison-results.md"
