# 🖋️ ePramana (प्रमाणार्थ): The Analytics of Your Wealth

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-22B5BF?style=for-the-badge&logo=recharts&logoColor=white)
![Make_in_India](https://img.shields.io/badge/Make_in_India-FF9933?style=for-the-badge)

**ePramana** is a highly secure, modern personal finance application built with React and Supabase. Moving beyond generic expense tracking, it integrates an Enterprise Zero-Trust Security Architecture and features a unique सनातन (Vedic View) engine.

## 🏗️ System Architecture

### Frontend–Backend Data Flow

```mermaid
sequenceDiagram
    participant User as Client (React)
    participant Auth as Supabase Auth (GoTrue)
    participant API as PostgREST API
    participant RLS as Postgres RLS Gateway
    participant DB as Relational Database

    User->>Auth: 1. Submits credentials (Login/Register)
    Auth-->>User: 2. Issues secure JWT (Contains Auth UID)
    User->>API: 3. Requests /expenses with JWT attached
    API->>RLS: 4. Parses token to verify identity
    RLS->>DB: 5. Executes condition: auth.uid() == user_id
    DB-->>RLS: 6. Extracts isolated user data
    RLS-->>User: 7. Returns secure JSON payload
    User->>User: 8. Renders Data in Vedic Chakra UI
```

### Entity–Relationship Schema

```mermaid
erDiagram
    auth_users ||--o| profiles : "id (PK/FK)"
    auth_users ||--o{ expenses : "user_id (FK)"
    auth_users ||--o{ category_limits : "user_id (FK)"
    auth_users ||--o{ deletion_requests : "user_id (FK)"

    auth_users {
        uuid id PK "System Generated"
        varchar email
    }

    profiles {
        uuid id PK, FK "References auth.users.id"
        text full_name
        timestamptz created_at
        numeric monthly_income
        numeric budget_limit
    }

    expenses {
        uuid id PK
        uuid user_id FK "References auth.users.id"
        text title
        numeric amount
        text category
        date created_at
    }

    category_limits {
        uuid id PK
        uuid user_id FK "References auth.users.id"
        text category
        numeric amount
        timestamptz created_at
    }

    deletion_requests {
        uuid id PK
        uuid user_id FK "References auth.users.id"
        text status
        timestamptz requested_at
    }
```