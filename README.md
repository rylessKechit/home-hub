# 🔗 Integration Hub PME - Architecture Minimale

> SaaS d'intégration pour PME françaises - Version optimisée contexte Claude

## 📁 Structure Simplifiée (30 fichiers max)

```
integration-hub/
├── README.md
├── package.json
├── next.config.js
├── .env.local.example
│
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Landing
│   │   ├── dashboard/
│   │   │   ├── page.tsx                # Dashboard principal
│   │   │   └── integrations/
│   │   │       ├── page.tsx            # Liste intégrations
│   │   │       └── new/page.tsx        # Créer intégration
│   │   │
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── integrations/route.ts   # CRUD intégrations
│   │       ├── sync/route.ts           # Trigger sync
│   │       └── webhooks/[service]/route.ts
│   │
│   ├── components/
│   │   ├── ui/                         # shadcn/ui (5-6 composants)
│   │   ├── integration-card.tsx
│   │   ├── integration-form.tsx
│   │   └── field-mapper.tsx
│   │
│   ├── lib/
│   │   ├── db.ts                       # MongoDB connection + models
│   │   ├── auth.ts                     # NextAuth config
│   │   ├── encryption.ts               # Sécurité credentials
│   │   ├── connectors.ts               # Tous connecteurs en 1 fichier
│   │   └── sync-engine.ts              # Moteur de sync
│   │
│   └── types/
│       └── index.ts                    # Tous types en 1 fichier
│
└── docs/
    └── setup.md                        # Guide setup simple
```

## 🗄️ Base de Données Ultra-Simple

### 3 Collections MongoDB Seulement

```typescript
// lib/db.ts - TOUT en un fichier
import mongoose from "mongoose";

// 1. Users
const UserSchema = new mongoose.Schema(
  {
    email: String,
    name: String,
    plan: { type: String, default: "starter" },
  },
  { timestamps: true }
);

// 2. Integrations
const IntegrationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    source: { type: String, config: Object, credentials: String }, // Chiffré
    destination: { type: String, config: Object, credentials: String },
    mapping: [{ from: String, to: String }],
    enabled: { type: Boolean, default: true },
    lastSync: Date,
  },
  { timestamps: true }
);

// 3. SyncLogs
const SyncLogSchema = new mongoose.Schema(
  {
    integrationId: { type: mongoose.Schema.Types.ObjectId, ref: "Integration" },
    status: { type: String, enum: ["success", "error"] },
    recordsProcessed: Number,
    error: String,
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
export const Integration =
  mongoose.models.Integration ||
  mongoose.model("Integration", IntegrationSchema);
export const SyncLog =
  mongoose.models.SyncLog || mongoose.model("SyncLog", SyncLogSchema);
```

## 🔌 Connecteurs Ultra-Concentrés

```typescript
// lib/connectors.ts - TOUS les connecteurs en 1 seul fichier
import Stripe from "stripe";

interface BaseConnector {
  auth(creds: string): Promise<boolean>;
  fetch(config: any): Promise<any[]>;
  push?(data: any[], config: any): Promise<void>;
}

// Stripe Connector (50 lignes max)
class StripeConnector implements BaseConnector {
  private stripe: Stripe;

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey);
  }

  async auth(apiKey: string) {
    try {
      await this.stripe.accounts.retrieve();
      return true;
    } catch {
      return false;
    }
  }

  async fetch() {
    const payments = await this.stripe.paymentIntents.list({ limit: 100 });
    return payments.data.map((p) => ({
      id: p.id,
      amount: p.amount / 100,
      status: p.status,
      created: new Date(p.created * 1000),
    }));
  }
}

// Google Sheets Connector (50 lignes max)
class SheetsConnector implements BaseConnector {
  // Implémentation similaire ultra-simple
}

// Registry
export const CONNECTORS = {
  stripe: StripeConnector,
  sheets: SheetsConnector,
  mailchimp: MailchimpConnector, // À ajouter
  hubspot: HubspotConnector, // À ajouter
};
```

## ⚡ Moteur de Sync Minimal

