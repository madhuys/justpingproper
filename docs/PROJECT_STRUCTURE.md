# JustPing Backend Project Structure Documentation

> Generated on 2025-06-25 at 09:45:20

## 📊 Project Statistics

| Metric | Value |
|--------|-------|
| **Total Files** | 537 |
| **Total Lines of Code** | 80,014 |
| **API Modules** | 46 |
| **API Endpoints Detected** | 0 |
| **Average Lines per File** | 149 |

## 🏗️ Architecture Overview

This is a Node.js/Express backend API with the following key architectural components:
- **Modular API Structure**: Organized by business domains (Agents, Auth, Contacts, etc.)
- **AgentsFlow System**: AI-powered conversation flow management
- **WhatsApp Integration**: Comprehensive messaging and webhook handling
- **Database Layer**: Knex.js with PostgreSQL migrations
- **Authentication**: Firebase Admin SDK integration
- **Background Processing**: Worker-based job processing

## 🏆 Top 15 Largest Files by Lines of Code

| File | Lines | Size (KB) | Category |
|------|-------|-----------|----------|
| `package-lock.json` | 12766 | 451.4 | .json |
| `api/Templates/service.js` | 2579 | 107.7 | .js |
| `api/Broadcast/service.js` | 1828 | 63.5 | .js |
| `AgentsFlow/webhookFlowManager.js` | 1199 | 38.7 | .js |
| `AgentsFlow/aiService.js` | 972 | 33.8 | .js |
| `api/Channel/service.js` | 962 | 34.4 | .js |
| `AgentsFlow/strictAgentValidator.js` | 955 | 31.6 | .js |
| `api/Agents/service.js` | 935 | 31.8 | .js |
| `api/ConversationFlow/controller.js` | 921 | 27.5 | .js |
| `api/Contacts/service.js` | 846 | 28.3 | .js |
| `api/Contacts/repository.js` | 777 | 24.9 | .js |
| `src/app/(dashboard)/contacts/groups/[groupId]/bulk-add/page.tsx` | 720 | 27.0 | .tsx |
| `api/Contacts/controller.js` | 718 | 19.5 | .js |
| `AgentsFlow/whatsAppServiceProviders.js` | 704 | 20.4 | .js |
| `system/providers/Karix/broadcast.js` | 678 | 21.9 | .js |

## 📈 Module Complexity Analysis

| Module | Files | Lines | Avg Lines/File |
|--------|-------|-------|----------------|
| **src** | 209 | 24,082 | 115 |
| **package-lock** | 1 | 12,766 | 12766 |
| **AgentsFlow** | 17 | 7,373 | 434 |
| **system** | 71 | 7,318 | 103 |
| **Templates** | 5 | 3,085 | 617 |
| **Contacts** | 8 | 3,063 | 383 |
| **migrations** | 35 | 2,723 | 78 |
| **Broadcast** | 5 | 2,501 | 500 |
| **TeamInbox** | 10 | 2,049 | 205 |
| **Agents** | 6 | 1,745 | 291 |
| **Channel** | 5 | 1,595 | 319 |
| **scripts** | 7 | 1,490 | 213 |
| **Team** | 7 | 1,345 | 192 |
| **ConversationFlow** | 4 | 1,237 | 309 |
| **Auth** | 7 | 1,224 | 175 |
| **server** | 6 | 1,163 | 194 |
| **Business** | 7 | 1,094 | 156 |
| **Role** | 7 | 884 | 126 |
| **Campaign** | 5 | 791 | 158 |
| **MessageEvents** | 2 | 780 | 390 |
| **docs** | 12 | 541 | 45 |
| **change-log** | 1 | 304 | 304 |
| **.claude** | 1 | 159 | 159 |
| **start-dev** | 2 | 149 | 75 |
| **package** | 1 | 93 | 93 |
| **.env** | 1 | 76 | 76 |
| **start** | 1 | 75 | 75 |
| **start-simple** | 1 | 44 | 44 |
| **next.config** | 1 | 37 | 37 |
| **dev-start** | 1 | 35 | 35 |
| **run-contact-worker** | 1 | 35 | 35 |
| **test** | 1 | 35 | 35 |
| **tsconfig** | 2 | 28 | 14 |
| **purgecss.config** | 1 | 27 | 27 |
| **package-minimal** | 1 | 24 | 24 |
| **components** | 1 | 18 | 18 |
| **knexfile** | 1 | 15 | 15 |
| **next-env.d** | 1 | 4 | 4 |
| **postcss.config** | 1 | 4 | 4 |
| **knip** | 1 | 3 | 3 |
| **README** | 1 | 0 | 0 |
| **design screens** | 25 | 0 | 0 |
| **public** | 36 | 0 | 0 |
| **tempassets** | 8 | 0 | 0 |
| **tree_structure** | 1 | 0 | 0 |
| **uploads** | 9 | 0 | 0 |

## 🗂️ Project Structure Tree

