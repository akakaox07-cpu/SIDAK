# 📁 src/ - Source Code Directory

This is the main source code directory following modern React/TypeScript project structure.

## 📂 Folder Overview

```
src/
├── main.tsx              → App entry point
├── App.tsx               → Root component (routing & state)
├── pages/                → Page components (Dashboard, List, Form, Detail)
├── components/
│   ├── layout/          → Layout components (Header, Sidebar)
│   ├── ui/              → UI components (StatCard, Icons, Slider)
│   └── features/        → Feature components (Table, Charts)
├── types/               → TypeScript type definitions
├── constants/           → Application constants & static data
├── lib/                 → Utility functions & helpers
└── assets/              → Static assets (future use)
```

## 🚀 Quick Import Examples

```typescript
// Types
import { Asset, AssetStatus, Unit } from '@/types';

// Pages
import { Dashboard, AssetListPage } from '@/pages';

// Components
import { Header, Sidebar } from '@/components/layout';
import { StatCard, PlusIcon } from '@/components/ui';
import { AssetTable } from '@/components/features';

// Constants & Utils
import { unitOptions, initialAssets } from '@/constants';
import { generateInventoryPdf } from '@/lib';
```

##  Tips

1. **Always use `@/` alias** for imports (not relative `../`)
2. **Export from index.ts** in each folder (barrel exports)
3. **Keep components small** and focused on one thing
4. **Follow the folder conventions** when adding new files

---

Happy coding! 🎉