```typescript
// lib/sync-engine.ts - Moteur ultra-simple
export async function runSync(integrationId: string) {
  const integration = await Integration.findById(integrationId);
  if (!integration) throw new Error("Integration not found");

  try {
    // 1. Créer connecteurs
    const SourceConnector = CONNECTORS[integration.source.type];
    const DestConnector = CONNECTORS[integration.destination.type];

    const source = new SourceConnector(decrypt(integration.source.credentials));
    const dest = new DestConnector(
      decrypt(integration.destination.credentials)
    );

    // 2. Récupérer données
    const data = await source.fetch(integration.source.config);

    // 3. Mapper les champs
    const mappedData = data.map((row) => {
      const mapped = {};
      integration.mapping.forEach((m) => {
        mapped[m.to] = row[m.from];
      });
      return mapped;
    });

    // 4. Envoyer vers destination
    await dest.push(mappedData, integration.destination.config);

    // 5. Logger succès
    await SyncLog.create({
      integrationId,
      status: "success",
      recordsProcessed: data.length,
    });

    // 6. Mettre à jour lastSync
    integration.lastSync = new Date();
    await integration.save();
  } catch (error) {
    // Logger erreur
    await SyncLog.create({
      integrationId,
      status: "error",
      error: error.message,
    });
    throw error;
  }
}
```

## 🎨 Interface Ultra-Simple

```typescript
// components/integration-form.tsx - Form tout-en-un
export function IntegrationForm() {
  return (
    <form>
      {/* 1. Nom intégration */}
      <input name="name" placeholder="Nom de l'intégration" />

      {/* 2. Source */}
      <select name="sourceType">
        <option value="stripe">Stripe</option>
        <option value="mailchimp">Mailchimp</option>
      </select>
      <input name="sourceCredentials" placeholder="API Key source" />

      {/* 3. Destination */}
      <select name="destType">
        <option value="sheets">Google Sheets</option>
        <option value="hubspot">HubSpot</option>
      </select>
      <input name="destCredentials" placeholder="API Key destination" />

      {/* 4. Mapping simple */}
      <div>
        <input placeholder="Champ source" />
        <span>→</span>
        <input placeholder="Champ destination" />
      </div>

      <button type="submit">Créer Intégration</button>
    </form>
  );
}
```

## 📦 Package.json Minimal

```json
{
  "name": "integration-hub-pme",
  "dependencies": {
    "next": "15.0.0",
    "react": "18.0.0",
    "mongoose": "^8.0.0",
    "stripe": "^14.0.0",
    "googleapis": "^130.0.0",
    "next-auth": "5.0.0-beta.4",
    "tailwindcss": "^3.4.0",
    "@radix-ui/react-*": "^1.0.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

## 🚀 Setup en 10 Minutes

```bash
# 1. Créer projet
npx create-next-app@latest integration-hub --typescript --tailwind --app

# 2. Installer dépendances
npm install mongoose stripe googleapis next-auth

# 3. Variables d'env (.env.local)
MONGODB_URI=mongodb+srv://...
NEXTAUTH_SECRET=random-secret
STRIPE_SECRET_KEY=sk_test_...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# 4. Copier les 10-15 fichiers de l'architecture
# 5. npm run dev

# ✅ MVP fonctionnel !
```

## 🎯 Évolution Contrôlée

### Phase 1 - MVP (15 fichiers max)

- 2 connecteurs (Stripe + Sheets)
- Interface basique
- 1 type d'intégration

### Phase 2 - Scale (25 fichiers max)

- 4 connecteurs total
- Interface améliorée
- Templates pré-faits

### Phase 3 - Growth (30 fichiers max)

- 6 connecteurs max
- Analytics simples
- API externe

## 🧠 **Principe "Claude-First"**

- **1 fichier = 1 responsabilité** claire
- **Maximum 200 lignes** par fichier
- **Pas de sur-engineering**
- **Comments explicites** partout
- **Types simples** mais stricts

## 📏 **Limites Strictes**

- **Total projet** : < 8000 lignes de code
- **Fichiers** : < 30 total
- **Connecteurs** : Max 6 (suffisant pour PME)
- **Features** : Core seulement, pas de bells & whistles

---

## ✅ **Avantages Architecture Minimale**

1. **Claude peut tenir tout le projet** en contexte
2. **Développement ultra-rapide** (moins de complexité)
3. **Maintenance facile** (tout visible d'un coup)
4. **Onboarding instantané** (15 min pour comprendre)
5. **Debug simple** (moins de couches)

**Résultat** : Un SaaS puissant mais **simple à maintenir et faire évoluer** ! 🎯
