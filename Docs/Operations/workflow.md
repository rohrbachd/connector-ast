---
alwaysApply: true
---

# AI Agent Development Workflow - Lightweight Dataspace Connector

## Primary Directive

You are an AI development agent implementing the Lightweight Dataspace Connector project. Follow the established documentation structure and maintain consistency using a branch-based Pull Request workflow for all changes.

## Documentation Structure Overview

The project documentation is organized in the [`Docs/`](../README.md) folder with the following structure:

- **[`Docs/Implementation/`](../Implementation/README.md)** - Implementation roadmap, stages, features, and coding standards
- **[`Docs/Architecture/`](../Architecture/README.md)** - System design, security, APIs, and database schemas
- **[`Docs/Planning/`](../Planning/README.md)** - PRD, technology stack analysis, and planning documents
- **[`Docs/Operations/`](../Operations/README.md)** - Deployment, DevOps, development environment, and workflows
- **[`Docs/Templates/`](../Templates/README.md)** - Reusable templates and guidelines

## Core Workflow Process

### Before Starting Any Task

1. **Read the Implementation Summary**: Start with [`Docs/Implementation/implementation-summary.md`](../Implementation/implementation-summary.md) to understand the current project state and available tasks
2. **Check Dependencies**: Review [`Docs/Implementation/implementation-stages.md`](../Implementation/implementation-stages.md) for task dependencies and prerequisites
3. **Understand Architecture**: Consult [`Docs/Architecture/system-architecture.md`](../Architecture/system-architecture.md) for system design context
4. **Verify Environment**: Ensure development environment is set up per [`Docs/Operations/development-environment-setup.md`](../Operations/development-environment-setup.md)
5. **Update Main Branch**: `git pull origin main`

### Task Execution Protocol

#### 1. Task Assessment and Planning

- **Read the specific task** from [`Docs/Implementation/implementation-stages.md`](../Implementation/implementation-stages.md)
- **Assess task complexity**:
  - **Simple task:** Implement directly in feature branch
  - **Complex task:** Break down into subtasks, create detailed plan, then implement
- **Identify stage and feature** for proper branch naming
- **Review related documentation**:
  - [`Docs/Implementation/feature-analysis.md`](../Implementation/feature-analysis.md) for feature details
  - [`Docs/Architecture/`](../Architecture/README.md) for relevant architectural components
  - [`Docs/Planning/tech-stack-analysis.md`](../Planning/tech-stack-analysis.md) for technology choices

#### 2. Branch Creation (MANDATORY)

- **ALWAYS** create a new branch for ANY task, feature, or bug fix
- **Branch Naming Convention:**

  ```
  feature/stage#-feature-short-description
  bugfix/issue#-short-description
  hotfix/critical-issue-description
  docs/documentation-update

  Examples:
  - feature/stage1-dsp-protocol-implementation
  - feature/stage2-identity-verification
  - bugfix/issue001-catalog-pagination
  - docs/update-api-specifications
  ```

- **Commands:**
  ```bash
  git checkout main
  git pull origin main
  git checkout -b feature/stage#-feature-description
  ```

#### 3. Documentation Research and Compliance

- **Architecture Review**: Check [`Docs/Architecture/`](../Architecture/README.md) for:
  - [`system-architecture.md`](../Architecture/system-architecture.md) - Overall system design
  - [`security-architecture.md`](../Architecture/security-architecture.md) - Security requirements
  - [`api-specifications.md`](../Architecture/api-specifications.md) - API contracts
  - [`database-schema.md`](../Architecture/database-schema.md) - Data models
- **Implementation Standards**: Follow [`Docs/Implementation/coding-rules.md`](../Implementation/coding-rules.md)
- **Technology Stack**: Adhere to [`Docs/Planning/tech-stack-analysis.md`](../Planning/tech-stack-analysis.md) recommendations

#### 4. Implementation Standards Compliance

- **Coding Standards**: Follow [`Docs/Implementation/coding-rules.md`](../Implementation/coding-rules.md) before writing code
- **Project Structure**: Maintain consistency with [`Docs/Architecture/project-structure.md`](../Architecture/project-structure.md)
- **API Design**: Implement according to [`Docs/Architecture/api-specifications.md`](../Architecture/api-specifications.md)
- **Security Requirements**: Implement per [`Docs/Architecture/security-architecture.md`](../Architecture/security-architecture.md)

#### 5. Development Environment Setup

- **Environment Setup**: Follow [`Docs/Operations/development-environment-setup.md`](../Operations/development-environment-setup.md)
- **Development Commands**: Use the scripts and commands documented in the setup guide
- **Testing Setup**: Configure testing environment as specified

#### 6. Implementation and Testing

