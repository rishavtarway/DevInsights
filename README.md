# DevInsights - Developer Productivity Analytics Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.0.0-black?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3.0-blue?logo=supabase)](https://supabase.com)

![Dashboard Preview](./screenshots/Screenshot%202025-05-16%20at%202.23.13 PM.png)

## 🚀 Features
- **Repository Analytics**: Track commits, PRs, and code review metrics
- **AI-Powered Insights**: Get automated recommendations (beta)
- **Team Collaboration**: Shared dashboards with role-based access
- **GitHub Integration**: Connect repos in 1 click

## 💻 Tech Stack
| Component          | Technology                          |
|---------------------|-------------------------------------|
| Frontend            | Next.js 14, TypeScript, Tailwind CSS|
| Backend             | Supabase (PostgreSQL, Auth, RLS)    |
| AI                  | OpenAI API (Future)                 |
| Deployment          | Vercel                              |
| Tools               | V0, Shadcn UI, React-Query          |

## 🔍 Why DevInsights?
- **For Developers**: Identify personal productivity trends
- **For Teams**: Spot bottlenecks in code review cycles
- **For Managers**: Data-driven sprint planning

## 🛠️ Local Setup

git clone https://github.com/rishavtarway/devinsights.git
cd devinsights
npm install
cp .env.example .env.local # Add Supabase keys
npm run dev


## 📈 Future Roadmap
- [ ] AI-driven anomaly detection
- [ ] Slack/Teams integration
- [ ] Custom metric builder

## 🙋 FAQ
**Q: How is data secured?**  
A: Supabase RLS ensures users only access their org's data.

**Q: Can I self-host?**  
A: Yes! Docker setup coming soon.

---

## 📸 Screenshots
| Sign-In            | Dashboard          |
|---------------------|--------------------|
| ![Sign-In](./screenshots/Screenshot%202025-05-16%20at%202.26.12 PM.png) | ![Dashboard](./screenshots/Screenshot%202025-05-16%20at%202.27.38 PM.png) |


