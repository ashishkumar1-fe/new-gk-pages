# 0005 — Cache freshness is one switch

[← ADRs](README.md)

Status: accepted · 2026-10-15

## Context

The tracker's handbook wants freshness-first (`staleTime: 0`, revalidate on every mount and focus); these docs proposed 30 s for lists and 60 s for detail. Both are reasonable, and the right one depends on real traffic.

## Decision

Queries declare a cache class (`list`, `detail`, `lookup`, `calc`), never a number. One policy object maps classes to `staleTime`, with `fresh` and `balanced` presets and one `ACTIVE_POLICY` constant. Start with `fresh`. See [data access](../resources/data-access.md#cache-policy).

Amended 2026-10-16 (tracker d42): start with `balanced` (30 s lists, 60 s detail); `refetchOnWindowFocus` on globally.

## Consequences

- Changing the policy is a one-line diff; no screen changes.
- Per-resource overrides need a comment saying why.
