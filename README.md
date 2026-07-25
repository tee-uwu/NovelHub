#  NovelHub

NovelHub is a modern, collaborative platform for writers, readers, editors, and illustrators to come together and bring stories to life. Discover trending novels, find collaborators for your next masterpiece, or immerse yourself in a vibrant community of literature enthusiasts.

![NovelHub Preview](https://res.cloudinary.com/dtz0urit6/image/upload/q_auto:best,f_jpg/cloudinary-tools-uploads/pjco7wo32opu2jgcmi76)

## Features

- **Immersive Reading Experience**: Read novels with a beautiful, customizable reader interface, featuring built-in Text-to-Speech (TTS) and in-line paragraph comments.
- **Collaborative Writing**: Post ads for editors or illustrators and collaborate with others on your novels.
- **AI Brainstorming Assistant**: Authors can use the built-in Gemini-powered AI to overcome writer's block, generate names, or brainstorm plot twists directly in their Workspace.
- **Teehee the Support AI**: A global floating AI assistant powered by Gemini that follows you everywhere to answer your questions and tell dramatic jokes.
- **Gamification & Contests**: Keep readers engaged with daily reading streaks, XP points, and seasonal writing contests.
- **Trending & Editors Choice**: Discover the hottest novels and editor-curated picks.
- **Community & Social**: Join genre-specific communities, discuss chapters, leave reviews, and chat with fellow readers.
- **Robust Moderation**: Admin dashboard to review pending novels, handle reports, and manage verified authors.
- **Modern Design**: Built with a stunning, responsive, and dynamic UI for a premium aesthetic.

##  Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Routing**: TanStack Router
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend & Auth**: Supabase (PostgreSQL, Row Level Security)
- **State Management**: TanStack Query (React Query)

##  Getting Started

### Prerequisites

- Node.js (v18+)
- npm, yarn, or pnpm
- Supabase account (for backend)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/novelhub.git
   cd novelhub
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Set up environment variables:**
   Create a `.env` file and fill in your credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Initialize Supabase Database:**
   Run the SQL migrations provided in `supabase/migrations/` in your Supabase dashboard to set up the schema and RLS policies.

5. **Start the development server:**
   ```bash
   npm run dev
   ```

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

##  Acknowledgements

- [Supabase](https://supabase.com)
- [TanStack Router](https://tanstack.com/router/latest)
- [shadcn/ui](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/)
