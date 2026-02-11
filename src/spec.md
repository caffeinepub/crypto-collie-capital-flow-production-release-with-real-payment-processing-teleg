# Specification

## Summary
**Goal:** Keep the selected trading pair (symbol) synchronized across the Opportunity Recognition (Oportunidades), Market (Market Turn Monitor), and Checklist (3m checklist) dashboard tabs.

**Planned changes:**
- Introduce a single shared “selected trading pair” state at the Dashboard level and wire it to the symbol selectors/inputs used by the Opportunity Recognition, Market, and Checklist tabs.
- Update OpportunityRecognitionPanel to expose a symbol-selection callback (e.g., `onSelectSymbol(symbol)`) that is invoked when an opportunity row is clicked, so it updates the shared symbol while preserving the existing details dialog behavior.
- Ensure the shared symbol defaults to `BTCUSDT` on first load (matching current behavior).

**User-visible outcome:** Selecting a symbol in any of the three tabs automatically updates the selected symbol in the other two tabs, and the Market Turn Monitor and 3m Checklist panels render using the same currently selected trading pair.
