# AI-Based Internship Management and Performance Evaluation System

A microservices-based web application for managing internships, daily intern tasks, mentor evaluations, sentiment analysis, and monthly performance reports.

The system provides role-based access for Admin, HR, Mentor, and Intern users.

---

## 📌 Project Overview

The AI-Based Internship Management and Performance Evaluation System is designed to automate the complete internship management process.

The system allows organizations and educational institutions to:

- Manage interns and mentors
- Create and manage internships
- Assign interns to mentors
- Assign and track daily tasks
- Allow interns to submit daily work updates
- Analyze the sentiment of intern updates
- Allow mentors to evaluate interns
- Calculate overall performance scores
- Generate monthly performance reports
- Provide role-based dashboards

The backend follows a **microservices architecture**, where each major functionality is implemented as an independent service with its own PostgreSQL database.

---

## 🎯 Objectives

- Automate internship management.
- Track daily intern activities.
- Monitor task completion.
- Analyze intern feedback using sentiment analysis.
- Evaluate intern performance.
- Generate monthly performance reports.
- Provide secure role-based authentication.
- Separate backend functionality using microservices.
- Maintain independent databases for individual services.

---

## 🏗️ System Architecture

```text
                         ┌───────────────┐
                         │     Users     │
                         │ Admin / HR    │
                         │ Mentor / Intern│
                         └───────┬───────┘
                                 │
                                 ▼
                     ┌──────────────────────┐
                     │ React + Vite Frontend│
                     └──────────┬───────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
          ▼                     ▼                     ▼
   ┌─────────────┐      ┌──────────────┐      ┌─────────────┐
   │ Auth Service│      │ Internship   │      │ Task Service│
   │   :5001     │      │ Service:5002 │      │   :5003     │
   └──────┬──────┘      └──────┬───────┘      └──────┬──────┘
          │                     │                     │
          ▼                     ▼                     ▼
     ┌─────────┐          ┌─────────────┐       ┌─────────┐
     │ auth_db │          │internship_db│       │ task_db │
     └─────────┘          └─────────────┘       └─────────┘

                                │
                                ▼
                       ┌─────────────────┐
                       │ Sentiment       │
                       │ Service :5004   │
                       └────────┬────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ sentiment_db    │
                       └─────────────────┘

                       ┌─────────────────┐
                       │ Evaluation      │
                       │ Service :5005   │
                       └────────┬────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ evaluation_db   │
                       └─────────────────┘

                       ┌─────────────────┐
                       │ Report Service  │
                       │    :5006        │
                       └────────┬────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ report_db       │
                       └─────────────────┘
