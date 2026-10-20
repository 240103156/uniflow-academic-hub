# UniFlow Academic Hub

Create a system design interview application. 

Build a modern, fully interactive student academic management web application called UniFlow.
UniFlow is a unified academic dashboard that helps university students manage deadlines, course materials, assignment submissions, and semester workload.
The long-term vision is to connect UniFlow to university learning management systems such as Moodle and Canvas through a browser extension that automatically extracts academic data.
For this first development stage, build the complete frontend with a centralized mock backend service. Do not implement real LMS integrations yet.
1. Product Concept
University students frequently struggle because academic information is scattered across multiple courses, learning platforms, syllabus documents, and assignment pages.
UniFlow solves this problem by bringing everything into one organized dashboard.
The application should feel like a real, polished SaaS product rather than a basic student assignment tracker.
The primary users are university students managing multiple courses during a semester.
The five main features are:
Deadline Extractor
Syllabus Scanner
Lecture Collector
Submission Guardian
Semester Load Balancer
2. Technology Requirements
Use:
React
TypeScript
Tailwind CSS
shadcn/ui
Lucide icons
Recharts for data visualization
A suitable React calendar library
Create a clean, modular, maintainable project structure.
Use reusable components, strongly typed data models, and clear separation between UI and business logic.
The application must be responsive and work on desktop, tablet, and mobile screens.
Prioritize desktop usability.
3. Application Layout
Create a professional SaaS dashboard with a fixed sidebar and a main content area.
Sidebar navigation:
Dashboard
Assignments
Calendar
Courses
Materials
Workload
Settings
At the top of the application, include:
Current page title
Search functionality
Notification icon
User avatar
Light/dark mode toggle
Use a clean visual hierarchy and consistent spacing.
4. Dashboard Page
The dashboard should provide an immediate overview of the student’s academic situation.
Include four summary cards:
Upcoming Deadlines
Pending Assignments
Submitted Assignments
Active Courses
Below the cards, display:
Upcoming Deadlines
A chronological list of upcoming assignments showing:
Assignment title
Course name
Due date
Time remaining
Submission status
Priority indicator
Weekly Workload
An interactive bar chart showing the number of assignments and exams scheduled for each day of the current week.
Submission Alerts
A section highlighting assignments that:
Are overdue
Have not been submitted
Are saved as drafts
Require resubmission
Recent Academic Activity
A feed showing events such as:
New assignment discovered
Deadline changed
New lecture material added
Assignment marked as submitted
5. Deadline Extractor and Assignments Page
Create a complete assignment management interface.
Display assignments in a modern table or list.
Each assignment must include:
Unique ID
Title
Course
Description
Due date and time
Submission status
Priority
Source platform
Original LMS URL
Support:
Search by assignment title
Filter by course
Filter by submission status
Sort by deadline
Sort by priority
Add assignment manually
Edit assignment
Delete manually created assignment
View assignment details
Provide clear visual indicators for overdue and upcoming assignments.
Include a “Sync with LMS” button.
For now, this button should call the mock synchronization service and simulate discovering assignments or updating deadlines.
Clearly label this as a demo synchronization. Do not claim a real university platform is connected.
6. Syllabus Scanner
Create a syllabus management interface.
Allow users to:
Select a course
Upload a PDF syllabus
View extracted academic events
Review detected deadlines
Confirm or reject extracted items
Add confirmed items to the calendar
For this stage, use mock extraction results.
The interface should simulate realistic syllabus processing.
Example extracted events:
Midterm Exam — November 5
Assignment 3 — November 12
Final Project — December 3
Final Exam — December 15
Include:
Upload area
Processing state
Extracted events table
Confirmation controls
Success and error states
Do not pretend the application has actually parsed a PDF when using mock results.
Design the architecture so real PDF processing can replace the mock implementation later.
7. Lecture Collector and Materials Page
Create a centralized academic materials library.
Materials should be organized by course.
Support:
Course filtering
Search by file name
File type filtering
Sorting by upload date
File cards or table view
File type icons
Individual download actions
Multiple file selection
Batch download interface
Each material should contain:
ID
File name
Course ID
File type
File size
Upload date
Topic or week
Source URL
Use realistic mock material metadata.
Example:
Machine Learning:
Lecture 01 — Introduction.pdf
Lecture 02 — Linear Regression.pdf
Lecture 03 — Classification.pptx
Database Systems:
Week 1 — SQL Basics.pdf
Week 2 — Normalization.pdf
Download actions must not generate fake files or silently pretend to succeed.
For demo mode, provide clearly labeled sample files when actual downloadable assets are available, or explain that downloads require real LMS integration.
8. Submission Guardian
Create a submission monitoring interface.
Every assignment should have one of these statuses:
Submitted
Not Submitted
Draft
Requires Resubmission
Overdue
Unknown
Use consistent status badges.
Create an “Assignments Requiring Attention” section.
Include warning cards for assignments that need action.
Examples:
“Database Assignment 2 is still a draft.”
“Machine Learning Project has not been submitted.”
“Software Engineering Report requires resubmission.”
Allow users to open assignment details and navigate to the original LMS URL when available.
For demo purposes, submission statuses come from the mock service.
The frontend must not claim that an assignment was successfully submitted to Moodle or Canvas.
9. Semester Load Balancer
Create an interactive workload analytics page.
Include:
Weekly Workload Chart
Show assignments, quizzes, and exams per week.
Workload Heatmap
Display a calendar heatmap highlighting busy and relatively free days.
Course Distribution
Show which courses contribute most to the student’s workload.
Busy Weeks
Automatically identify weeks containing unusually many deadlines.
Estimated Study Time
Allow students to manually assign estimated hours to tasks.
Calculate the total estimated workload per week.
Provide interactive filters for:
Course
Date range
Assignment type
Charts should update when the underlying mock data changes.
Do not invent study time estimates. Use user-entered values or clearly labeled sample estimates.
10. Calendar Page
Create a full academic calendar.
Support:
Month view
Week view
Today navigation
Course-based colors
Assignment indicators
Exam indicators
Event details on click
Allow users to create personal academic events.
Assignments should automatically appear in the calendar using the shared application data.
Changes made on the Assignments page must be reflected in the Calendar and Workload pages.
11. Courses Page
Display a list or grid of enrolled courses.
Each course card should contain:
Course name
Course code
Instructor
Number of assignments
Upcoming deadlines
Course color
Clicking a course should open its detail page.
Course detail page:
Course overview
Assignments
Lecture materials
Upcoming exams
Submission statuses
Use realistic sample courses:
Machine Learning
Database Systems
Software Engineering
Project Management
Human-Computer Interaction
12. Design System
Create a premium, minimalistic SaaS interface inspired by:
Linear
Notion
Vercel Dashboard
Raycast
Use:
Clean typography
Subtle borders
Rounded cards
Soft shadows
Generous whitespace
Consistent spacing
Clear information hierarchy
Professional data tables
Minimal animations
Modern charts
Attractive empty states
Use a neutral color palette with a restrained indigo or blue accent.
Provide both light and dark themes.
Avoid excessive gradients, glassmorphism, unnecessary illustrations, and generic AI-generated dashboard aesthetics.
Make the interface visually cohesive and polished.
13. Mock Backend Architecture — CRITICAL
Centralize every backend operation in a dedicated services layer.
Do not place hardcoded mock data directly inside React components.
Create a typed service interface such as:
AcademicService
With methods similar to:
getDashboardSummary()
getCourses()
getCourseById(id)
getAssignments()
getAssignmentById(id)
createAssignment(data)
updateAssignment(id, data)
deleteAssignment(id)
getMaterials()
getAcademicEvents()
getSubmissionAlerts()
getWorkloadAnalytics()
syncLMS()
scanSyllabus(file, courseId)
Implement a MockAcademicService that fulfills this interface.
All pages and components must interact with this service layer.
The mock service should simulate asynchronous requests and realistic loading states.
Use a shared client-side data store so changes propagate across pages.
Persist user-created and edited demo data using localStorage or IndexedDB.
Ensure date calculations, filters, charts, and summary cards use consistent underlying data.
Do not create disconnected hardcoded datasets for different pages.
The architecture must allow replacing MockAcademicService with a real API service later without rewriting the UI.
Do not create a real backend at this stage.
Do not connect Supabase or another cloud database.
Do not implement authentication yet.
14. TypeScript Data Models
Define clear interfaces for:
Course:
id
name
code
instructor
color
Assignment:
id
courseId
title
description
dueDate
status
priority
type
estimatedHours
source
sourceUrl
Material:
id
courseId
name
type
size
uploadedAt
topic
sourceUrl
AcademicEvent:
id
courseId
title
type
date
source
SubmissionAlert:
id
assignmentId
type
message
severity
SyncRecord:
id
timestamp
status
itemsDiscovered
itemsUpdated
Extend these models when necessary.
Use consistent identifiers and date handling.
15. Demo Data
Populate the mock service with realistic academic data.
Include:
5 university courses
20–30 assignments
Different submission statuses
Multiple upcoming deadlines
Several overdue assignments
25–40 lecture materials
Exams and quizzes
Sample synchronization history
Different weekly workload levels
Make the sample data coherent.
Assignments, calendar events, course statistics, submission alerts, and workload charts must all be derived from the same underlying records.
Show a visible “Demo Mode” indicator.
16. User Interactions
The application must be interactive, not a static design mockup.
Implement working:
Navigation
Search
Filters
Sorting
Dialogs
Forms
Assignment creation
Assignment editing
Calendar navigation
Course detail pages
Theme switching
Workload calculations
Demo synchronization
Notifications or toast messages
Use loading, empty, and error states where appropriate.
Do not add buttons that appear functional but do nothing.
17. Testing
Add meaningful tests.
Prioritize:
Assignment filtering
Deadline sorting
Overdue detection
Weekly workload calculation
Course-based aggregation
Mock service behavior
Data persistence
Keep the tests lightweight and maintainable.
18. Scope Limitations
This is the frontend-first stage of a specification-driven development workflow.
Do not implement:
Real Moodle integration
Real Canvas integration
Chrome extension
Real backend
Database server
Authentication
Payment functionality
Paid AI APIs
These will be considered in later development stages.
However, structure the application so a browser extension and real backend can be integrated later.
19. Final Requirements
Build the complete frontend application with all seven navigation sections.
Make the interface polished, responsive, and fully interactive.
Centralize every backend call in one services layer, and create a mock implementation of it so the whole app runs without a real backend.
Add tests.
Use realistic sample data.
Ensure the application can be exported to GitHub and continued locally with another AI coding assistant.
 The final result should feel like a functional university productivity SaaS application, not a collection of disconnected UI mockups.

Centralize every backend call in one services layer, and create a mock
implementation of it so the whole app runs without a real backend.

Add tests.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3af68aa8-2344-5470-abeb-fd1f02e9d06c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
