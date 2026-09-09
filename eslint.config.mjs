import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

const supabaseAdminImport = {
  paths: [
    {
      name: '@/server/admin/client',
      message:
        'supabaseAdmin is banned outside src/server/admin, src/app/api/webhooks, src/app/api/cron and supabase/seed.ts.',
    },
  ],
  patterns: [
    {
      group: ['**/server/admin/client', '**/admin/client'],
      message:
        'supabaseAdmin is banned outside src/server/admin, src/app/api/webhooks, src/app/api/cron and supabase/seed.ts.',
    },
  ],
};

const supabaseAdminSyntax = {
  selector: "Identifier[name='supabaseAdmin']",
  message:
    'supabaseAdmin is banned outside src/server/admin, src/app/api/webhooks, src/app/api/cron and supabase/seed.ts.',
};

const leadsSyntax = {
  selector:
    "CallExpression[callee.property.name='from'][arguments.0.value='leads']",
  message:
    'Raw leads table access is banned. Use src/server/repositories/leads.ts or the lead_pool view.',
};

const moneySyntax = {
  selector: "Identifier[name='parseFloat']",
  message: 'No floating-point arithmetic on money. All amounts are bigint cents.',
};

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  ...tseslint.configs.recommended,
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    files: ['src/**/*.{ts,tsx}', 'supabase/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', supabaseAdminImport],
      'no-restricted-syntax': [
        'error',
        supabaseAdminSyntax,
        leadsSyntax,
        moneySyntax,
      ],
    },
  },
  {
    files: ['src/server/repositories/leads.ts'],
    rules: {
      'no-restricted-syntax': ['error', supabaseAdminSyntax, moneySyntax],
    },
  },
  {
    files: [
      'src/server/admin/**/*.{ts,tsx}',
      'src/app/api/webhooks/**/*.{ts,tsx}',
      'src/app/api/cron/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': 'off',
      'no-restricted-syntax': ['error', leadsSyntax, moneySyntax],
    },
  },
  {
    files: ['supabase/seed.ts', 'supabase/seed/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': 'off',
      'no-restricted-syntax': ['error', moneySyntax],
    },
  },
  {
    files: ['src/server/services/money.ts'],
    rules: {
      'no-restricted-syntax': ['error', supabaseAdminSyntax, leadsSyntax],
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'coverage/**',
      'next-env.d.ts',
      'src/lib/types/database.ts',
    ],
  },
];

export default eslintConfig;
