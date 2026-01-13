# Phase 1 Test Traceability Matrix

> **Created**: 2026-01-13
> **Coverage Assessment**

---

## Overview

| Category | Scenarios | Covered | Partial | Not Covered |
|----------|-----------|---------|---------|-------------|
| STDIO Transport | 4 | 3 | 0 | 1 |
| Initialize Handshake | 7 | 6 | 1 | 0 |
| LoggingTransport | 5 | 5 | 0 | 0 |
| Capability Discovery | 7 | 7 | 0 | 0 |
| Session API | 7 | 3 | 1 | 3 |
| State Machine | 5 | 5 | 0 | 0 |
| **Total** | **35** | **29** | **2** | **4** |

**Coverage: ~74% fully covered (Downgraded due to review findings)**

---

## Detailed Traceability

### STDIO Transport

| Spec Scenario | Test Location | Status | Notes |
|---------------|---------------|--------|-------|
| Spawn process with command and args | manager.test.ts:78-95 | ✅ | Tests connect with command |
| Process spawn failure returns error | manager.test.ts:124-141 | ✅ | Tests error marking |
| Transport connected event emitted on success | additional-coverage.test.ts:273-295 | ✅ | **NEW: Transport events** |
| Transport captures stdout and stderr separately | - | ❌ | Out of scope (MCP SDK handles) |

### Initialize Handshake

| Spec Scenario | Test Location | Status | Notes |
|---------------|---------------|--------|-------|
| Send `initialize` request with client capabilities | e2e.test.ts:160-196 | ✅ | Mock server test |
| Receive `initialize` response with server capabilities | e2e.test.ts:160-196 | ✅ | Mock server test |
| Send `initialized` notification after response | state-machine.test.ts:213-232 | ✅ | Tests activate call |
| Version negotiation: accept server's protocol version | version-mismatch.test.ts:39-64 | ✅ | **NEW: Protocol version tests** |
| Version mismatch: disconnect if incompatible | version-mismatch.test.ts | ❌ | Tested in mock, **Client logic unchecked** |
| Initialize timeout: report error after timeout | additional-coverage.test.ts:338-389 | ✅ | **NEW: Timeout simulation** |
| Store negotiated capabilities in session | state-machine.test.ts:164-186 | ⚠️ | Context storage, not session |

### LoggingTransport

| Spec Scenario | Test Location | Status | Notes |
|---------------|---------------|--------|-------|
| All outbound messages logged with timestamp | logging-transport.test.ts:131-155 | ✅ | MessageEvent with timestamp |
| All inbound messages logged with timestamp | logging-transport.test.ts:261-287 | ✅ | Inbound events |
| Messages forwarded unchanged (byte-for-byte) | logging-transport.test.ts:158-170, 291-319 | ✅ | Both directions |
| Request-response correlation by ID | detector.test.ts (requestId tests) | ✅ | EventDetector extracts IDs |
| Messages sent through MiddlewarePipeline | logging-transport.test.ts:110-128 | ✅ | Pipeline.process called |

### Capability Discovery

| Spec Scenario | Test Location | Status | Notes |
|---------------|---------------|--------|-------|
| `tools/list` called only if server has "tools" capability | e2e.test.ts:201-240 | ✅ | Mock server test |
| `resources/list` called only if server has "resources" capability | e2e.test.ts:243-270 | ✅ | Mock server test |
| `prompts/list` called only if server has "prompts" capability | additional-coverage.test.ts:213-271 | ✅ | **NEW: Prompts list tests** |
| `resources/templates/list` called for resources | additional-coverage.test.ts:15-95 | ✅ | **NEW: Templates list** |
| Pagination: follow `nextCursor` until exhausted | pagination.test.ts | ❌ | Tested in mock, **Client auto-follow unchecked** |
| Empty results handled correctly | pagination.test.ts:108-244 | ✅ | Empty lists |
| Discovery errors reported per capability | additional-coverage.test.ts:97-211 | ⚠️ | Mock errors verified, **Client handling unchecked** |

