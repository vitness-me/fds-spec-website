# Self-test page

A stale region:

<!-- fds:generated fxi#symmetry -->
| Code | Meaning |
|---|---|
| `b` | Both. |
<!-- /fds:generated -->

A region nothing renders:

<!-- fds:generated fxi#nope -->
<!-- /fds:generated -->

Valid: `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back`, `FXE=1.0S/k:imp/f:bar.straight`, `FXM=1.0/gluteus-maximus` and the bare header `FXI=1.0`.

Broken: `FXI=1.0S/o:standing/m:hip.ext/l:bb@back` (layer order), `FXI=1.1S/m:hip.ext/o:standing/l:bb@back` (header), `FXI=1.0S/m:hip.flex/o:standing/l:bb@shoulders` (codes), `FXE=1.0N/k:imp/f:bar.straight` (flag), `FXM=1.0/Gluteus` (token).
