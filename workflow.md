---
alwaysApply: true
---

# Development Agent Workflow - Cursor Rules (PR Integration)

## Primary Directive
You are a development agent implementing a project. Follow established documentation and
maintain consistency using a full Pull Request workflow for all changes.

## Core Workflow Process

### Before Starting Any Task
- Consult `/Docs/Implementation.md` for current stage and available tasks
- Check task dependencies and prerequisites
- Verify scope understanding
- Ensure main branch is up to date: `git pull origin main`

### Task Execution Protocol

#### 1. Task Assessment
- Read subtask from `/Docs/Implementation.md`
- Assess subtask complexity:
  - **Simple subtask:** Implement directly in feature branch
  - **Complex subtask:** Create a todo list, then implement in feature branch
- Identify TODO ID and stage for branch naming

#### 2. Branch Creation
- **ALWAYS** create a new branch for ANY TODO item or bug fix
- **Branch Naming Convention:**
  ```
  feature/stage#-todo-short-description
  bugfix/bug#-short-description
  hotfix/critical-issue-description
  
  Examples:
  - feature/stage1-react-migration
  - feature/stage2-3d-garden-viz
  - bugfix/bug005-ssl-cert-fix
  ```
- **Commands:**
  ```bash
  git checkout main
  git pull origin main
  git checkout -b feature/stage#-todo-description
  ```

#### 3. Documentation Research
- Check `/Docs/Implementation.md` for relevant documentation links in the subtask
- Read and understand documentation before implementing
- Document any discoveries that affect implementation approach

#### 4. UI/UX Implementation
- Consult `/Docs/UI_UX_doc.md` before implementing any UI/UX elements
- Follow design system specifications and responsive requirements

#### 5. Project Structure Compliance
- Check `/Docs/Project_structure.md` before:
  - Running commands
  - Creating files/folders
  - Making structural changes
  - Adding dependencies

#### 6. Error Handling
- Check `/Docs/Bug_tracking.md` for similar issues before fixing
- Document all errors and solutions in Bug_tracking.md
- Include error details, root cause, and resolution steps

#### 7. Implementation and Testing
- Check `/.cursor/rules/coding-rules.mdc` before writing new code
- Implement the TODO item or fix
- Perform comprehensive testing:
  - Manual functionality testing
  - Integration testing with existing features
  - Browser testing (if UI changes)
  - API endpoint testing (if backend changes)
  - Authentication flow testing (if auth-related)
- Document test results

#### 8. Scene Rendering Verification
- **For changes affecting 3D rendering, UI, or core functionality:**
  - Start development environment: `local-rg && start-rg`
  - Open application: `https://gardendesigner.rationalgardening.com:3000/index.html#scene=demo-world`
  
  - **Pre-Verification Assessment:**
    - **If sub-task expects temporary breakage:**
      - Document "Expected Temporary Regressions" in commit/communication
      - List major features expected to NOT work during this phase
      - Add broken features to Bug_tracking.md with [PLANNED-REGRESSION] tags
      - Set timeline for when features will be restored
    
  - **Verification Process:**
    - **If agent can verify rendering:**
      - Confirm 3D scene loads properly
      - Verify camera controls work (orbit, zoom, pan)
      - Check that core visual elements render correctly
      - **Test expected working features only** (skip known broken ones)
      - Document any unexpected issues vs. planned regressions
    - **If agent cannot verify rendering:**
      - Prompt user with expected working/broken feature list
      - "Please verify the 3D scene renders correctly at [URL]"
      - "Expected working: [list]"
      - "Expected broken (planned): [list]"
      - Wait for user confirmation before proceeding
  
  - **Skip verification if:**
    - Sub-task explicitly expects complete rendering breakage
    - Working on backend-only changes
    - Making documentation-only updates

  - **Post-Verification Documentation:**
    - Update Bug_tracking.md with verification results
    - Mark planned regressions as confirmed/verified
    - Note any unexpected issues discovered

#### 9. Commit Documentation
- Create atomic, well-documented commits during development
- **Commit Message Format:**
  ```
  [TODO-ID] Brief description of specific change
  
  What changed:
  - Specific files/components modified in this commit
  - Key functionality added/removed/modified
  
  Why:
  - Reason for this specific change
  - How it contributes to the overall TODO
  
  Expected Temporary Regressions (if applicable):
  - List major features expected to NOT work temporarily
  - Timeline for restoration (e.g., "Next phase", "Stage 2")
  
  Progress:
  - TODO completion status (partial/complete)
  - Next steps if incomplete
  ```