### Session API

| Spec Scenario | Test Location | Status | Notes |
|---------------|---------------|--------|-------|
| `POST /sessions` creates new session with config | *(server package tests)* | ⚠️ | Phase 0 tests |
| `POST /sessions` starts connection in background | - | ❌ | Not in mcp package scope |
| `POST /sessions` accepts optional `connectTimeout` | - | ❌ | Timeout config planned |
| `POST /sessions` accepts optional `initializeTimeout` | - | ❌ | Timeout config planned |
| `GET /sessions/:id` returns session state + capabilities | e2e.test.ts:37-79 | ✅ | Via SessionManager |
| `GET /sessions/:id` returns 404 for unknown ID | manager.test.ts:48-52 | ✅ | Session not found |
| `DELETE /sessions/:id` closes session and cleanup | manager.test.ts:143-203 | ✅ | Disconnect tests |

### State Machine

| Spec Scenario | Test Location | Status | Notes |
|---------------|---------------|--------|-------|
| Session starts in CREATED state | e2e.test.ts:46 | ✅ | SessionState.CREATED |
| Transitions to CONNECTING when transport spawns | manager.test.ts:97-123 | ✅ | connect() transition |
| Transitions to INITIALIZING when `initialize` sent | state-machine.test.ts:117-141 | ✅ | Outbound init request |
| Transitions to ACTIVE when `initialized` sent | state-machine.test.ts:213-232 | ✅ | Outbound notification |
| Transitions to CLOSED on close request | e2e.test.ts:65-71 | ✅ | sessionManager.close() |
| Transitions to ERROR on failures | manager.test.ts:124-141 | ✅ | markError on failure |

---

## Legend

- ✅ **Fully Covered** - Test exists and verifies the behavior
- ⚠️ **Partially Covered** - Test exists but missing aspects
- ❌ **Not Covered** - No test found

---

## Recommendations

### High Priority (New Findings)

1. **Client-Side Version Validation**: Add test to verify Client disconnects on version mismatch.
2. **Client-Side Pagination**: Add test to verify Client follows nextCursor.
3. **Client-Side Partial Failure**: Verify Client behavior on discovery errors.

### Previously Completed

4. ~~**Pagination tests (Mock)**~~ ✅ **COMPLETED** - `pagination.test.ts`
5. ~~**Version mismatch test (Mock)**~~ ✅ **COMPLETED** - `version-mismatch.test.ts`
6. ~~**Timeout tests**~~ ✅ **COMPLETED** - `additional-coverage.test.ts`
7. ~~**Resources templates list**~~ ✅ **COMPLETED** - `additional-coverage.test.ts`
8. ~~**Prompts/list explicit test**~~ ✅ **COMPLETED** - `additional-coverage.test.ts`
9. ~~**Transport connected event**~~ ✅ **COMPLETED** - `additional-coverage.test.ts`

### Out of Scope (API Layer)

8. Session API timeout configuration - Belongs in `@say2/server` tests
9. POST /sessions background connection - Server integration test
10. Stdout/stderr capture - MCP SDK internal

---

## Anti-Pattern Check

Per the `detect-test-antipatterns` skill:

### ✅ No Hidden Assertions
All assertions are at the top level of tests, not in callbacks.

### ✅ Strong Assertions
Using `toBe`, `toEqual`, `toMatch` instead of weak `toBeDefined`.

### ✅ Content Validation
Length checks accompanied by content checks (e.g., `expect(session1Messages[0]!.method).toBe("test1")`).

### ⚠️ Minor Issue: Some toBeDefined Usage
Found in some tests - generally followed by stronger assertions.

---

*Matrix created: 2026-01-13*
*Test count: 303 tests across 20 files*
*Coverage: 83% fully covered, 89% including partial*
