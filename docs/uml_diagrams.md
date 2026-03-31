# UML Diagrams

*Finance Ledger - Smart Financial Tracking & Analytics Tool*

## Purpose

This document collects the key UML and process diagrams used to describe Finance Ledger behavior, structure, and interaction patterns.

## Diagram Coverage

The documentation includes:
- use case diagram
- class diagram
- sequence diagrams
- activity diagrams
- component diagram

## Use Case Diagram

**Purpose:** Show the major user interactions with the system.

![Use Case Diagram](images/use%20case.png)

## Class Diagram

**Purpose:** Show the core entities and their relationships.

![Class Diagram](images/Class%20Diagram.png)

### Mermaid Reference

```mermaid
classDiagram
    class User {
        +UUID id
        +String name
        +String email
        +String phoneNumber
        +String passwordHash
    }

    class Category {
        +UUID id
        +UUID userId
        +String name
        +String type
        +Boolean isDefault
    }

    class Transaction {
        +UUID id
        +UUID userId
        +UUID categoryId
        +Decimal amount
        +String type
        +String account
        +String description
        +Date transactionDate
        +String source
        +String rawInput
        +UUID importRecordId
    }

    class ImportRecord
    class ExportRecord
    class ChatbotIdentity

    User "1" --> "0..*" Category : owns
    User "1" --> "0..*" Transaction : records
    User "1" --> "0..*" ImportRecord : performs
    User "1" --> "0..*" ExportRecord : performs
    User "1" --> "0..*" ChatbotIdentity : links
    Category "1" --> "0..*" Transaction : classifies
    ImportRecord "1" --> "0..*" Transaction : creates
```

## Sequence Diagrams

### Add Transaction via Mobile App

**Purpose:** Show how a manual transaction is created from the app.

![Sequence Diagram - Add Transaction via Mobile](images/Sequence%20Diagram%20%20%20-%20Add%20Transaction%20via%20Mobile%20App.png)

### Add Transaction via WhatsApp Chatbot

**Purpose:** Show how a chatbot message becomes a stored transaction.

![Sequence Diagram - Add Transaction WhatsApp](images/Sequence%20Diagram%20-%20Add%20Transaction%20WhatsApp%20Chatbot.png)

### View Dashboard Summary

**Purpose:** Show how dashboard metrics are generated.

![Sequence Diagram - View Dashboard](images/Sequence%20Diagram%20-%20View%20Dashboard.png)

### Import Data

**Purpose:** Show the file import flow.

![Sequence Diagram - Import](images/Sequence%20Diagram%20-%20Import.png)

### Export Data

**Purpose:** Show the export flow.

![Sequence Diagram - Export](images/Sequence%20Diagram%20-%20Export.png)

## Activity Diagrams

### Manual Entry Activity

**Purpose:** Show the user flow for manual app-based entry.

![Activity Diagram - Manual Entry](images/Activity%20Diagram%20-%20Manual%20Entry.png)

### Chatbot Entry Activity

**Purpose:** Show the conversational entry path for chat logging.

![Activity Diagram - Chatbot Entry](images/Activity%20Diagram%20-%20Chatbot%20Entry.png)

### Import Activity

**Purpose:** Show the validation and processing flow for imported files.

![Activity Diagram - Import](images/Activity%20Diagrem%20-%20Import.png)

## Component Diagram

**Purpose:** Show how client, backend, and data components connect.

![Component Diagram](images/Component%20Diagram.png)

## Notes

- The diagrams focus on the MVP and near-MVP scope.
- The mobile app, chatbot, backend, analytics, and import/export flows all share the same backend core.
- The class and relationship model aligns with the ERD and database schema documentation.