- Make multiple commits as needed during development
- Push branch regularly: `git push origin branch-name`

#### 10. Pull Request Creation
- **Create PR when TODO is complete and tested**
- **PR Title Format:** `[STAGE#-TODO] Brief description of what TODO accomplishes`
- **Use GitHub PR template** (automatically loaded)
- **Fill out ALL sections** of the PR template comprehensively
- **Link to specific TODO** in Implementation.md
- **Include screenshots/demos** for UI changes
- **Mark as "Ready for Review"**

#### 11. Self-Review Process
- **Review your own PR thoroughly:**
  - Check all template sections are complete
  - Verify code quality and logic
  - Ensure all testing documented
  - Confirm TODO requirements fully met
  - Check for any missed edge cases
- **Request changes from yourself** if issues found
- **Approve only when confident** in quality and completeness

#### 12. PR Merge and Cleanup
- **Merge only after thorough self-review**
- **Merge Strategy:** Squash and merge (clean history)
- **Delete feature branch** immediately after merge
- **Update TODO status** in Implementation.md to completed
- **Update local main:**
  ```bash
  git checkout main
  git pull origin main
  git branch -d feature/branch-name
  ```

#### 13. Post-Merge Verification
- **Verify main branch** works correctly after merge
- **Test critical functionality** to ensure no regressions
- **Update documentation** if any links or references changed
- **Begin next TODO** with new branch creation

### Branch Management Rules

#### When to Create Branches:
- ✅ **ANY TODO item** from Implementation.md
- ✅ **ANY bug fix** from Bug_tracking.md  
- ✅ **ANY new feature** or significant change
- ✅ **Documentation updates** that affect multiple files
- ❌ **NEVER work directly on main** branch

#### Branch Naming Standards:
- **Features:** `feature/stage#-brief-description`
- **Bug Fixes:** `bugfix/bug#-brief-description`
- **Hotfixes:** `hotfix/critical-issue`
- **Documentation:** `docs/specific-doc-update`

#### Branch Lifecycle:
1. Create from updated main
2. Develop and commit regularly
3. Push frequently for backup
4. Create PR when complete
5. Self-review thoroughly
6. Merge after approval
7. Delete immediately after merge
8. Update local main branch

### File Reference Priority
1. `/Docs/Bug_tracking.md` - Check for known issues first
2. `/Docs/Implementation.md` - Main task reference
3. `/Docs/Project_structure.md` - Structure guidance
4. `/Docs/UI_UX_doc.md` - Design requirements

### Planned Regression Management
- **Document planned regressions** in Bug_tracking.md with [PLANNED-REGRESSION] tags
- **Prioritize restoration** based on user impact and development timeline
- **Track restoration progress** in subsequent TODOs and commits
- **Communicate clearly** when features are intentionally broken vs. unexpected bugs

## Critical Rules

### NEVER Rules:
- **NEVER** work directly on main branch
- **NEVER** skip branch creation for any TODO or bug fix
- **NEVER** merge PR without comprehensive self-review
- **NEVER** skip documentation consultation
- **NEVER** mark tasks complete without proper testing
- **NEVER** ignore project structure guidelines
- **NEVER** implement UI without checking UI_UX_doc.md
- **NEVER** fix errors without checking Bug_tracking.md first
- **NEVER** leave feature branches undeleted after merge
- **NEVER** skip PR template completion

### ALWAYS Rules:
- **ALWAYS** create feature branch for ANY change
- **ALWAYS** fill out complete PR template
- **ALWAYS** perform thorough self-review
- **ALWAYS** test comprehensively before PR creation
- **ALWAYS** document errors and solutions
- **ALWAYS** follow established workflow process
- **ALWAYS** push commits to backup work
- **ALWAYS** delete branches after merge
- **ALWAYS** update TODO status after merge
- **ALWAYS** verify main branch after merge

## Emergency Procedures

### Critical Bug Hotfix:
1. Create `hotfix/critical-issue` branch from main
2. Fix issue with minimal scope
3. Test thoroughly
4. Create PR with **HOTFIX** label
5. Expedited self-review (30 minutes minimum)
6. Merge immediately after review
7. Verify fix in production/main

### Rollback Procedure:
1. Identify problematic merge commit
2. Create `hotfix/rollback-issue` branch
3. Revert specific changes (not full merge if possible)
4. Follow normal PR process
5. Document rollback reason in Bug_tracking.md

Remember: Build a cohesive, well-documented, and maintainable project. Every decision
should support overall project goals and maintain consistency with established patterns.
The PR workflow ensures quality, traceability, and professional development practices.