```
justping-backend/
└── 📁 .claude/
    ├── 📄 settings.local.json (159 lines)
└── 📄 .env.local (76 lines)
└── 📁 AgentsFlow/
    ├── 📄 aiProcessor.js (490 lines)
    ├── 📄 aiService.js (972 lines)
    ├── 📄 analytics.js (305 lines)
    ├── 📄 broadcastFlowIntegration.js (204 lines)
    ├── ⚡ config.js (171 lines)
    ├── 🎮 controller.js (163 lines)
    ├── 📄 conversationFlowService.js (294 lines)
    ├── 📄 flowManager.js (471 lines)
    ├── 📄 helper.js (158 lines)
    ├── 📄 index.js (11 lines)
    ├── 🔒 middleware.js (326 lines)
    ├── 🛣️ route.js (28 lines)
    ├── ⚙️ service.js (432 lines)
    ├── 📄 strictAgentValidator.js (955 lines)
    ├── 📄 utils.js (490 lines)
    ├── 📄 webhookFlowManager.js (1199 lines)
    ├── 📄 whatsAppServiceProviders.js (704 lines)
└── 📖 README.md
└── 📁 api/
    ├── 📁 Agents/
    │   ├── 🎮 controller.js (326 lines)
    │   ├── 📄 index.js (20 lines)
    │   ├── 🔒 middleware.js (181 lines)
    │   ├── 🛣️ route.js (94 lines)
    │   ├── 📋 schema.js (189 lines)
    │   ├── ⚙️ service.js (935 lines)
    ├── 📁 Auth/
    │   ├── 🎮 controller.js (419 lines)
    │   ├── 📄 index.js (6 lines)
    │   ├── 📄 repository.js (285 lines)
    │   ├── 🛣️ route.js (57 lines)
    │   ├── 📋 schema.js (76 lines)
    │   ├── ⚙️ service.js (240 lines)
    │   ├── 📄 utils.js (141 lines)
    ├── 📁 Broadcast/
    │   ├── 🎮 controller.js (350 lines)
    │   ├── 📄 index.js (11 lines)
    │   ├── 🛣️ route.js (91 lines)
    │   ├── 📋 schema.js (221 lines)
    │   ├── ⚙️ service.js (1828 lines)
    ├── 📁 Business/
    │   ├── 📖 business.md
    │   ├── 🎮 controller.js (303 lines)
    │   ├── 📄 index.js (5 lines)
    │   ├── 📄 repository.js (111 lines)
    │   ├── 🛣️ route.js (155 lines)
    │   ├── 📋 schema.js (99 lines)
    │   ├── ⚙️ service.js (421 lines)
    ├── 📁 Campaign/
    │   ├── 🎮 controller.js (185 lines)
    │   ├── 📄 index.js (8 lines)
    │   ├── 🛣️ route.js (58 lines)
    │   ├── 📋 schema.js (127 lines)
    │   ├── ⚙️ service.js (413 lines)
    ├── 📁 Channel/
    │   ├── 🎮 controller.js (338 lines)
    │   ├── 📄 index.js (9 lines)
    │   ├── 🛣️ route.js (111 lines)
    │   ├── 📋 schema.js (175 lines)
    │   ├── ⚙️ service.js (962 lines)
    ├── 📁 Contacts/
    │   ├── 📖 contacts.md
    │   ├── 🎮 controller.js (718 lines)
    │   ├── 📄 index.js (8 lines)
    │   ├── 📄 repository.js (777 lines)
    │   ├── 🛣️ route.js (217 lines)
    │   ├── 📋 schema.js (245 lines)
    │   ├── ⚙️ service.js (846 lines)
    │   ├── 📁 workers/
    │   │   └── 📄 contactUploadWorker.js (252 lines)
    ├── 📁 ConversationFlow/
    │   ├── 🎮 controller.js (921 lines)
    │   ├── 📄 index.js (6 lines)
    │   ├── 🛣️ route.js (138 lines)
    │   ├── 📋 schema.js (172 lines)
    ├── 📁 MessageEvents/
    │   ├── 🎮 controller.js (338 lines)
    │   ├── ⚙️ service.js (442 lines)
    ├── 📁 Role/
    │   ├── 🎮 controller.js (284 lines)
    │   ├── 📄 index.js (8 lines)
    │   ├── 📄 repository.js (283 lines)
    │   ├── 📖 role.md
    │   ├── 🛣️ route.js (61 lines)
    │   ├── 📋 schema.js (49 lines)
    │   ├── ⚙️ service.js (199 lines)
    ├── 📁 Team/
    │   ├── 🎮 controller.js (258 lines)
    │   ├── 📄 index.js (8 lines)
    │   ├── 📄 repository.js (339 lines)
    │   ├── 🛣️ route.js (83 lines)
    │   ├── 📋 schema.js (75 lines)
    │   ├── ⚙️ service.js (582 lines)
    │   ├── 📖 teamMangement.md
    ├── 📁 TeamInbox/
    │   ├── 📖 README.md
    │   ├── 📄 TeamInbox-Postman-Collection.json (466 lines)
    │   ├── 📄 TeamInbox-Postman-Environment.json (45 lines)
    │   ├── 🎮 controller.js (291 lines)
    │   ├── 📄 index.js (16 lines)
    │   ├── 📄 repository.js (598 lines)
    │   ├── 🛣️ route.js (112 lines)
    │   ├── 📋 schema.js (103 lines)
    │   ├── ⚙️ service.js (418 lines)
    │   ├── 📖 teamInbox.md
    ├── 📁 Templates/
    │   └── 🎮 controller.js (186 lines)
    │   └── 📄 index.js (20 lines)
    │   └── 🛣️ route.js (62 lines)
    │   └── 📋 schema.js (238 lines)
    │   └── ⚙️ service.js (2579 lines)
└── 📄 change-log.json (304 lines)
└── 📄 components.json (18 lines)
└── 📁 design screens/
    ├── 📄 1.1 Create Password.jpg
    ├── 📄 1.2 Create password Successfully.jpg
    ├── 📄 1.3 Sign in.jpg
    ├── 📄 1.4 About Company.jpg
    ├── 📄 1.5 About Company 2.jpg
    ├── 📄 1.6 Admin details about company 3.jpg
    ├── 📄 1.7 Add Team Member(add).jpg
    ├── 📄 1.8 Add Team Member.jpg
    ├── 📄 1.9 welcome with dropdown.jpg
    ├── 📄 1.9b welcome with dropdown.jpg
    ├── 📄 2.3 Edit business Profile.png
    ├── 📄 2.4 Edit business Profile.png
    ├── 📄 3.1  business Profile add member.png
    ├── 📄 3.2 business Profile - add member.png
    ├── 📄 3.3 business Profile - add member.png
    ├── 📄 3.4  business Profile(add team member).png
    ├── 📄 3.5  business Profile(remove number).png
    ├── 📄 3.6 business Profile(remove number).png
    ├── 📄 4.1 My Profile.jpg
    ├── 📄 4.4 Edit profile.jpg
    ├── 📄 Frame 1000004901.png
    ├── 📄 Frame 1000004903.png
    ├── 📄 Frame 1000004905.png
    ├── 📄 Primary Logo.svg
    ├── 📄 State=Selected.png
└── 📄 dev-start.js (35 lines)
└── 📁 docs/
    ├── 📄 .project-cache.json (541 lines)
    ├── 📖 AUDIT_REPORT.md
    ├── 📖 COMPONENT_ARCHITECTURE.md
    ├── 📖 CSS_AUDIT_REPORT.md
    ├── 📖 DEVELOPMENT_WORKFLOW.md
    ├── 📖 DesignDocument.md
    ├── 📖 FILE_MANAGEMENT_MODULE_REQUIREMENTS.md
    ├── 📖 FULLSTACK_ARCHITECTURE.md
    ├── 📖 IMPLEMENTATION_GUIDE.md
    ├── 📖 INTEGRATIONS_MODULE_REQUIREMENTS.md
    ├── 📖 PROJECT_STRUCTURE.md
    ├── 📖 README.md
└── 📄 knexfile.js (15 lines)
└── 📄 knip.json (3 lines)
└── 📁 migrations/
    ├── 📖 MIGRATIONS.md
    ├── 📄 cli.js (140 lines)
    ├── 📁 knex/
    │   ├── 📄 20250402161618_add_business_management.js (163 lines)
    │   ├── 📄 20250403161136_add_firebase_auth_support.js (33 lines)
    │   ├── 📄 20250408044631_create_contacts_management_table.js (192 lines)
    │   ├── 📄 20250408094818_create_auth_table.js (51 lines)
    │   ├── 📄 20250409085842_create_language_table.js (14 lines)
    │   ├── 📄 20250416053148_create_document_table.js (35 lines)
    │   ├── 📄 20250416115221_add_business_verification.js (128 lines)
    │   ├── 📄 20250417063418_create_team_management_tables.js (67 lines)
    │   ├── 📄 20250422065115_create_table_agents.js (66 lines)
    │   ├── 📄 20250422094838_create_table_agent_nodes.js (46 lines)
    │   ├── ⚡ 20250422095009_create_table_ai_configs.js (53 lines)
    │   ├── 📄 20250424121038_create_table_campaign.js (191 lines)
    │   ├── 📄 20250501055719_create_table_business_channel.js (56 lines)
    │   ├── 📄 20250501055753_create_table_channel.js (43 lines)
    │   ├── 📄 20250501094244_create_table_broadcast.js (188 lines)
    │   ├── 📄 20250502054536_create_table_conversation.js (40 lines)
    │   ├── 📄 20250502055601_create_table_message.js (26 lines)
    │   ├── 📄 20250502083839_create_table_broadcast_batch_results.js (25 lines)
    │   ├── 📄 20250502091259_add_country_code_to_end_user.js (12 lines)
    │   ├── 📄 20250502091400_add_column_country_code_to_table_end_user.js (86 lines)
    │   ├── 📄 20250502111718_add_column_fields_table_conversation.js (9 lines)
    │   ├── 📄 20250502111749_create_table_tag.js (66 lines)
    │   ├── 📄 20250609083111_create_message_status_table.js (36 lines)
    │   ├── 📄 20250609083112_add_provider_message_id_to_message_table.js (42 lines)
    │   ├── 📄 20250610172021_add_current_step_to_conversation.js (16 lines)
    │   ├── 📄 20250611120000_add_agent_id_to_conversation.js (37 lines)
    │   ├── 📄 20250611180000_add_type_column_to_broadcast.js (31 lines)
    │   ├── 📄 20250616120000_add_enable_ai_takeover_to_agent_nodes.js (40 lines)
    │   ├── 📄 20250618120000_add_qr_code_support_to_broadcast.js (17 lines)
    │   ├── 📄 20250619_modify_broadcast_optional_fields.js (24 lines)
    ├── 📁 scripts/
    │   ├── 🔄 run-migrations.js (55 lines)
    ├── 📁 seeds/
    │   ├── 📄 01_languages.js (436 lines)
    ├── 📁 utils/
    │   └── 🔄 migration-utils.js (259 lines)
└── 📄 next-env.d.ts (4 lines)
└── ⚡ next.config.mjs (37 lines)
└── 📄 package-lock.json (12766 lines)
└── 📄 package-minimal.json (24 lines)
└── 📄 package.json (93 lines)
└── ⚡ postcss.config.mjs (4 lines)
└── 📁 public/
    ├── 📄 Frame 1000004901.png
    ├── 📄 Frame 1000004903.png
    ├── 📄 Frame 1000004905.png
    ├── 📄 PrimaryLogo.png
    ├── 📄 favicon-dark.png
    ├── 📄 favicon-light.png
    ├── 📄 favicon.ico
    ├── 📄 file.svg
    ├── 📄 globe.svg
    ├── 📄 icontextlogo.png
    ├── 📁 images/
    │   ├── 📄 auth-illustration.png
    │   ├── 📄 dark-bg.png
    │   ├── 📄 dark-bg.webp
    │   ├── 📄 light-bg.webp
    │   ├── 📄 supermad1983_white_background_scatterd_with_small_paint_spashes_6da1da80-ec3f-4718-a3fd-bbea6ec89927.png
    ├── 📁 logos/
    │   ├── 📄 logo-dark.png
    │   ├── 📄 logo-light.png
    │   ├── 📄 logo-stacked.png
    │   ├── 📄 logo-text-dark.png
    │   ├── 📄 logo-text-light.png
    ├── 📄 negativefulltextlogo.png
    ├── 📄 negativelogo.png
    ├── 📄 next.svg
    ├── 📁 test-docs/
    │   ├── 📄 915qP2I1KGL._AC_SX679_.jpg
    │   ├── 📄 Contextual Customer Intelligence-Insights Platform Apkar May 24.pdf
    │   ├── 📄 Draft MOU Instrive CMI Template 2025.docx
    │   ├── 📄 Gen-3 Alpha Turbo 1396960789, The camera pulls bac, Cropped - ChatGPT Im, M 5, cam_R -1, cam_Z -15.mp4
    │   ├── 📄 Just Ping super AI.pdf
    │   ├── 📄 Pitch Deck for Just Ping - dCommerce.pptx
    │   ├── 📄 akshitav2.mp4
    │   ├── 📄 akshitav3.mp4
    │   ├── 📄 download (1).jpg
    │   ├── 📄 just_ping_marketing_20250623075600.pdf
    ├── 📄 textlogo.png
    ├── 📄 vercel.svg
    ├── 📄 window.svg
└── ⚡ purgecss.config.js (27 lines)
└── 📄 run-contact-worker.js (35 lines)
└── 📁 scripts/
    ├── 📄 audit-codebase.js (464 lines)
    ├── 📄 audit-css.js (329 lines)
    ├── 📄 generate-docs.js (452 lines)
    ├── 📄 rename-components.js (115 lines)
    ├── 🧪 simple-db-test.js (73 lines)
    ├── 🧪 test-database.js
    ├── 📄 track-progress.js (57 lines)
└── 📁 server/
    ├── 📁 controllers/
    │   ├── 📄 authController.js (419 lines)
    │   ├── 📄 businessController.js (123 lines)
    ├── 📁 middleware/
    │   ├── 📄 authMiddleware.js (54 lines)
    ├── 📁 services/
    │   ├── 📄 authService.js (240 lines)
    │   ├── 📄 businessService.js (186 lines)
    ├── 📁 utils/
    │   └── 📄 authUtils.js (141 lines)
└── 📁 src/
    ├── 📁 app/
    │   ├── 📄 'use client';.tsx (242 lines)
    │   ├── 📁 (auth)/
    │   │   ├── 📁 forgot-password/
    │   │   │   ├── 📄 page.tsx (111 lines)
    │   │   ├── 📄 layout.tsx (2 lines)
    │   │   ├── 📁 login/
    │   │   │   ├── 📄 page.tsx (108 lines)
    │   │   ├── 📁 register/
    │   │   │   ├── 📄 page.tsx (192 lines)
    │   │   ├── 📁 reset-password/
    │   │   │   └── 📄 page.tsx (188 lines)
    │   ├── 📁 (dashboard)/
    │   │   ├── 📁 business/
    │   │   │   ├── 📄 page.tsx (62 lines)
    │   │   ├── 📁 business-profile/
    │   │   │   ├── 📄 page.tsx (187 lines)
    │   │   ├── 📁 contacts/
    │   │   │   ├── 📁 groups/
    │   │   │   │   ├── 📁 [groupId]/
    │   │   │   │   │   └── 📁 add/
    │   │   │   │   │       ├── 📄 page.tsx (462 lines)
    │   │   │   │   │   └── 📁 bulk-add/
    │   │   │   │   │       ├── 📄 page.tsx (720 lines)
    │   │   │   │   │   └── 📁 fields/
    │   │   │   │   │       └── 📄 page.tsx (609 lines)
    │   │   │   ├── 📄 page.tsx (450 lines)
    │   │   ├── 📁 file-manager/
    │   │   │   ├── 📄 page.tsx (252 lines)
    │   │   ├── 📁 home/
    │   │   │   ├── 📄 page.tsx (158 lines)
    │   │   ├── 📁 integrations/
    │   │   │   ├── 📄 page.tsx (119 lines)
    │   │   ├── 📄 layout.tsx (21 lines)
    │   │   ├── 📁 loading-test/
    │   │   │   ├── 📄 page.tsx (58 lines)
    │   │   ├── 📁 profile/
    │   │   │   ├── 📄 page.tsx (141 lines)
    │   │   ├── 📁 settings/
    │   │   │   ├── 📄 page.tsx (237 lines)
    │   │   ├── 📁 users/
    │   │   │   └── 📄 page.tsx (192 lines)
    │   ├── 📁 (onboarding)/
    │   │   ├── 📄 layout.tsx (2 lines)
    │   │   ├── 📁 onboarding/
    │   │   │   └── 📄 page.tsx (5 lines)
    │   ├── 📖 BACKEND_API_ANALYSIS.md
    │   ├── 📁 api/
    │   │   ├── 📁 auth/
    │   │   │   ├── 📁 login/
    │   │   │   │   ├── 🛣️ route.ts (43 lines)
    │   │   │   ├── 📁 logout/
    │   │   │   │   ├── 🛣️ route.ts (18 lines)
    │   │   │   ├── 📁 register/
    │   │   │   │   └── 🛣️ route.ts (31 lines)
    │   │   ├── 📁 business/
    │   │   │   ├── 🛣️ route.ts (66 lines)
    │   │   ├── 📁 business-profile/
    │   │   │   ├── 🛣️ route.ts (62 lines)
    │   │   ├── 📁 content/
    │   │   │   ├── 📁 [category]/
    │   │   │   │   ├── 🛣️ route.ts (78 lines)
    │   │   │   ├── 🛣️ route.ts (55 lines)
    │   │   ├── 📁 files/
    │   │   │   ├── 🛣️ route.ts (76 lines)
    │   │   ├── 📁 health/
    │   │   │   ├── 🛣️ route.ts (17 lines)
    │   │   ├── 📁 states/
    │   │   │   ├── 📁 [state]/
    │   │   │   │   ├── 🛣️ route.ts (126 lines)
    │   │   │   ├── 📁 businessProfile/
    │   │   │   │   ├── 🛣️ route.ts (108 lines)
    │   │   │   ├── 📁 file-management/
    │   │   │   │   ├── 🛣️ route.ts (34 lines)
    │   │   │   ├── 📁 onboarding/
    │   │   │   │   ├── 🛣️ route.ts (178 lines)
    │   │   │   ├── 📁 search-history/
    │   │   │   │   ├── 🛣️ route.ts (55 lines)
    │   │   │   ├── 📁 ui-preferences/
    │   │   │   │   └── 🛣️ route.ts (41 lines)
    │   │   ├── 📁 team/
    │   │   │   ├── 📁 [id]/
    │   │   │   │   ├── 🛣️ route.ts (80 lines)
    │   │   │   ├── 🛣️ route.ts (83 lines)
    │   │   ├── 📁 test/
    │   │   │   ├── 🛣️ route.ts (39 lines)
    │   │   ├── 📁 user/
    │   │   │   ├── 📁 profile/
    │   │   │   │   └── 🛣️ route.ts (57 lines)
    │   │   ├── 📁 users/
    │   │   │   └── 📁 [id]/
    │   │   │       ├── 🛣️ route.ts (80 lines)
    │   │   │   └── 🛣️ route.ts (83 lines)
    │   ├── 📄 favicon.ico
    │   ├── 📄 globals.css (630 lines)
    │   ├── 📄 layout.tsx (102 lines)
    │   ├── 📁 loading/
    │   │   ├── 📄 page.tsx (10 lines)
    │   ├── 📄 page.tsx (32 lines)
    ├── 📁 components/
    │   ├── 📁 atoms/
    │   │   ├── 📄 ActionCard.tsx (119 lines)
    │   │   ├── 📄 AuthDivider.tsx (18 lines)
    │   │   ├── 📄 EmptyState.tsx (46 lines)
    │   │   ├── 📄 FileIcon.tsx (104 lines)
    │   │   ├── 📄 Loader.tsx (98 lines)
    │   │   ├── 📄 LogoutFab.tsx (34 lines)
    │   │   ├── 📄 PageHeader.tsx (35 lines)
    │   │   ├── 📄 PasswordInput.tsx (42 lines)
    │   │   ├── 📄 ProgressBar.tsx (23 lines)
    │   │   ├── 📄 StepIndicator.tsx (23 lines)
    │   │   ├── 📄 ThemeReady.tsx (22 lines)
    │   ├── 📁 layouts/
    │   │   ├── 📁 onboarding/
    │   │   │   ├── 📄 layout.tsx (36 lines)
    │   │   ├── 📁 postauth/
    │   │   │   ├── 📄 layout.tsx (154 lines)
    │   │   ├── 📁 postauthforms/
    │   │   │   ├── 📄 layout.tsx (149 lines)
    │   │   ├── 📁 preauth/
    │   │   │   └── 📄 layout.tsx (94 lines)
    │   ├── 📁 molecules/
    │   │   ├── 📄 AutoReplySettings.tsx (61 lines)
    │   │   ├── 📄 AvatarUpload.tsx (102 lines)
    │   │   ├── 📄 BusinessHoursSettings.tsx (59 lines)
    │   │   ├── 📄 BusinessProfileFields.tsx (134 lines)
    │   │   ├── 📄 ChatFAB.tsx (38 lines)
    │   │   ├── 📄 ChatInput.tsx (235 lines)
    │   │   ├── 📄 ChatMessage.tsx (167 lines)
    │   │   ├── 📄 DocumentManager.tsx (116 lines)
    │   │   ├── 📄 FileBreadcrumb.tsx (37 lines)
    │   │   ├── 📄 FileCard.tsx (87 lines)
    │   │   ├── 📄 FileCardView.tsx (65 lines)
    │   │   ├── 📄 FileInfo.tsx (61 lines)
    │   │   ├── 📄 FileListRow.tsx (76 lines)
    │   │   ├── 📄 FileListView.tsx (57 lines)
    │   │   ├── 📄 FileThumbnail.tsx (220 lines)
    │   │   ├── 📄 FileThumbnailView.tsx (29 lines)
    │   │   ├── 📄 FileUploadArea.tsx (53 lines)
    │   │   ├── 📄 FileUploadCard.tsx (32 lines)
    │   │   ├── 📄 FormField.tsx (38 lines)
    │   │   ├── 📄 HomeGrid.tsx (130 lines)
    │   │   ├── 📄 ImageCarousel.tsx (67 lines)
    │   │   ├── 📄 NotificationSettings.tsx (45 lines)
    │   │   ├── 📄 OAuthButton.tsx (68 lines)
    │   │   ├── 📄 PreferenceSettings.tsx (77 lines)
    │   │   ├── 📄 StepHeader.tsx (25 lines)
    │   │   ├── 📄 TeamMemberListCard.tsx (174 lines)
    │   │   ├── 📄 UserProfileFields.tsx (149 lines)
    │   ├── 📁 navigation/
    │   │   ├── 📄 Footer.tsx (157 lines)
    │   │   ├── 📄 Header.tsx (167 lines)
    │   │   ├── 📄 Sidebar.tsx (166 lines)
    │   ├── 📁 organisms/
    │   │   ├── 📄 AudioPlayer.tsx (205 lines)
    │   │   ├── 📄 AuthForm.tsx (29 lines)
    │   │   ├── 📄 ChannelCard.tsx (129 lines)
    │   │   ├── 📄 ChatWidget.tsx (257 lines)
    │   │   ├── 📄 ConversationsWidgetExpanded.tsx (363 lines)
    │   │   ├── 📄 FileExplorer.tsx (218 lines)
    │   │   ├── 📄 GlobalSearch.tsx (186 lines)
    │   │   ├── 📄 ImageGallery.tsx (181 lines)
    │   │   ├── 📄 ImageViewer.tsx (85 lines)
    │   │   ├── 📄 LiveChatFAB.tsx (18 lines)
    │   │   ├── 📄 NotificationsPanel.tsx (103 lines)
    │   │   ├── 📄 OfficeViewer.tsx (88 lines)
    │   │   ├── 📄 PdfViewer.tsx (102 lines)
    │   │   ├── 📄 QuickConnectPanel.tsx (68 lines)
    │   │   ├── 📄 VideoPlayer.tsx (242 lines)
    │   │   ├── 📁 modals/
    │   │   │   ├── 📄 AddTeamMemberModal.tsx (247 lines)
    │   │   │   ├── 📄 ConnectChannelModal.tsx (196 lines)
    │   │   │   ├── 📄 CreateGroupModal.tsx (128 lines)
    │   │   │   ├── 📄 CreateKnowledgebaseModal.tsx (299 lines)
    │   │   │   ├── 📄 DriveConfigModal.tsx (325 lines)
    │   │   │   ├── 📄 EditTeamMemberModal.tsx (104 lines)
    │   │   │   ├── 📄 FilePreviewModal.tsx (232 lines)
    │   │   │   ├── 📄 ImageCropperModal.tsx (187 lines)
    │   │   │   ├── 📄 IntegrationConfigModal.tsx (549 lines)
    │   │   │   ├── 📄 RemoveTeamMemberModal.tsx (75 lines)
    │   │   │   ├── 📄 ResendInviteModal.tsx (61 lines)
    │   │   ├── 📁 onboarding/
    │   │   │   └── 📄 OnboardingForm.tsx (540 lines)
    │   ├── 📁 pages/
    │   │   ├── 📁 integrations/
    │   │   │   └── 📄 IntegrationCard.tsx (163 lines)
    │   │   │   └── 📄 WhatsAppProviderConfig.tsx (340 lines)
    │   ├── 📁 providers/
    │   │   ├── 📄 ThemeProvider.tsx (6 lines)
    │   ├── 📁 ui/
    │   │   └── 📄 accordion.tsx (50 lines)
    │   │   └── 📄 alert-dialog.tsx (127 lines)
    │   │   └── 📄 alert.tsx (53 lines)
    │   │   └── 📄 avatar.tsx (47 lines)
    │   │   └── 📄 badge.tsx (31 lines)
    │   │   └── 📄 button.tsx (54 lines)
    │   │   └── 📄 card.tsx (87 lines)
    │   │   └── 📄 checkbox.tsx (26 lines)
    │   │   └── 📄 collapsible.tsx (28 lines)
    │   │   └── 📄 combobox.tsx (199 lines)
    │   │   └── 📄 command.tsx (137 lines)
    │   │   └── 📄 dialog.tsx (131 lines)
    │   │   └── 📄 dropdown-menu.tsx (241 lines)
    │   │   └── 📄 input.tsx (19 lines)
    │   │   └── 📄 label.tsx (20 lines)
    │   │   └── 📄 popover.tsx (27 lines)
    │   │   └── 📄 progress.tsx (27 lines)
    │   │   └── 📄 scroll-area.tsx (43 lines)
    │   │   └── 📄 select.tsx (177 lines)
    │   │   └── 📄 separator.tsx (27 lines)
    │   │   └── 📄 slider.tsx (77 lines)
    │   │   └── 📄 table.tsx (107 lines)
    │   │   └── 📄 tabs.tsx (48 lines)
    │   │   └── 📄 textarea.tsx (23 lines)
    │   │   └── 📄 theme-toggle.tsx (27 lines)
    │   │   └── 📄 tooltip.tsx (23 lines)
    ├── 📁 config/
    │   ├── 📄 api.ts (54 lines)
    ├── 📁 contexts/
    │   ├── 📄 AuthContext.tsx (119 lines)
    ├── 📁 data/
    │   ├── 📄 channels.json (357 lines)
    │   ├── 📄 companySizes.json (32 lines)
    │   ├── 📄 contactFieldTypes.json (88 lines)
    │   ├── 📄 countries.json (251 lines)
    │   ├── 📄 countryCodes.json (73 lines)
    │   ├── 📄 departments.json (8 lines)
    │   ├── 📄 fileProviders.json (49 lines)
    │   ├── 📄 industries.json (149 lines)
    │   ├── 📄 mockFileTree.json (149 lines)
    │   ├── 📁 mocks/
    │   │   ├── 📄 teamMembers.json (44 lines)
    │   ├── 📄 roles.json (52 lines)
    │   ├── 📁 states/
    │   │   ├── 📄 businessProfile.json (14 lines)
    │   │   ├── 📄 contacts.json (17 lines)
    │   │   ├── 📄 fileManagement.json (46 lines)
    │   │   ├── 📄 home.json (16 lines)
    │   │   ├── 📄 onboarding.json (79 lines)
    │   │   ├── 📄 settings.json (32 lines)
    │   │   ├── 📄 teamMembers.json (3 lines)
    │   │   ├── 📄 ui-preferences.json (12 lines)
    │   │   ├── 📄 userProfile.json (13 lines)
    │   ├── 📁 strings/
    │   │   ├── 📄 auth.json (77 lines)
    │   │   ├── 📄 businessProfile.json (97 lines)
    │   │   ├── 📄 contacts.json (209 lines)
    │   │   ├── 📄 dashboard.json (63 lines)
    │   │   ├── 📄 fileManagement.json (132 lines)
    │   │   ├── 📄 home.json (143 lines)
    │   │   ├── 📄 integrations.json (107 lines)
    │   │   ├── 📄 navigation.json (102 lines)
    │   │   ├── 📄 onboarding.json (45 lines)
    │   │   ├── 📄 profile.json (39 lines)
    │   │   ├── 📄 settings.json (109 lines)
    │   │   ├── 📄 users.json (29 lines)
    │   ├── 📄 systemRoles.json (26 lines)
    │   ├── 📄 useCases.json (62 lines)
    ├── 📁 hooks/
    │   ├── 📄 useAuthForm.ts (78 lines)
    │   ├── 📄 useBusinessProfile.ts (126 lines)
    │   ├── 📄 useContent.ts (67 lines)
    │   ├── 📄 useFileManager.ts (309 lines)
    │   ├── 📄 useIntegrations.ts (215 lines)
    │   ├── 📄 useSettings.ts (117 lines)
    │   ├── 📄 useTeamMembers.ts (167 lines)
    │   ├── 📄 useUIPreferences.ts (96 lines)
    │   ├── 📄 useUserProfile.ts (108 lines)
    ├── 📁 lib/
    │   ├── 📄 auth-utils.ts (25 lines)
    │   ├── 📄 file-utils.ts (69 lines)
    │   ├── 📄 firebase.ts (73 lines)
    │   ├── 📄 focus-styles.ts (39 lines)
    │   ├── 📁 integrations/
    │   │   ├── 📄 types.ts (75 lines)
    │   │   ├── 📄 utils.ts (136 lines)
    │   ├── 📄 profile-utils.ts (67 lines)
    │   ├── 📄 utils.ts (5 lines)
    ├── 🔒 middleware.ts (66 lines)
    ├── 🔒 middleware.ts.bak (35 lines)
    ├── 📁 stores/
    │   └── 📄 auth-store.ts (293 lines)
    │   └── 📄 business-store.ts (460 lines)
    │   └── 📄 index.ts (25 lines)
    │   └── 📄 settings-store.ts (361 lines)
└── 📄 start-dev.cmd (61 lines)
└── 📄 start-dev.sh (88 lines)
└── 📄 start-simple.js (44 lines)
└── 📄 start.js (75 lines)
└── 📁 system/
    ├── 📁 config/
    │   ├── ⚡ config.js (84 lines)
    │   ├── 📄 database.js (16 lines)
    │   ├── 📄 firebase.js (63 lines)
    │   ├── 🔒 middleware.js (29 lines)
    ├── 📁 db/
    │   ├── 📄 database.js (36 lines)
    │   ├── 📄 postgres.js (108 lines)
    ├── 📁 emailsTemplates/
    │   ├── 📄 password-reset.html (32 lines)
    │   ├── 📄 team-invitation.html (87 lines)
    │   ├── 📄 verification.html (30 lines)
    │   ├── 📄 welcome.html (425 lines)
    ├── 📁 error/
    │   ├── 📄 doc.yml (99 lines)
    │   ├── 📄 handler.js (60 lines)
    │   ├── 📄 index.js (36 lines)
    ├── 📁 middleware/
    │   ├── 📄 auth.js (207 lines)
    │   ├── 📄 log-error.js (7 lines)
    │   ├── 📄 validate-request.js (68 lines)
    ├── 📁 models/
    │   ├── 📄 AIConfig.js (38 lines)
    │   ├── 📄 Agent.js (147 lines)
    │   ├── 📄 AgentNode.js (61 lines)
    │   ├── 📄 BaseModel.js (45 lines)
    │   ├── 📄 Broadcast.js (205 lines)
    │   ├── 📄 BroadcastBatchResult.js (60 lines)
    │   ├── 📄 BroadcastMessage.js (85 lines)
    │   ├── 📄 Business.js (47 lines)
    │   ├── 📄 BusinessChannel.js (84 lines)
    │   ├── 📄 BusinessDocument.js (33 lines)
    │   ├── 📄 BusinessUser.js (56 lines)
    │   ├── 📄 BusinessUserInvitation.js (73 lines)
    │   ├── 📄 BusinessVerification.js (98 lines)
    │   ├── 📄 Campaign.js (157 lines)
    │   ├── 📄 Channel.js (79 lines)
    │   ├── 📄 ContactGroup.js (109 lines)
    │   ├── 📄 ContactGroupAssociation.js (56 lines)
    │   ├── 📄 ContactGroupField.js (59 lines)
    │   ├── 📄 ContactUpload.js (82 lines)
    │   ├── 📄 Conversation.js (135 lines)
    │   ├── 📄 Document.js (91 lines)
    │   ├── 📄 EndUser.js (160 lines)
    │   ├── 📄 Language.js (36 lines)
    │   ├── 📄 Message.js (98 lines)
    │   ├── 📄 MessageAttachment.js (42 lines)
    │   ├── 📄 MessageStatus.js (59 lines)
    │   ├── 📄 Role.js (62 lines)
    │   ├── 📄 Tag.js (59 lines)
    │   ├── 📄 Team.js (103 lines)
    │   ├── 📄 TeamMember.js (81 lines)
    │   ├── 📄 Template.js (136 lines)
    │   ├── 📄 TemplateButton.js (45 lines)
    │   ├── 📄 TemplateComponent.js (75 lines)
    │   ├── 📄 TemplateMedia.js (51 lines)
    │   ├── 📄 TemplateProvider.js (59 lines)
    │   ├── 📄 TokenBlacklist.js (20 lines)
    ├── 📁 providers/
    │   ├── 📁 Gupshup/
    │   │   ├── 📄 broadcast.js (135 lines)
    │   │   ├── 📄 templates.js (245 lines)
    │   ├── 📁 Karix/
    │   │   ├── 📄 broadcast.js (678 lines)
    │   │   ├── 📄 templates.js (299 lines)
    │   ├── 📁 Meta/
    │   │   └── 📄 broadcast.js (135 lines)
    │   │   └── 📄 templates.js (131 lines)
    ├── 📁 services/
    │   ├── 📁 Azure/
    │   │   ├── 📄 blob.js (261 lines)
    │   │   ├── 📄 communication.js (79 lines)
    │   │   ├── 📄 keyWalt.js (15 lines)
    │   │   ├── 📄 queue.js (426 lines)
    │   ├── 📁 Email/
    │   │   └── 📄 index.js (82 lines)
    ├── 📁 utils/
    │   └── 📄 checks.js (20 lines)
    │   └── 🎮 controller-handler.js (30 lines)
    │   └── 📄 datetime.js (34 lines)
    │   └── 📄 file-uploader.js (39 lines)
    │   └── 📄 file.js (108 lines)
    │   └── 📄 logger.js (18 lines)
    │   └── 📄 pagination.js (61 lines)
    │   └── 📄 phoneNormalization.js (249 lines)
└── 📁 tempassets/
    ├── 📄 Frame 1000004901.png
    ├── 📄 Frame 1000004903.png
    ├── 📄 Frame 1000004905.png
    ├── 📄 PrimaryLogo.png
    ├── 📄 icontextlogo.png
    ├── 📄 negativefulltextlogo.png
    ├── 📄 negativelogo.png
    ├── 📄 textlogo.png
└── 🧪 test.json (35 lines)
└── 📄 tree_structure.txt
└── ⚡ tsconfig.json (27 lines)
└── ⚡ tsconfig.tsbuildinfo (1 lines)
└── 📁 uploads/
    └── 📁 storage/
        └── 📁 contacts/
            └── 📄 1358d6b1-85bd-4840-a815-9e1e7de58603.xlsx
            └── 📄 2eb88428-1e18-4f61-9f68-7fa5feeeb05c.xlsx
            └── 📄 39d95a97-31a6-4b87-be64-ba49a8bd5091.xlsx
            └── 📄 4261f13d-4dc7-405c-b49e-71de2cc6ce64.xlsx
            └── 📄 5b04b272-2c93-45d2-91bc-50d89304d598.xlsx
            └── 📄 73ef26f9-4dc4-4f3b-a12f-c50dbd067ade.xlsx
            └── 📄 ccf4241d-b022-4cd7-ac1c-2e73c77e46c0.xlsx
            └── 📄 d17340c8-fb2c-4018-9658-d53cd703ad65.xlsx
            └── 📄 d6fff336-44cb-4514-acb0-6cf475978535.xlsx
```

