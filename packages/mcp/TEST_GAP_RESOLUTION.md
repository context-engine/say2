# Test Gap Resolution Plan

**Date**: 2026-01-13
**Status**: Gaps Identified & Confirmed

## confirmed Gaps

We have confirmed the following discrepancies between requirements and implementation behavior using targeted client verification tests (`client-verification.test.ts`).

### 1. Version Mismatch Handling
- **Requirement**: Client must disconnect if server version is incompatible.
- **Current Behavior**: Client connects successfully to version `0.1.0` (Requirement: `1.0.0`).
- **Test Evidence**: `client-verification.test.ts` > "Version Negotiation".
- **Resolution Plan**:
  - Implement version check logic in `McpClientManager` or `StateMachineMiddleware`.
  - Upon receiving `initialize` response, validate `protocolVersion`.
  - If invalid, call `client.close()` and transition to Error state.

### 2. Pagination Auto-Following
- **Requirement**: Client must follow `nextCursor` until exhausted.
- **Current Behavior**: `client.listTools()` returns only the first page (3 items instead of 10).
- **Test Evidence**: `client-verification.test.ts` > "Pagination Auto-Following" (Skipped).
- **Resolution Plan**:
  - **Option A (Wrapper)**: Create a `PaginatedClient` wrapper or helper functions in `McpClientManager` that recursively call list methods.
  - **Option B (Upstream)**: Check if `@modelcontextprotocol/sdk` supports auto-pagination via config (unlikely based on current tests).
  - **Option C (Spec Update)**: Downgrade requirement if auto-pagination is not desired at this layer. **Recommendation**: Implement wrapper for "System 2" agentic behaviors.

### 3. Partial Failure Handling (Verified)
- **Requirement**: Discovery errors reported per capability.
- **Current Behavior**: Client throws error for failed capability call but allows other calls to succeed.
- **Status**: ✅ Acceptable. No gap in logic, but test coverage was missing until now.

## Action Items

1. [ ] Implement `checkProtocolVersion` in `StateMachineMiddleware`.
2. [ ] Implement `autoPaginate` helper or wrapper in `client/pagination.ts`.
3. [ ] Enable skipped tests in `client-verification.test.ts`.