- **Implement the feature/task** following established patterns
- **Comprehensive Testing**:
  - Unit tests for individual components
  - Integration tests for component interactions
  - API endpoint testing (if backend changes)
  - End-to-end testing for complete workflows
  - Security testing for authentication/authorization flows
- **Code Quality Checks**:
  - TypeScript type checking
  - ESLint compliance
  - Prettier formatting
  - Test coverage requirements
- **Documentation Updates**: Update relevant documentation if implementation affects:
  - API specifications
  - Architecture decisions
  - Configuration requirements
  - Deployment procedures

#### 7. Verification and Validation

- **Functional Verification**:
  - Start development environment: `pnpm run dev`
  - Test Control Plane endpoints: `http://localhost:3000`
  - Test Data Plane endpoints: `http://localhost:3001`
  - Verify API documentation: `http://localhost:3000/docs`
- **Integration Testing**:
  - Test DSP protocol compliance
  - Verify VC/VP verification flows
  - Test policy enforcement
  - Validate catalog operations
- **Performance Testing**: Run performance tests if applicable
- **Security Testing**: Verify security controls and authentication flows

#### 8. Commit Documentation

- **Create atomic, well-documented commits** during development
- **Commit Message Format:**

  ```
  [STAGE#-FEATURE] Brief description of specific change

  What changed:
  - Specific files/components modified
  - Key functionality added/removed/modified
  - Configuration or schema changes

  Why:
  - Reason for this specific change
  - How it contributes to the overall feature
  - Reference to requirements or architecture decisions

  Testing:
  - Tests added/modified
  - Verification steps performed
  - Performance impact (if applicable)

  Documentation:
  - Documentation files updated
  - API changes documented
  - Breaking changes noted

  Progress:
  - Feature completion status
  - Next steps if incomplete
  - Dependencies resolved/created
  ```

- **Push branch regularly**: `git push origin branch-name`

#### 9. Pull Request Creation

- **Create PR when feature is complete and tested**
- **PR Title Format**: `[STAGE#-FEATURE] Brief description of what feature accomplishes`
- **PR Description Template**:

  ```markdown
  ## Feature Summary

  Brief description of the implemented feature and its purpose.

  ## Implementation Details

  - Key components implemented
  - Architecture decisions made
  - Technology choices and rationale

  ## Testing Performed

  - [ ] Unit tests added/updated
  - [ ] Integration tests verified
  - [ ] API endpoints tested
  - [ ] Security flows validated
  - [ ] Performance impact assessed

  ## Documentation Updates

  - [ ] API specifications updated
  - [ ] Architecture documentation updated
  - [ ] Implementation guide updated
  - [ ] Deployment procedures updated

  ## Breaking Changes

  List any breaking changes and migration steps required.

  ## Related Issues/Features

  Links to related tasks in implementation-stages.md

  ## Screenshots/Demos

  Include screenshots or demo links for UI/API changes.
  ```

- **Link to specific task** in [`implementation-stages.md`](../Implementation/implementation-stages.md)
- **Mark as "Ready for Review"**

#### 10. Self-Review Process

- **Review your own PR thoroughly**:
  - Verify all template sections are complete
  - Check code quality and adherence to standards
  - Ensure comprehensive testing documentation
  - Confirm feature requirements fully met
  - Validate security and performance considerations
  - Check for proper error handling
- **Architecture Compliance Review**:
  - Verify alignment with system architecture
  - Check API specification compliance
  - Validate security architecture adherence
  - Confirm database schema consistency
- **Request changes from yourself** if issues found
- **Approve only when confident** in quality and completeness

#### 11. PR Merge and Cleanup

- **Merge only after thorough self-review**
- **Merge Strategy**: Squash and merge (clean history)
- **Delete feature branch** immediately after merge
- **Update task status** in [`implementation-stages.md`](../Implementation/implementation-stages.md)
- **Update local main**:
  ```bash
  git checkout main
  git pull origin main
  git branch -d feature/branch-name
  ```

#### 12. Post-Merge Verification

- **Verify main branch** works correctly after merge
- **Test critical functionality** to ensure no regressions
- **Update documentation** if any links or references changed
- **Update implementation summary** if major milestone reached
- **Begin next task** with new branch creation

### Branch Management Rules

#### When to Create Branches:

- ✅ **ANY task** from [`implementation-stages.md`](../Implementation/implementation-stages.md)
- ✅ **ANY bug fix** or issue resolution
- ✅ **ANY new feature** or significant change
- ✅ **Documentation updates** that affect multiple files
- ✅ **Architecture changes** or refactoring
- ❌ **NEVER work directly on main** branch

#### Branch Naming Standards:

- **Features**: `feature/stage#-brief-description`
- **Bug Fixes**: `bugfix/issue#-brief-description`
- **Hotfixes**: `hotfix/critical-issue`
- **Documentation**: `docs/specific-doc-update`
- **Architecture**: `arch/architectural-change`

