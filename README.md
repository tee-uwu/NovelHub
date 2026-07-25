# 📚 NovelHub

NovelHub is a modern, collaborative platform for writers, readers, editors, and illustrators to come together and bring stories to life. Discover trending novels, find collaborators for your next masterpiece, or immerse yourself in a vibrant community of literature enthusiasts.

![NovelHub Preview](https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1200&auto=format&fit=crop)

## ✨ Features

- **📖 Immersive Reading Experience**: Read novels with a beautiful, customizable reader interface.
- **🤝 Collaborative Writing**: Post ads for editors or illustrators and collaborate with others on your novels.
- **🏆 Trending & Editors Choice**: Discover the hottest novels and editor-curated picks.
- **💬 Community & Social**: Join genre-specific communities, discuss chapters, leave reviews, and chat with fellow readers.
- **🛡️ Robust Moderation**: Admin dashboard to review pending novels, handle reports, and manage verified authors.
- **🎨 Modern Design**: Built with a stunning, responsive, and dynamic UI for a premium aesthetic.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Routing**: TanStack Router
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend & Auth**: Supabase (PostgreSQL, Row Level Security)
- **State Management**: TanStack Query (React Query)

## 🚀 Getting Started

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

3. **Set up environment variables:**
   Copy the `.env.example` file to `.env` and fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
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

## 🌟 Acknowledgements

- [Supabase](https://supabase.com)
- [TanStack Router](https://tanstack.com/router/latest)
- [shadcn/ui](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/)
