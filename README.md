<p align="center"><strong><a href="README.zh-CN.md">中文</a> | English</strong></p>

<h1 align="center"> 道心文案 </h1>

<p align="center"> ⚡ The Ultimate AI-Powered Content Strategy & Documentation Engine for Professional Creators ⚡ </p>

<p align="center">
  <img alt="Build" src="https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge">
  <img alt="Issues" src="https://img.shields.io/badge/Issues-0%20Open-blue?style=for-the-badge">
  <img alt="Contributions" src="https://img.shields.io/badge/Contributions-Welcome-orange?style=for-the-badge">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge">
</p>
<!-- 
  **Note:** These are static placeholder badges. Replace them with your project's actual badges.
  You can generate your own at https://shields.io
-->

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack & Architecture](#-tech-stack--architecture)
- [Project Structure](#-project-structure)
- [Demo & Screenshots](#-demo--screenshots)
- [Getting Started](#-getting-started)
- [Usage](#-usage)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**道心文案** is a high-performance, AI-driven content generation and strategy platform designed to transform the way developers and creators document their work and strategize their content output. By leveraging a sophisticated multi-step generation workflow and a deep knowledge base of industry-specific "tracks," it enables users to move from a raw concept to professional, polished documentation and copy in seconds.

### The Problem
> Creating comprehensive, professional documentation and content strategies is a massive bottleneck for modern creators. Developers often struggle to articulate technical value, while content strategists spend hours manually researching "tracks" like finance, fitness, or technology. This leads to inconsistent messaging, poor engagement, and hundreds of hours lost to repetitive writing tasks.

### The Solution
道心文案 eliminates this friction by providing an intelligent, component-based workspace. It doesn't just "write text"—it analyzes the specific context of a niche (Track), applies proven content strategies, and guides the user through a refined 5-step generation process. Whether you are generating a professional GitHub README or a high-converting content plan for a specific industry, 道心文案 ensures every word is backed by data and strategic patterns.

### Architecture Overview
Built on a cutting-edge **Next.js 15+** and **React 19** foundation, the project utilizes a **Component-based Architecture**. It integrates **Supabase** for robust authentication and data persistence, while the core AI logic is powered by a multi-provider SDK (Anthropic, OpenAI, Google) to ensure the highest quality of semantic analysis and generation.

---

## ✨ Key Features

### 🚀 Multi-Step Guided Generation
Experience a streamlined, wizard-like workflow that removes the "blank page" anxiety. The system guides you through:
- **Step 1: Topic Confirmation** – Validating your core idea.
- **Step 2: Strategy Selection** – Choosing the right psychological or technical angle.
- **Step 3: Topic Selection** – Refining the specific narrative.
- **Step 4: Final Result Generation** – Producing the high-fidelity copy.
- **Step 5: Polish & Confirm** – Fine-tuning the output for perfection.

### 📚 Deep Track Knowledge Base
The platform comes pre-loaded with an extensive library of industry "tracks," allowing the AI to understand the nuances of specific niches:
- **Professional Tracks**: Finance (Licai), Business (Shangye), Career (Zhichang).
- **Lifestyle Tracks**: Food (Meishi), Travel (Lvxing), Parenting (Yuer).
- **Niche Tracks**: Digital (Shuma), Fitness (Jianshen), Psychology (Xinli).
- **Technical Tracks**: Video Production, Content Strategy.

### 📊 Performance Analysis & Insights
Don't just create—optimize. The platform includes dedicated performance tools:
- **Screenshot Analysis**: Parse and analyze visual performance data.
- **Emotion Curve Visualization**: Understand the narrative flow and emotional impact of your content.
- **Performance Badges**: Real-time feedback on the quality and potential reach of generated copy.

### 🧠 Intelligent Workspace
A centralized environment for all your content needs:
- **Interactive Keyboard Interface**: Optimized for fast-paced content creation.
- **Memory System**: The application "remembers" your preferences and past successes to improve future suggestions.
- **Cross-Track Patterns**: Automatically applies successful strategies from one industry to another.

### 🔒 Enterprise-Grade Security & Sync
- **Supabase Integration**: Secure user authentication and real-time database synchronization.
- **State Management**: Powered by Zustand for a snappy, reactive user interface that maintains state across complex workflows.

---

## 🛠️ Tech Stack & Architecture

| Technology | Purpose | Why it was Chosen |
| :--- | :--- | :--- |
| **Next.js 15.2** | Full-stack Framework | Provides Server Components, optimized routing, and superior SEO capabilities. |
| **React 19** | Frontend Library | Leveraging the latest concurrent rendering features for a fluid user experience. |
| **TypeScript** | Type Safety | Ensures codebase maintainability and prevents runtime errors in complex AI flows. |
| **Tailwind CSS 4** | Styling | Utilizes a utility-first approach with the latest v4 features for ultra-fast UI development. |
| **Supabase** | Backend/Auth | Provides a robust PostgreSQL backend and seamless Auth with minimal boilerplate. |
| **AI SDK (Vercel)** | AI Integration | Unified interface for Anthropic, OpenAI, and Google models. |
| **Zustand** | State Management | A lightweight, fast, and scalable alternative to Redux for global app state. |
| **Lucide React** | Iconography | High-quality, consistent SVG icons for a professional UI aesthetic. |

---

## 📁 Project Structure

```
道心文案/
├── 📁 src/                         # Core application source code
│   ├── 📁 app/                     # Next.js App Router (Pages & API)
│   │   ├── 📁 api/                 # Backend API routes for generation & analysis
│   │   ├── 📁 auth/                # Authentication callbacks and logic
│   │   ├── 📁 login/               # User login interface
│   │   ├── 📄 layout.tsx           # Global application shell
│   │   └── 📄 page.tsx             # Application landing/entry point
│   ├── 📁 components/              # Reusable UI architecture
│   │   ├── 📁 generation/          # 5-step generation wizard components
│   │   ├── 📁 knowledge/           # Track-specific knowledge management
│   │   ├── 📁 performance/         # Analysis and metric visualization
│   │   ├── 📁 ui/                  # Base design system (shadcn/ui)
│   │   └── 📁 workspace/           # The primary content creation editor
│   ├── 📁 hooks/                   # Custom React hooks (auth, etc.)
│   ├── 📁 lib/                     # Core business logic & utilities
│   │   ├── 📄 api-guard.ts         # Security middleware for API routes
│   │   ├── 📄 model.ts             # AI model configurations
│   │   └── 📄 prompt.ts            # Highly engineered system prompts
│   ├── 📁 store/                   # Zustand state definitions
│   └── 📁 types/                   # Global TypeScript definitions
├── 📁 supabase/                    # Database migrations and schema
│   └── 📁 migrations/              # SQL evolution files
├── 📁 doc/                         # Comprehensive documentation
│   ├── 📁 knowledge/               # Markdown files for various tracks (Finance, etc.)
│   └── 📄 ARCHITECTURE.md          # Technical design specifications
├── 📁 public/                      # Static assets and icons
├── 📄 next.config.ts               # Next.js configuration
├── 📄 tsconfig.json                # TypeScript configuration
├── 📄 package.json                 # Dependency and script management
└── 📄 middleware.ts                # Server-side request interceptors
```

---

## 📸 Demo & Screenshots

### 🖼️ Screenshots

<img src="https://placehold.co/800x450/2d2d4d/ffffff?text=Workspace+Interface" alt="Workspace Interface" width="100%">
<em><p align="center">The core workspace where AI-driven content generation occurs.</p></em>

<img src="https://placehold.co/800x450/2d2d4d/ffffff?text=Generation+Wizard" alt="Generation Wizard" width="100%">
<em><p align="center">The multi-step wizard guiding users from strategy to final polish.</p></em>

<img src="https://placehold.co/800x450/2d2d4d/ffffff?text=Performance+Analysis" alt="Performance Analysis" width="100%">
<em><p align="center">Visualizing performance metrics and emotion curves for generated content.</p></em>

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js**: v20 or higher
- **npm**: v10 or higher
- **Git**: For version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/daoxin-wenan.git
   cd daoxin-wenan
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Initialize Environment**
   Set up your Supabase project and AI provider keys (OpenAI, Anthropic, or Google) in your environment configuration.

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

5. **Build for Production**
   ```bash
   npm run build
   npm run start
   ```

---

## 🔧 Usage

### Generating Content
1. **Select a Track**: Choose your niche (e.g., "Finance" or "Career") from the Tracks sidebar.
2. **Launch Wizard**: Click on "Generate" to start the 5-step process.
3. **Confirm Topic**: Provide your initial idea and let the AI validate the scope.
4. **Choose Strategy**: Select between different content angles (e.g., "Educational," "Controversial," or "Professional").
5. **Review Result**: The AI generates a draft. Use the "Emotion Curve" to check if the tone matches your goals.
6. **Polish**: Use the final step to refine the language and confirm the output.

### Analyzing Performance
- **Upload Screenshots**: Use the Performance panel to parse screenshots of your published content.
- **Review Insights**: The system will analyze engagement data and provide suggestions for future iterations based on real-world results.

### Managing Knowledge
- Access the **Knowledge** page to browse through pre-configured industry patterns and "seeds" that drive the AI's expert-level understanding of different domains.

---

## 🤝 Contributing

We welcome contributions to improve 道心文案! Your input helps make this project better for creators everywhere.

### How to Contribute

1. **Fork the repository** - Click the 'Fork' button at the top right of this page
2. **Create a feature branch** 
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes** - Improve code, documentation, or features
4. **Test thoroughly** - Ensure all functionality works as expected
   ```bash
   npm run lint
   ```
5. **Commit your changes** - Write clear, descriptive commit messages
   ```bash
   git commit -m 'Add: New performance metric for Track analysis'
   ```
6. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request** - Submit your changes for review

### Development Guidelines
- ✅ Follow the existing code style and conventions (ESLint configured).
- 📝 Add comments for complex generation logic or AI prompts.
- 🧪 Ensure all new components are responsive and accessible.
- 📚 Update documentation in the `/doc` folder for any changed track knowledge.

### Questions?
Feel free to open an issue for any questions or architectural concerns.

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for complete details.

### What this means:
- ✅ **Commercial use**: You can use this project commercially.
- ✅ **Modification**: You can modify the code.
- ✅ **Distribution**: You can distribute this software.
- ✅ **Private use**: You can use this project privately.
- ⚠️ **Liability**: The software is provided "as is", without warranty.
- ⚠️ **Trademark**: This license does not grant trademark rights.

---

<p align="center">Made with ❤️ by the 道心文案 Team</p>
<p align="center">
  <a href="#">⬆️ Back to Top</a>
</p>