## 📄 File Extensions Summary

| Extension | Files | Lines | Avg Lines/File |
|-----------|-------|-------|----------------|
| `.js` | 206 | 40,507 | 197 |
| `.json` | 46 | 17,205 | 374 |
| `.tsx` | 127 | 16,252 | 128 |
| `.ts` | 45 | 4,445 | 99 |
| `.css` | 1 | 630 | 630 |
| `.html` | 4 | 574 | 144 |
| `.yml` | 1 | 99 | 99 |
| `.sh` | 1 | 88 | 88 |
| `.local` | 1 | 76 | 76 |
| `.cmd` | 1 | 61 | 61 |
| `.mjs` | 2 | 41 | 21 |
| `.bak` | 1 | 35 | 35 |
| `.tsbuildinfo` | 1 | 1 | 1 |
| `.md` | 20 | 0 | 0 |
| `.jpg` | 14 | 0 | 0 |
| `.png` | 38 | 0 | 0 |
| `.svg` | 6 | 0 | 0 |
| `.ico` | 2 | 0 | 0 |
| `.webp` | 2 | 0 | 0 |
| `.pdf` | 3 | 0 | 0 |
| `.docx` | 1 | 0 | 0 |
| `.mp4` | 3 | 0 | 0 |
| `.pptx` | 1 | 0 | 0 |
| `.txt` | 1 | 0 | 0 |
| `.xlsx` | 9 | 0 | 0 |

## 🔧 Development Notes

- **Main Entry Point**: `bin/www`
- **Development Command**: `npm run dev`
- **Database**: PostgreSQL with Knex.js migrations
- **Key Dependencies**: Express.js, Firebase Admin, Axios, Knex
- **AI Integration**: Custom AgentsFlow system for conversation management
- **Authentication**: Firebase Admin SDK
- **Background Jobs**: Contact worker processing

