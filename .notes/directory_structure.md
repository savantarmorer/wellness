# Directory Structure

## Source Code Organization

### `/src`
Main application source code

#### `/components`
React components
- `DailyAssessment.tsx`: Daily relationship assessment form
- `MoodTracking.tsx`: Mood tracking interface
- `RelationshipAnalysis.tsx`: Analysis visualization
- `RelationshipConsensusForm.tsx`: Partner agreement form
- `Layout.tsx`: Common layout components
- `ErrorBoundary.tsx`: Error handling components

#### `/services`
Business logic and data services
- `relationshipOrchestratorNew.ts`: Central orchestration service
- `analysisService.ts`: Analysis generation
- `dataPersistenceManager.ts`: Data storage management
- `gptService.ts`: GPT integration
- `analysisHistoryService.ts`: Historical data management
- `attachmentService.ts`: Attachment style analysis
- `communicationService.ts`: Communication pattern analysis
- `temporalAnalysisService.ts`: Time-based analysis
- `moodService.ts`: Mood tracking logic
- `relationshipContextService.ts`: Context management

#### `/pages`
Page components
- `Analysis.tsx`: Analysis display page
- `Statistics.tsx`: Data visualization
- `RelationshipContext.tsx`: Context management
- `RelationshipPatterns.tsx`: Pattern visualization
- `Dashboard.tsx`: Main dashboard

#### `/types`
TypeScript type definitions
- `index.ts`: Core type definitions
- `analysis.ts`: Analysis-related types
- `mood.ts`: Mood-related types
- `relationship.ts`: Relationship types
- `assessment.ts`: Assessment types

#### `/utils`
Utility functions
- `dataPersistenceManager.ts`: Data persistence utilities
- `validation.ts`: Data validation
- `formatting.ts`: Data formatting
- `errorHandling.ts`: Error utilities

#### `/contexts`
React contexts
- `AuthContext.tsx`: Authentication context
- `UserContext.tsx`: User data context
- `RelationshipContext.tsx`: Relationship data context

#### `/hooks`
Custom React hooks
- `useAnalysis.ts`: Analysis data hooks
- `useMood.ts`: Mood tracking hooks
- `useRelationship.ts`: Relationship data hooks

### `/public`
Static assets and public files

### `/.notes`
Project documentation
- `project_overview.md`: Project overview
- `directory_structure.md`: This file
- `meeting_notes.md`: Development notes
- `task_list.md`: Current tasks

## Data Structure

### Collections
- `assessments`: Daily relationship assessments
- `moodEntries`: Mood tracking entries
- `consensusForms`: Partner agreement forms
- `relationshipContexts`: Relationship context data
- `users`: User profiles
- `gptAnalysis`: AI-generated analyses

### Key Files
- `package.json`: Dependencies
- `tsconfig.json`: TypeScript configuration
- `firebase.json`: Firebase configuration
- `README.md`: Project readme

## Development Guidelines
- Follow TypeScript strict mode
- Use functional components
- Maintain consistent naming
- Document complex logic
- Handle errors gracefully
- Use proper type definitions
- Keep components focused
- Follow React best practices 