# CV Adapter

Outil local pour **adapter un CV maître à une offre**, générer un **PDF ATS une page**, et envoyer un **premier mail Talent Acquisition** via Brevo.

Le CV source reste la vérité : l’adaptation ne doit pas inventer d’expériences, diplômes ou skills.

## Prérequis

- Node.js 20+
- Un compte [Google AI Studio](https://aistudio.google.com/apikey) (Gemini)
- Optionnel : un compte [Brevo](https://www.brevo.com/) pour l’envoi d’emails (expéditeur vérifié)

## Installation

```bash
git clone https://github.com/samrub06/cv-adapter.git
cd cv-adapter
npm install
cp .env.example .env.local
```

Édite `.env.local` (jamais commité) :

```bash
GOOGLE_API_KEY=ta_cle_gemini
GEMINI_MODEL=gemini-3.6-flash

# Optionnel — mails TA
BREVO_API_KEY=
BREVO_SENDER_EMAIL=expediteur-verifie@ton-domaine
BREVO_SENDER_NAME=Samuel Charbit
```

Lance l’app :

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

La base SQLite est créée toute seule dans `data/cv-adapter.db` (ignorée par git).

## Procédure d’usage

### 1. CV maître

1. Va sur **CV maître**.
2. Colle ton CV en markdown (sections `## Summary`, `## Technical Skills`, `## Experience`, `## Projects`, `## Education`, `## Languages`).
3. Enregistre. Le parse JSON en bas doit montrer tes expériences et skills.
4. **Télécharger le PDF ATS** pour vérifier le template (Carlito, une page, skills en `- Frontend : …`).

Format d’une expérience :

```markdown
### Entreprise (détail)
Role | Ville, Pays
Jan 2024 – Present
- Bullet concret
```

### 2. Ajouter une offre

Sur **Offres** :

- **URL** si la page est publiquement scrapable, ou
- **Coller le texte** (chemin nominal pour LinkedIn, souvent bloqué).

Gemini extrait titre, entreprise, lieu, exigences, mots-clés. Corrige-les sur la fiche offre si besoin.

### 3. Adapter le CV

1. **Adapter le CV** : Gemini réécrit summary / bullets / ordre des skills pour l’offre, sans inventer.
2. **Preview CV** : diff vs maître.
3. **Télécharger le PDF** : même template ATS, une page remplie.

Relance l’adaptation si tu changes le prompt / le maître.

### 4. Premier mail Talent Acquisition (Brevo)

Sur la fiche offre, en bas :

1. Renseigne **nom + email** du recruteur.
2. **Générer le meilleur premier mail** : Gemini cherche une news / un produit public sur l’entreprise, puis rédige un premier contact court (80–130 mots, pas de PJ).
3. Relis le hook (source + confiance). Si la news est faible, le mail n’invente rien.
4. Édite sujet / corps, puis **Envoyer via Brevo**.

Sans `BREVO_API_KEY` / `BREVO_SENDER_EMAIL`, la génération marche, l’envoi est désactivé. L’adresse d’expéditeur doit être **vérifiée** dans Brevo (Senders).

## Stack

- Next.js App Router, SQLite (`better-sqlite3` + Drizzle)
- Gemini (`@google/genai`) pour extraction, adaptation, recherche + brouillon mail
- `@react-pdf/renderer` + polices Carlito (OFL)
- Brevo Transactional API (`POST /v3/smtp/email`)

## Sécurité

- Ne committe jamais `.env.local` ni `data/`.
- Le fetch d’URL d’offre refuse les hôtes privés (SSRF).
- L’outreach est **un mail à la fois**, pas un envoi de masse.

## Scripts

```bash
npm run dev    # développement
npm run build  # build production
npm run start  # servir le build
npm run lint
```
