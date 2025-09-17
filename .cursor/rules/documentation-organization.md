---
description: "Documentation organization and maintenance rules"
globs: ["**/*.md", "**/docs/**/*"]
alwaysApply: true
---

# Documentation Organization Rules

## Core Principles

### Single Source of Truth
- **One Setup Guide**: Maintain only one comprehensive setup document
- **Avoid Duplication**: Never create multiple setup guides for the same system
- **Regular Updates**: Keep documentation current with actual implementation

### File Organization
- **All documentation MUST go in `/docs` folder**
- **No documentation files in project root** (except README.md)
- **Use descriptive, consistent naming conventions**

## Documentation Structure

### Required Files
```
docs/
├── setup.md                    # Main setup guide (comprehensive)
├── mvp-requirements.md         # MVP feature requirements
├── admin-features.md           # Admin/demo features
└── troubleshooting.md          # Common issues and solutions
```

### Naming Conventions
- Use kebab-case for all documentation files
- Be descriptive and specific: `production-setup.md` not `setup2.md`
- Include version/scope in name when needed: `mvp-requirements.md`

## Content Guidelines

### Setup Documentation
- **One comprehensive setup guide** covering all systems
- **Environment variables section** with all required variables
- **Step-by-step instructions** with verification steps
- **Troubleshooting section** for common issues
- **Clear prerequisites** and dependencies

### Avoid These Patterns
- ❌ Multiple overlapping setup guides
- ❌ System-specific setup docs (GCS, recommendations, etc.)
- ❌ Root-level documentation files (except README.md)
- ❌ Outdated documentation that contradicts current implementation
- ❌ Documentation without clear purpose or audience

### Documentation Lifecycle
1. **Create**: All new docs go in `/docs` folder
2. **Update**: Keep docs current with code changes
3. **Consolidate**: Merge overlapping documentation
4. **Remove**: Delete outdated or redundant docs

## Implementation Rules

### For New Features
- Document setup requirements in main setup guide
- Add feature-specific details to appropriate existing docs
- Do NOT create new setup guides

### For Changes
- Update the main setup guide immediately
- Remove any conflicting information from other docs
- Ensure consistency across all documentation

### For Cleanup
- Regularly audit documentation for accuracy
- Remove outdated information
- Consolidate duplicate content
- Move root-level docs to `/docs` folder

## Maintenance Schedule
- **With every major feature**: Update setup guide
- **Monthly**: Review all docs for accuracy
- **Before releases**: Verify all setup instructions work

Remember: Documentation should be as simple and maintainable as the code itself.


