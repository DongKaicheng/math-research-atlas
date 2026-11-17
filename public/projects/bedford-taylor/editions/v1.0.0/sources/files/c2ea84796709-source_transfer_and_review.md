# Root audit of the source transfer and the two main constructions

This is a mathematical audit of the printed sources, separate from the two agents that produced `range_graph_audit.md`, `dirichlet_audit.md`, and `seam_proof.md`. It is not peer review or formal verification. Hash checks establish byte identity only.

## Frozen input and a direct continuity calculation

We retain the previously verified fixed-background bounded BT core: mixed products of bounded continuous actual psh functions are symmetric, positive, separately closed, and satisfy the current recursion D(uT); compact CLN bounds and order-zero control apply on the original test spaces. Max stability and smooth full-test torus calibration are also retained. This run does not reopen the entire R1--R24 proof chain or invisible R21 bytes.

The local uniform continuity needed below follows directly from those core properties, rather than from an unspecified new convergence theorem. For two k-tuples of bounded continuous actual psh functions u_i and v_i, the mixed-product telescoping identity gives

    product_i Du_i wedge S - product_i Dv_i wedge S
      = sum_i D[(u_i-v_i) T_i],

where T_i is the mixed product using earlier u factors and later v factors, wedged with S. Each T_i is positive and separately closed. On an original compact smooth test eta, order-zero control and compact CLN give

    |< D[(u_i-v_i)T_i], eta >|
       = |< (u_i-v_i)T_i, D eta >|
       <= C_eta ||u_i-v_i||_infty,

provided all potentials have one common bound on a fixed slightly larger compact neighborhood. The constant is independent of the converging sequence; it is the compact CLN bound applied to the fixed controls for D eta. All multiplications by the continuous difference are the original order-zero multiplications in the frozen core. Thus locally uniform convergence gives convergence on every original smooth test. This is a direct corollary, not a new foundational BT theorem and not the unresolved strong continuity of arbitrary literal Radon data.

For the torus constructions, this calculation can be used entirely inside the protected moment neighborhood. Mollifications need not be global competitors: they are smooth convex functions on that neighborhood, where the local BT products are defined. A compact moment cutoff splits any original test into the changed neighborhood and the unchanged exterior. Properness of the torus moment map over compact real sets gives the required original compact supports.

## Root check of the clamped projection and graph

Read the full exact text of `range_graph_audit.md`. The critical regularity step is valid: the Poisson extension of C^{1,alpha} boundary data need not be C^{2,alpha}; multiplication by the defining quadratic factor supplies that missing derivative. Subtracting the tangent affine polynomial is legitimate when differentiating the kernel at a fixed point: the affine polynomial is held fixed during that differentiation and its higher derivatives vanish. The estimates delta D^2H=O(delta^alpha), D(delta D^2H)=O(delta^(alpha-1)) imply Hölder continuity by the two-case argument printed in that proof.

TE=I gives P^2=P and both traces of P h vanish. The identities K=D Pi and K Pi=K use the actual Dirichlet inverse. Hence the nonlinear iteration never assumes that its unprojected residual is in the clamped range. Applying Delta to the fixed-point equation gives C1 Delta h=g-Pi N(h); adding N(h) gives exactly g+Q N(h), with the plus sign shown in the source. The determinant expansion coefficients binom(n-k,q-k), including C1 and C2, agree with expansion of sigma_q(I+A) by principal minors.

The image of Q is harmonic by the explicit formula for Delta E. The moment argument identifies Q with the harmonic Bergman projection without assuming it has a Hölder bound from an Lp theorem. A second kernel-based proof has been supplied by the root in `root_extensions.md` and is being independently checked. The graph is infinite dimensional; no finite spherical-harmonic truncation is used.

For zero extension, h=0 and normal derivative zero imply the full gradient has zero boundary trace. The extension is globally C^{1,1} on the protected real patch, with distribution Hessian equal to its bounded piecewise Hessian. Consequently mollified Hessians have a common bound and converge almost everywhere. Dominated convergence of all Hessian minors proves that the real source density has no sphere mass. The preceding original BT telescoping estimate passes the left side of the smooth Gauss calibration to the actual limit. Therefore the full source equality is valid on every original compact smooth scalar test, including tests not pulled back from the original moment coordinates.

Negativity is a separate budget. It follows by requiring ||h||_infty to be less than half the positive margin min_B(-w), not from convexity alone. The unchanged exterior and the parent neighborhood extension give ordinary boundary values, the explicit lower barrier, finite total mass by compact CLN, bounded energies and eventually unchanged deep truncations. No representative is prescribed for an arbitrary completion element.

Conclusion: PASS for the stated fixed-background small Hölder graph. The term PROVED-INTERNAL refers to the exact theorem in these hypotheses, reusing the frozen bounded core; general C2 and LI13 stay OPEN.

## Root check of the spherical interface formula

Read the full exact text of `seam_proof.md`. The outward gradient jump is exterior minus interior = -b nu, so a convex gluing requires b<=0. The sign in the measure formula is consequently positive when b<0. The sphere tangential Hessian is (1+b/R)I: differentiating the constant boundary value twice along a great circle gives D^2z(e,e)=b/R. This also bounds |b|/R by the Hessian norm when n>=2.

