# 🖋️ ePramana (प्रमाणार्थ): The Analytics of Your Wealth

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-22B5BF?style=for-the-badge&logo=recharts&logoColor=white)
![Make_in_India](https://img.shields.io/badge/Make_in_India-FF9933?style=for-the-badge)

**ePramana** is a highly secure, modern personal finance application built with React and Supabase. Moving beyond generic expense tracking, it integrates an Enterprise Zero-Trust Security Architecture and features a unique सनातन (Vedic View) engine—mapping modern financial data to the ancient Hindu Lunisolar calendar and Nalanda economic principles.

---

## ✨ Enterprise Core Architecture

### 🕉️ सनातन (Vedic) Analytics Engine
A dedicated architectural view that translates standard Gregorian data into the ancient Indian financial framework:
* **Native Lunisolar Mapping:** Utilizes the browser's native `en-IN-u-ca-indian` API to mathematically convert standard dates into exact Saka/Vikram Samvat calendar months (e.g., Phalguna, Chaitra).
* **Sanskrit Categorization:** Maps modern categories into ancient financial structures (*Aaya*, *Vyaya*, *Sanchaya*).
* **Sacred Geometry Data Viz:** Features a custom-built Recharts Donut graph perfectly framing a pure SVG 24-spoke Ashoka Chakra to represent cyclical expenditure.

### 🛡️ Zero-Trust Security & Routing
* **Protected Routes & Recovery:** Utilizes React Router DOM for strictly protected dashboard access, complete with secure URL-token password recovery flows.
* **Password-Gated Credentials:** A multi-step profile modal that strictly requires the user's current password to generate a 6-digit OTP for email updates.
* **Enterprise Account Deletion:** A legally compliant "Soft Delete" danger zone requiring active consent and password verification. It generates an Admin Review Ticket (`deletion_requests`), preventing accidental data loss or malicious account hijacking.
* **Row Level Security (RLS):** Strict Postgres database policies ensuring data isolation across the multi-tenant architecture. No user can query another's ledger.

---

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

---

## 🛠️ Tech Stack
* **Frontend:** React.js, Tailwind CSS, Lucide React (Icons)
* **Data Visualization:** Recharts
* **Backend as a Service (BaaS):** Supabase (PostgreSQL, GoTrue Auth)
* **Routing:** React Router DOM

---

## 🚀 Getting Started

### Prerequisites
* Node.js installed on your local machine
* A Supabase account and project

### Installation & Setup

**1. Clone the repository:**
```bash
git clone [https://github.com/yourusername/epramana.git](https://github.com/yourusername/epramana.git)
cd epramana
```

**2. Install dependencies:**
```bash
npm install
```

**3. Configure Environment Variables:**
Create a `.env` file in the root directory and add your Supabase credentials:
```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**4. Run the development server:**
```bash
npm start
```

---

## 🗄️ Database Schema Outline
The application relies on a strictly relational Supabase Postgres architecture:
* **`profiles`**: Securely links to `auth.users`, storing display names and global financial parameters.
* **`expenses`**: The core ledger tracking exact amounts, relational categories, and timestamps.
* **`category_limits`**: User-defined financial thresholds for individual spending categories.
* **`deletion_requests`**: An isolated security table acting as a holding area for account termination requests.

---

📄 **License**
This project is licensed under the MIT License - see the LICENSE file for details.