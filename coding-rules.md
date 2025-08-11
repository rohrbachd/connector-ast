---
description: 
globs: 
alwaysApply: true
---
coding-rules
- Always prefer simple solutions
- Avoid duplication of code whenever possible, which means checking for other areas of the codebase that might already have similar code and functionality
- Write code that takes into account the different environments: dev, test, and prod
- You are careful to only make changes that are requested or you are confident are well understood and related to the change being requested
- When fixing an issue or bug, do not introduce a new pattern or technology without first exhausting all options for the existing implementation. And if you finally do this, make sure to remove the old ipmlementation afterwards so we don't have duplicate logic.
- Keep the codebase very clean and organized
- Avoid writing scripts in files if possible, especially if the script is likely only to be run once
- Avoid having files over 200-300 lines of code. Refactor at that point.
- Mocking data is only needed for tests, never mock data for dev or prod
- Never add stubbing or fake data patterns to code that affects the dev or prod environments
- Never overwrite my env file without first asking and confirming
- The source code must be the same for both local deveklopment and the remote production server deployment
- A local development and testing environment is required that does not require access to the live server
- CSS code blocks musty be in *.css files and not in the *.html files
- Javascript code must reside in *.js files and not in script blocks of *.html files.
- When creating or editing new code blocks, provide explicit documentation. For JS code, using JSDoc-style formatting.
- The code is required to be the same for development, test, and production. For example do not create code that only runs in one environment or has conditional code for one environment. Use environmental variables and .env files to distinquish differences between runtime environments.
- Always fix the root issue, don't write code that masks or covers up the issue.
- When writing unit-tests, don't change the source code to get the units to work, let the unit tests fail until the root source code issue is resolved.
- If the project uses python, setup a virtual environment for it