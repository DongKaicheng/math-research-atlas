# The constructed range and the original additive order ideal

Status: root derivation for independent review. The statements below are an interface lemma and direct corollaries of this round's source constructions and the frozen R17 LI2--LI8 module. They are not a proof of LI13, general C1, or general C2.

## 1. An actual embedding for clamped corrections

Use the original torus reference w from the parent: it is quadratic on B_(2R), negative on the original Laurent box, and extends as bounded psh to a neighborhood of its closure. Let m=min_(Bbar_R)(-w)>0. Let X=C^{2,alpha}(Bbar_R), with norm controlling the supremum and every Hessian entry, and let h have zero Dirichlet and normal traces on the sphere. Write tilde h for its zero extension. Set

    C_w=2 max{n,1/m},    a=C_w ||h||_X.

Then both a w+tilde h and a w-tilde h are actual admissible nonpositive psh functions. For h=0 use the zero cone element. For nonzero h, on B_R their Hessians are aI +/- D^2h>=0 and their values are at most -a m+||h||_infty<0. The matched zero gradient introduces no interface current. Outside B_R they equal a w, and the open collar glues them to the unchanged reference. Their ordinary boundary values, lower-barrier bounds, neighborhood extensions, finite masses, bounded energies and no-loss properties follow exactly as in the parent actual-core qualification. In particular this proves additive cone inequalities, not just inequalities of values.

This elementary construction works for every permitted original background S extending to the same compact neighborhood: actual psh positivity is established before wedging with S, and compact CLN gives the required finite masses. If w represents a nonzero element in that background's frozen completed cone, R17 LI2--LI4 therefore give

    tilde h in X_w,
    ||tilde h||_w <= C_w ||h||_X,
    ||tilde h||_ed <= 2 r(w) C_w ||h||_X.               (O1)

Here r(w)=e(w)^(1/(q+1)) and ||.||_ed is precisely the frozen energy-difference norm, not a newly identified Q-order or capacity norm. If w is zero in that relative cone, the same additive inequalities force the displayed differences to be zero there; no nonzero principal-ideal claim is made.

For a known nonradial reference W with D^2v>=cI on the changed ball, replace n by n/c and m by min(-W). The same proof applies; all constants depend on that specified reference.

For the graph construction with S=beta^(n-q)[X], (O1) and the proved Hölder Lipschitz bound give

    ||u_g-u_g'||_ed <= [4 r(w) C_w ||K||/C1] ||g-g'||_{C^alpha}. (O2)

If C_w||h(g)||_X<=a0<1, the already frozen additive-order mixed positivity yields actual Borel Radon bounds

    (1-a0)^q mu_w <= mu_(u_g) <= (1+a0)^q mu_w.          (O3)

This is a consequence of the explicit two-sided psh construction, not a deduction from pointwise order. Likewise LI6 and polynomial telescoping give

    |mu_(w+h)-mu_(w+k)|
      <= q(1+a0)^(q-1) ||h-k||_w mu_w                  (O4)

for two perturbations in that ideal ball. These are the frozen polynomial domination consequences restricted to the newly constructed graph. They do not prove an inverse on all L-infinity data, and do not resolve strong continuity for arbitrary literal Radon data.

## 2. Compatible nearby sources outside this principal ideal

The positive sphere compensator gives a useful opposite check. Define the continuous compact real function

    psi(x)=(R^2-|x|^2)/2 for |x|<R, and psi=0 outside.

For 0<t<=t0<1/2, with t0 additionally chosen small enough for negativity of w+t0 psi, put u_t=w+t psi. In the ball its Hessian is (1-t)I; at the sphere its gradient jump is t R nu. Hence u_t is an actual bounded psh potential with the same exterior, ordinary boundary and core qualifications as w. This is a direct explicit instance of `seam_proof.md`, not a new general existence mechanism.

Let E be the image of the sphere under the Gauss section and put d_t=1-(1-t)^q>0. The full original source formula is

    mu_(u_t)-mu_w
      = -n! d_t sigma_*(1_B dx)
        +q!(n-q)! [C1 R/q] d_t sigma_*(dS).             (O5)

The bulk and sphere terms are mutually singular, carried respectively by the disjoint sets sigma(B) and sigma(boundary B), and have opposite signs. Their topological supports need not be disjoint. Since C1/q=binom(n,q)/n and |B|=R|sphere|/n,

    ||mu_(u_t)-mu_w||_TV=2 n! |B| d_t ->0.             (O6)

Here total variation means the total mass of the absolute signed measure, without the alternative probabilistic factor 1/2. The original moment map and Gauss section are continuous and the sphere is compact, so E is a compact Borel set in the Hausdorff analytic space. Smooth calibration gives mu_w(E)=0, whereas (O5) gives mu_(u_t)(E)>0.

