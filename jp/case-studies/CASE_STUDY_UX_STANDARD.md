
Case study development follows the CASE_STUDY_UX_STANDARD.md guidelines.

AndanteFit Case Study UX Standard

Version 1.0
Applies to: All KO / EN / ES Case Study HTML Files

1. Purpose

This document defines the visual and readability standards for all AndanteFit case study pages.

It ensures:

Consistent typography hierarchy

Improved readability

Stable mobile behavior

Brand consistency

Safe non-structural updates

These rules apply to all future case study additions.

2. Non-Negotiable Constraints

Do not modify DOM structure.

Do not add or remove wrappers.

Do not change component hierarchy.

Adjustments must be class-level (Tailwind utilities) only.

Structural refactoring is handled separately.

3. Typography Standards
3.1 Header Hierarchy

Category line spacing: mb-2

h1 / h2 headings: tracking-tight

Headings use leading-tight

3.2 Body Text Rules

Main explanatory text: text-sm

Captions / labels / metadata only: text-xs

All body text must include leading-relaxed

Never use text-xs for paragraph-level explanatory text.

4. Density & Layout Balance
4.1 Dense Slides (e.g., Clinical / Consensus)

Allowed adjustments:

Card padding: p-6 → p-5

Reduce gap slightly if necessary

Do not reduce core text size to fix density.

4.2 Dark Background Contrast

For explanatory text on dark backgrounds:

Use text-slate-300

Avoid text-slate-400 for main descriptions

5. Responsive & Mobile Rules
5.1 Height

Fixed heights are not allowed:

Avoid h-[...] or md:h-[...]

Use min-h-[...] instead

5.2 Touch Targets

Interactive elements must have minimum 44px height.

5.3 Images

Use loading="lazy"

Use decoding="async"

Maintain object-contain unless layout requires otherwise

6. Font & Brand Consistency

Primary font: Pretendard

Do not use Noto Sans or mixed font stacks

Brand variables in :root:

--af-primary

--af-secondary

--af-accent

Do not introduce arbitrary new accent colors.

7. Page Creation Checklist

Before merging any new case study page, confirm:

Body text uses text-sm + leading-relaxed

Category spacing uses mb-2

No fixed heights are present

Dark slides use text-slate-300

Pretendard is the primary font

No DOM structural changes were introduced

8. Approval Criteria

A case study page is acceptable when:

Text does not visually resemble footnotes on desktop

Hierarchy is immediately distinguishable

Mobile view has no clipping

Dark slides remain comfortably readable

Layout density feels balanced without shrinking text

End of Standard.

────────────────────────────



Follow CASE_STUDY_UX_STANDARD.md when generating or modifying case study pages.