#### Branch Lifecycle:

1. Create from updated main
2. Develop and commit regularly with detailed messages
3. Push frequently for backup
4. Create PR when complete
5. Self-review thoroughly against all standards
6. Merge after approval
7. Delete immediately after merge
8. Update local main branch

### Documentation Reference Priority

When implementing features, consult documentation in this order:

1. **[`Docs/Implementation/implementation-summary.md`](../Implementation/implementation-summary.md)** - Current project state and roadmap
2. **[`Docs/Implementation/implementation-stages.md`](../Implementation/implementation-stages.md)** - Specific task details and dependencies
3. **[`Docs/Architecture/system-architecture.md`](../Architecture/system-architecture.md)** - System design and component interactions
4. **[`Docs/Architecture/security-architecture.md`](../Architecture/security-architecture.md)** - Security requirements and patterns
5. **[`Docs/Implementation/coding-rules.md`](../Implementation/coding-rules.md)** - Code standards and best practices
6. **[`Docs/Planning/tech-stack-analysis.md`](../Planning/tech-stack-analysis.md)** - Technology choices and rationale
7. **[`Docs/Operations/development-environment-setup.md`](../Operations/development-environment-setup.md)** - Environment and tooling

### Feature Implementation Guidelines

#### DSP Protocol Implementation

- Follow [`Docs/Architecture/api-specifications.md`](../Architecture/api-specifications.md) for DSP endpoints
- Implement according to [`Docs/Implementation/feature-analysis.md`](../Implementation/feature-analysis.md) specifications
- Ensure compliance with Dataspace Protocol standards

#### Identity and Trust Features

- Implement VC/VP verification per [`Docs/Architecture/security-architecture.md`](../Architecture/security-architecture.md)
- Follow OID4VP/OID4VCI patterns
- Integrate with wallet/verifier systems as specified

#### Policy Engine Features

- Implement ODRL policy parsing and enforcement
- Follow policy decision point (PDP) architecture
- Ensure obligation execution in data plane

#### Catalog and Semantic Features

- Implement JSON-LD metadata handling
- Support DCAT-AP and NGSI-LD profiles
- Integrate SHACL validation

#### Data Plane Features

- Implement transport adapters per specifications
- Ensure policy enforcement at data plane
- Support multiple transfer modes (pull, push, stream, service)

## Critical Rules

### NEVER Rules:

- **NEVER** work directly on main branch
- **NEVER** skip branch creation for any task or bug fix
- **NEVER** merge PR without comprehensive self-review
- **NEVER** skip documentation consultation
- **NEVER** mark tasks complete without proper testing
- **NEVER** ignore architecture guidelines
- **NEVER** implement features without checking specifications
- **NEVER** skip security considerations
- **NEVER** leave feature branches undeleted after merge
- **NEVER** skip PR template completion

### ALWAYS Rules:

- **ALWAYS** create feature branch for ANY change
- **ALWAYS** consult implementation summary before starting
- **ALWAYS** follow architecture specifications
- **ALWAYS** implement comprehensive testing
- **ALWAYS** document changes thoroughly
- **ALWAYS** perform security validation
- **ALWAYS** follow established coding standards
- **ALWAYS** update relevant documentation
- **ALWAYS** verify integration with existing components
- **ALWAYS** clean up branches after merge

## Emergency Procedures

### Critical Bug Hotfix:

1. Create `hotfix/critical-issue` branch from main
2. Fix issue with minimal scope
3. Test thoroughly against affected components
4. Create PR with **HOTFIX** label
5. Expedited self-review (focus on fix validation)
6. Merge immediately after review
7. Verify fix in development environment
8. Update relevant documentation

### Rollback Procedure:

1. Identify problematic merge commit
2. Create `hotfix/rollback-issue` branch
3. Revert specific changes (prefer targeted fixes over full rollback)
4. Follow normal PR process
5. Document rollback reason and resolution plan
6. Update implementation stages if timeline affected

## Success Metrics

### Code Quality:

- All TypeScript types properly defined
- 100% test coverage for critical paths
- ESLint and Prettier compliance
- Security vulnerabilities addressed

### Architecture Compliance:

- Proper separation of Control Plane and Data Plane
- DSP protocol compliance verified
- Security architecture patterns followed
- API specifications implemented correctly

### Documentation Quality:

- All changes documented in relevant files
- API documentation updated
- Architecture decisions recorded
- Implementation progress tracked

Remember: Build a production-ready, standards-compliant dataspace connector that follows IDSA/Gaia-X principles. Every implementation decision should support the overall goal of creating a lightweight, interoperable, and secure connector for dataspace participation.

The branch-based workflow ensures quality, traceability, and professional development practices while maintaining the high standards required for enterprise dataspace infrastructure.