Nevertheless u_t-w does not belong to X_w for any t>0. If it did, frozen LI6 applied to the finite polynomial expansion of mu_(w+(u_t-w)) would make every term absolutely continuous with respect to mu_w, and hence mu_(u_t)<<mu_w. That contradicts the positive mass on E. Equivalently, at the real profile level no finite multiple of the smooth reference curvature on the sphere controls both signs of the nonzero singular jump.

This absence of a finite X_w norm is compatible with convergence in the frozen strong energy-difference space. The curve is affine:

    u_t-w=(t/t0)(u_(t0)-w),

where u_(t0) and w are fixed cone members. Homogeneity of ||.||_ed therefore gives ||u_t-w||_ed ->0. More explicitly let A=w+u_(t0). Then

    (1/t0) A+psi=(2/t0)u_(t0),
    (1/t0) A-psi=(2/t0)w.

Thus psi belongs to the larger actual principal ideal X_A, with norm at most 1/t0, and LI4 gives ||u_t-w||_ed<=2 r(A)t/t0. This is one common controlling potential for the entire explicit family, not a claim that every strongly convergent family admits such a control.

The consequence for the research program is precise: even a full local graph inside X_w cannot be asserted to exhaust a strong energy neighborhood of compatible actual sources. New interface masses can appear in compatible potentials arbitrarily close to w in that strong norm. This is not a counterexample to C1; the constructed family actually has good continuity and a common larger ideal. It also does not identify any of the three completions.

## 3. A common ideal for the fixed-interface graph

Retain A=w+u_(t0)=2w+t0 psi from section 2. On B_R its Hessian is (2-t0)I, on the sphere it has positive Hessian surface coefficient t0 R, and on the unchanged exterior it equals 2w. Let k be any C^{2,alpha} function on Bbar_R with zero Dirichlet trace, not necessarily zero normal trace, and extend it by zero. Put b_k=partial_nu k. Its distribution Hessian has bulk D^2k and surface coefficient -b_k in the normal direction. If a satisfies

    a(2-t0)>=||D^2k||_op,
    a t0 R>=||b_k||_infty,
    a min_(Bbar_R)(-A)>=2||k||_infty,

then both aA+tilde k and aA-tilde k are actual admissible psh functions: their bulk Hessians and their normal surface coefficients are nonnegative, their values are nonpositive with a strict negative margin on the changed compact set, and outside they equal aA. Their finite mass and core conditions follow by the same original neighborhood/CLN argument. Since all three right-hand sides are bounded by a fixed constant times ||k||_{C^{2,alpha}}, there is a finite C_A with

    ||tilde k||_A<=C_A ||k||_{C^{2,alpha}}.              (O7)

For k=0 use zero. Applied to differences of the two-parameter solutions in `prescribed_surface_graph.md`, this proves Lipschitz continuity in the frozen energy-difference norm on each common parameter budget. For reference w, one also has w in X_A, so LI6 gives measure domination and Lipschitz source estimates in X_A. For a different nonradial reference W, enlarge the anchor to A_W=A+W: X_A is contained in X_(A+W), and W belongs to that larger ideal. Thus LI6 yields those source estimates with the common enlarged anchor A_W; W in X_A is not assumed. These are direct polynomial/order consequences for the explicit fixed-interface sector, not general C1.

## 4. Why a single ideal does not cover arbitrarily moving interfaces

Fix 0<R_-<R_+ inside the quadratic protected region, and one small t>0 preserving negativity for every radius in that interval. For each R in [R_-,R_+] construct the section-2 actual potential u_R=w+t psi_R. Let E_R be the Gauss image of its radius-R sphere. These are pairwise disjoint compact Borel sets, all lying in one fixed original compact moment annulus, and mu_(u_R)(E_R)>0 by the full source formula. The reference has mu_w(E_R)=0.

There cannot be a single cone member A such that every u_R-w belongs to X_A. Indeed replace A by A+w, so that both w and all those differences belong to X_(A+w). LI6 would then imply mu_(u_R)<<mu_(A+w) for every R. The locally finite Radon measure mu_(A+w) would have positive mass on uncountably many pairwise disjoint Borel subsets E_R of one compact set. This is impossible: for each positive integer m only finitely many disjoint subsets can have mass >=1/m, and every positive mass exceeds 1/m for some m.

The conclusion does not say that no countable family has a common control, and it makes no claim about continuity of R->u_R in the frozen energy-difference norm. Uniform convergence of the real profiles as R varies is not automatically convergence in that norm. This is only a precise limitation of a single-principal-ideal method on this explicit uncountable family.
