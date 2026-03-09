# Dynamic Workflow Management System (Payload CMS)

## Overview

This project implements a **Dynamic Workflow Management System** built on **Payload CMS v3**.
It allows administrators to define **multi-step approval workflows** that can be dynamically attached to any collection (e.g., Blog, Contract, Product, Document).

The system enables users to create documents that automatically pass through configurable workflow stages such as **review, approval, and sign-off**, with full **audit logging and workflow tracking**.

This project was developed as part of the **Backend Developer Hiring Task for WeframeTech**.

---

# Features

### Dynamic Workflow Engine

- Create workflows with **multiple steps**
- Each step can be assigned to a **specific role**
- Steps support **conditional execution**
- Workflow automatically starts when a document is created

### Workflow Step Actions

Users can perform actions such as:

- Approve
- Reject
- Comment

These actions trigger workflow progression.

---

### Audit Trail

All workflow actions are recorded in the **WorkflowLogs collection** including:

- workflow ID
- document ID
- step ID
- user
- action
- timestamp
- comment

Logs are **immutable** and cannot be edited.

---

### Admin Panel Integration

Inside the Payload Admin Panel:

- Users can view workflow status
- See current step
- Execute workflow actions
- View workflow logs

---

### Custom APIs

Two custom APIs are implemented.

#### Trigger Workflow

```
POST /api/workflows/trigger
```

Example request:

```json
{
  "collection": "blog",
  "documentId": "DOCUMENT_ID"
}
```

---

#### Get Workflow Status

```
GET /api/workflows/status/:collection/:docId
```

Example:

```
GET /api/workflows/status/blog/123
```

Example response:

```json
{
  "workflowStatus": "started",
  "currentStep": 2,
  "logs": []
}
```

---

# Tech Stack

- Node.js
- Payload CMS v3
- MongoDB
- TypeScript
- Express (via Payload endpoints)

---

# Project Structure

```
src
│
├ collections
│   ├ Users.ts
│   ├ Blog.ts
│   ├ Contract.ts
│   ├ Workflows.ts
│   └ WorkflowLogs.ts
│
├ services
│   └ workflowServices.ts
│
├ hooks
│   └ triggerWorkflow.ts
│
├ api
│   └ workflows.ts
│
├ components
│   └ WorkflowPanel.tsx
│
├ utils
│   └ conditionEvaluator.ts
│
└ payload.config.ts
```

---

# Workflow Architecture

Workflow execution follows this flow:

```
Document Created
        ↓
Trigger Hook (afterChange)
        ↓
startWorkflow()
        ↓
Assign first step
        ↓
User Action (approve / reject)
        ↓
handleWorkflowAction()
        ↓
moveToNextStep()
        ↓
WorkflowLogs updated
```

---

# Setup Instructions

## 1. Clone the Repository

```
git clone <PRIVATE_REPO_URL>
cd workflow-cms
```

---

## 2. Install Dependencies

```
npm install
```

---

## 3. Start MongoDB

Make sure MongoDB is running locally.

Example connection used in this project:

```
mongodb://127.0.0.1:27017/workflow-cms
```

You can verify the database using **MongoDB Compass**.

---

## 4. Configure Environment Variables

Create a `.env` file if it does not exist:

```
DATABASE_URI=mongodb://127.0.0.1:27017/workflow-cms
PAYLOAD_SECRET=supersecret
```

---

## 5. Start the Development Server

```
npm run dev
```

---

## 6. Access Admin Panel

Open:

```
http://localhost:3000/admin
```

Create your first admin user.

---

# Example Workflow

Example workflow for **Blog collection**:

Step 1
Review – assigned to Reviewer

Step 2
Approval – assigned to Manager

Step 3
Sign Off – assigned to Legal

---

# Example Flow

1. User creates a blog post
2. Workflow automatically starts
3. Reviewer approves
4. Manager approves
5. Legal signs off
6. Workflow marked as completed

---

# Demo Credentials

Example roles that can be created:

Admin
Reviewer
Manager
Legal

---

# Deployment

This project can be deployed using:

- Vercel
- Railway
- Render
- Any Node.js hosting provider

Steps:

1. Set environment variables
2. Configure MongoDB connection
3. Run `npm run build`
4. Start server

---

# Loom Video Walkthrough

The Loom video demonstrates:

- System architecture
- Workflow configuration
- Admin UI workflow execution
- API usage
- Full end-to-end workflow example

---

# Evaluation Criteria Addressed

This implementation focuses on:

- modular architecture
- reusable workflow engine
- dynamic collection support
- role-based workflow steps
- immutable audit logs
- Payload CMS extensibility

---

# Author

Subho Pattanayak
Backend Developer | Full-Stack Engineer

GitHub: https://github.com/DevOP67
LinkedIn: https://linkedin.com/in/subha-pattanayak-8a8165254
