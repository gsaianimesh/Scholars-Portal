const fs = require('fs');

const orig = fs.readFileSync('src/app/onboarding/page.tsx', 'utf8');
fs.writeFileSync('src/app/onboarding/page.backup.tsx', orig);

fs.writeFileSync('src/app/onboarding/page.tsx', `"use client";
import React from 'react';
export default function OnboardingPage() { return <div>Test</div>; }
`);