The key smoothing argument does not multiply singular Hessians. In a layer of thickness epsilon, the convolved rank-one surface Hessian has normal-normal entry O(epsilon^-1), mixed entries O(1), and tangential entries O(epsilon). Adding the bounded bulk preserves these bounds. A Newton cofactor with one normal row or column removed cannot contain the large normal-normal entry; only its tangential block can grow as epsilon^-1. The latter multiplies tangential gradient O(epsilon), because both one-sided gradients of the continuous profile are normal on the sphere. Thus the full Newton flux is uniformly bounded in the layer, and its integral over that layer tends to zero.

Away from the sphere the flux converges classically; hence it converges locally in L1 everywhere. Its distributional divergence has the jump of the classical normal flux. The interior flux equals C1(R+b)(1+b/R)^(q-1); the exterior flux equals C1 R. Division by q yields

    J(b)=C1 R/q [1-(1+b/R)^q].

The polynomial is positive for -R<b<0 and zero exactly at b=0. Local mass bounds for the positive mollified densities follow by a compact cutoff and the uniform flux bound, so convergence holds against continuous compact real tests. That is sufficient for eta composed with the Gauss section. Local uniform BT convergence then proves the original full-test formula with this surface measure.

At C^{2,alpha} regularity the Newton divergence identity and integration by parts hold by C^2 approximation of the classical pieces on the closed ball; they do not require third classical derivatives. A C^2 extension to a slightly larger neighborhood followed by convolution suffices for this auxiliary real calculation. This regularity point is now explicit.

The constant-density check gives J=-Rf0/n and exactly cancels the negative bulk total mass; it agrees with the formula but is not its proof. For arbitrary small f<=0, the integrated Newton tensor minimum principle gives z>=0 and hence b<=0, so the construction applies without a radial assumption. It prescribes the interior datum and determines an additional sphere measure. It must not be advertised as solving the same datum after silently adding that measure.

Conclusion: PASS for the explicit sphere-compensated family and its full original source formula.

## Root check of the stronger individual obstruction

For the parent's h_*=x_1 chi(r), the Dirichlet iteration gives z_s=s h_*-(C2/C1)s^2 D[sigma_2(D^2h_*)]+O_{C^{2,alpha}}(|s|^3). Green's formula pairs its boundary normal trace with H=x_1^2-x_2^2 to a strictly negative nonzero coefficient at order s^2. Thus the trace is nonzero for every sufficiently small nonzero s, with an actual remainder estimate, not an assumed differentiable family.

The source line has zero total added mass. The exact interior Newton flux identity therefore forces the integral of (1+b/R)^q-1 on the sphere to be zero. Since b is continuous, |b|/R<1/2, and b is not identically zero, b has both signs. The inside solution cannot be convexly glued to the fixed exterior quadratic profile.

For another C^2 convex interior solution, integrate the Newton tensor along the segment from the constructed strictly convex solution. It is uniformly elliptic because the segment Hessian is at least (1-t)cI and the integral of (1-t)^(q-1) is 1/q. The maximum principle identifies the two Dirichlet solutions. Thus the obstruction excludes each individual sufficiently small nonzero datum in the fixed C^2 convex patch class, even if a competitor was not assumed small. It does not exclude non-toric original potentials, arbitrary completion elements, or a changed exterior potential.

Conclusion: PASS as a restricted original-category obstruction. Its stronger scope compared with the parent smooth-family obstruction is recorded; no general nonexistence theorem is inferred.

## Nonradial reference and final interface review

Root read the full `nonradial_seam_extension.md` and checked (NS3)--(NS7). The distribution Hessian contains only the rank-one normal surface matrix; in convolution its TT part is O(epsilon), nT part O(1), and nn part O(epsilon^-1). The smooth bulk TT interpolation is the convex segment A_T+eta b I/R. Every q-principal minor has at most one nn entry, so multiplying its density by epsilon eliminates the bounded remainder. Coarea and eta'=-k give the stated integral from b to zero, with positive sign. This proof correctly avoids using a bounded Newton flux when the boundary gradient has nonzero tangential component. The affine-reference check detects exactly why the earlier flux proof could not be reused. PASS under the printed strict convexity and regularity assumptions.

The corrected prescribed-surface graph has matching zero function traces and normal gradient-trace jump -psi nu. Its Hessian, not its distribution gradient, carries the surface measure. The normalized real sphere density s must be multiplied by K_q=q!(n-q)! for the original source. The explicit inverse for psi(s) is certified only for the quadratic reference; general C^{2,alpha} v has only C^alpha tangent Hessian coefficients. These corrections were independently audited.

For `order_ideal_interface.md` §§3--4, the bulk/surface positivity budgets prove (O7). With a nonradial reference W use A+W for source domination; W in X_A has not been asserted. The uncountable moving-radius obstruction uses only absolute continuity for each radius, not a uniform bound on the ideal norms. It is therefore valid in the full completed cone.

The moving-sphere ED separation proof passed separate audit. Its mathematical mechanism was already proved in R12 CG1--CG10, whose exact source was recovered and read this run. This realization in every n>=2 is retained as an illustrative extension, not a new C1 breakthrough. The simplified non-Radon proof uses uniform convergence on one fixed compact set and local total variation of a signed Radon measure.
